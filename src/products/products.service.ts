import { Injectable, InternalServerErrorException, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
    return await this.productRespository.find({
      take: limit,
      skip: offset
      // TODO: Relaciones
    }); 
  }

  async findOne(id: string) {
    
    let product: Product;

    if( isUUID( id ) ) {
      product = await this.productRespository.findOneBy({id});
    }else {
      const queryBuilder = this.productRespository.createQueryBuilder(); // Para crear QUERYS personalizadas
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: id.toUpperCase(),
          slug: id.toLowerCase()
        }).getOne();
    }

    if( !product ) throw new NotFoundException(`El producto con id: ${ id } no existe`);
    return product;

  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    
    const product = await this.productRespository.preload({
      id: id,
      ...updateProductDto,
      images: []
    }); 

    if( !product ) throw new NotFoundException(`El producto con id: ${id} no existe`)
    
    try {
      await this.productRespository.save( product );
      return product; 
      
    } catch (error) {
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
}

