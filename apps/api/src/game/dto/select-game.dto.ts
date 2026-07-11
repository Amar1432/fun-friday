import { IsNotEmpty, IsString } from 'class-validator';

export class SelectGameDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsString()
  @IsNotEmpty()
  gameId!: string;
}
