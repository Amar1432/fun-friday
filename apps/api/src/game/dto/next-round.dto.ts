import { IsNotEmpty, IsString } from 'class-validator';

export class NextRoundDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;
}
