import { Injectable, InternalServerErrorException, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

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

  async findAll() {
    return await this.productRespository.find(); 
  }

  async findOne(id: string) {
    
    const product= await this.productRespository.findOneBy({id});
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

