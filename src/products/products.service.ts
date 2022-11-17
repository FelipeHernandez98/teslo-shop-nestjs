import { Injectable, InternalServerErrorException, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { Product } from './entities/product.entity';

import { validate as isUUID } from 'uuid'


@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductService');

  constructor(
    @InjectRepository(Product)
    private readonly productRespository: Repository<Product>,
  ){}

  async create(createProductDto: CreateProductDto) {
    try {

      const producto = this.productRespository.create(createProductDto);
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
        .where('title =:title or slug =:slug', {
          title: id,
          slug: id
        }).getOne();
    }

    if( !product ) throw new NotFoundException(`El producto con id: ${ id } no existe`);
    return product;

  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
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

