import { Type } from "class-transformer";
import { IsOptional, IsPositive, Min } from "class-validator";

export class PaginationDto {

    @IsPositive()
    @IsOptional()
    @Type( () => Number ) // Convertir lo que venga en un numero
    limit?: number;
    
    @IsOptional()
    @Min(0)
    @Type( () => Number ) // Convertir lo que venga en un numero
    offset?: number;
}