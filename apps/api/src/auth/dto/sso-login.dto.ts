import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class SsoLoginDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['google', 'microsoft'])
  provider!: string;

  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
