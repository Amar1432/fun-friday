import { IsNotEmpty, IsString } from 'class-validator';

export class PlayerReadyDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsString()
  @IsNotEmpty()
  playerId!: string;
}
