import { IsNotEmpty, IsString } from 'class-validator';

export class EndGameDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;
}
