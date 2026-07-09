import { IsNotEmpty, IsString } from 'class-validator';

export class KickPlayerDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsString()
  @IsNotEmpty()
  playerId!: string;
}
