import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductImage } from "./product-image.entity";

@Entity({ name: 'products'})
export class Product {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', {
        unique: true
    })
    title: string;

    @Column('float', {
        default: 0
    })
    price: number;

    @Column('text', {
        nullable: true
    })
    description: string;

    @Column('text', {
        unique: true
    })
    slug: string;

    @Column('int', {
        default: 0
    })
    stock: number;

    @Column('text', {
        array: true
    })
    sizes: string[];

    @Column('text')
    gender: string;

    @Column( 'text', {
        array: true,
        default: []
    })
    tags: string[];

    @OneToMany(// Un producto podrá tener mas de una imagen
        () => ProductImage,
        (productImage) => productImage.product,
        { cascade: true, eager: true } //Con el eager lo que se hace es cuando busquen un producto ya sea todos o por id, muestre su relación también
    ) 
    images?: ProductImage[];
    

    @BeforeInsert()
    checkSlugInsert() { // Se ejecuta antes de insertar en la BD

        if (!this.slug) {
            this.slug = this.title
        }

        this.slug = this.slug
            .toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll("'", '')
    }

    @BeforeUpdate()
    checkSlugUpdate(){
        this.slug = this.slug
            .toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll("'", '')
    }
}
