import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class TestValidationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  age!: number;
}
