import { Injectable, InternalServerErrorException, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

import { validate as isUUID } from 'uuid'
import { ProductImage, Product } from './entities';


@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductService');

  constructor(
    @InjectRepository(Product)
    private readonly productRespository: Repository<Product>,
    
    @InjectRepository(ProductImage)
    private readonly producImagesRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource
  ){}

  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto;

      const producto = await this.productRespository.create({
        ...productDetails,// Se exparsen las demas propiedades del producto
        images: images.map( image => this.producImagesRepository.create({ url: image }))// Se recorre las imagenes que vengan y se va creando la ProductImage una por una
      });

      await this.productRespository.save( producto );
      return producto;

    } catch (error) {
      this.handleDBExceptions(error);      
    }
  }

  async findAll( paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    
    const products= await this.productRespository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
    }); 

    return products.map( ( product ) => ({
      ...product,
      images: product.images.map( img => img.url ) // Para solo devolver la url de la imagen
    }));

  }

  async findOne(id: string) {
    
    let product: Product;

    if( isUUID( id ) ) {
      product = await this.productRespository.findOneBy({id});
    }else {
      const queryBuilder = this.productRespository.createQueryBuilder('prod'); // Para crear QUERYS personalizadas (Un alias pata la tabla)
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: id.toUpperCase(),
          slug: id.toLowerCase()
        })
        .leftJoinAndSelect('prod.images', 'prodImages') // Para traer los datos relacionados, en este caso de la tabla prod las imagenes, y prodImages se llamaran las images
        .getOne();
    }

    if( !product ) throw new NotFoundException(`El producto con id: ${ id } no existe`);
    return product;

  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const { images, ...dataUpdate } = updateProductDto;
    
    const product = await this.productRespository.preload({id, ...dataUpdate }); 
   
    if( !product ) throw new NotFoundException(`El producto con id: ${id} no existe`);

    // Create query runner
    const queryRunner = this.dataSource.createQueryRunner(); // Para realziar varias query SQL sin impactar la BD hasta que se haga el commit 
    await queryRunner.connect(); 
    await queryRunner.startTransaction();
    
    try {

      if( images ){
        await queryRunner.manager.delete( ProductImage, { product: { id } }) // Si vienen imagenes en el body, eliminamos las que hay guardadas para es id de producto

        product.images = images.map(
          image => this.producImagesRepository.create({ url: image }) // Creamos las instancias de las nuevas imagenes que vienen
        )

      }else {
        // ???
        product.images = await this.producImagesRepository.findBy({ product: { id }})
      }

      await queryRunner.manager.save( product ); // Guardamos el producto con las imagenes nuevas

      await queryRunner.commitTransaction(); // Si hasta aquí no ha habido ningun error se impacta la BD, de lo contrario se cancela todo lo anetrior inlcuyendo la eliminación de las imagenes
      await queryRunner.release(); // Se cierra el queryRunner y no funciona mas

      //await this.productRespository.save( product );
      return product; 
      
    } catch (error) {

      await queryRunner.rollbackTransaction(); // Para revertir todas las transacciones SQL quese hicieron
      await queryRunner.release(); 

      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {

    const product = await this.findOne(id);
    await this.productRespository.remove( product );

    return 'Producto eliminado con exito';
  }


  private handleDBExceptions ( error: any ){
    if(error.code === '23505'){
      throw new BadRequestException(error.detail);
    }
    
    this.logger.error(error)
    throw new InternalServerErrorException('Error desconocido, revisar logs del servidor');
  }

  async deleteAllProducts(){
    const query = this.productRespository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();
        
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
}

