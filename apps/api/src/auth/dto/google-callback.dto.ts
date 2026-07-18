import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleCallbackDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  codeVerifier!: string;

  @IsString()
  @IsNotEmpty()
  redirectUri!: string;
}
