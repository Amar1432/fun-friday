import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class GuestLoginDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Room code must be exactly 6 characters' })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'Room code must contain only alphanumeric characters',
  })
  roomCode!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 20, {
    message: 'Display name must be between 2 and 20 characters',
  })
  displayName!: string;
}
