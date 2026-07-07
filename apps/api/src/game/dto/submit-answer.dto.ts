import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsString()
  @IsNotEmpty()
  answer!: string;

  @IsNumber()
  @Min(0)
  responseTimeMs!: number;
}
