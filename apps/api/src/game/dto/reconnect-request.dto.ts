import { IsNotEmpty, IsString } from 'class-validator';

export class ReconnectRequestDto {
  @IsString()
  @IsNotEmpty()
  playerId!: string;

  @IsString()
  @IsNotEmpty()
  roomId!: string;
}
