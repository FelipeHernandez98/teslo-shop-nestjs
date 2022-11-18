import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity()
export class ProductImage {

    @PrimaryGeneratedColumn()
    id: number;
    
    @Column('text')
    url: string;

    @ManyToOne(// Muchas imagenes pueden tener un unico porducto
        () => Product,
        ( product ) => product.images
    ) 
    product: Product
}