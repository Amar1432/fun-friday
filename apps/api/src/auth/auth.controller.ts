import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SsoLoginDto } from './dto/sso-login.dto';
import { GoogleCallbackDto } from './dto/google-callback.dto';
import { GuestLoginDto } from './dto/guest-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sso/login')
  async ssoLogin(@Body() dto: SsoLoginDto) {
    const result = await this.authService.ssoLogin(dto.provider, dto.idToken);

    return {
      success: true,
      data: result,
    };
  }

  @Post('sso/google/callback')
  async googleCallback(@Body() dto: GoogleCallbackDto) {
    const result = await this.authService.handleGoogleCallback(
      dto.code,
      dto.codeVerifier,
      dto.redirectUri,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Post('guest')
  async registerGuest(@Body() dto: GuestLoginDto) {
    const result = await this.authService.registerGuest(
      dto.roomCode,
      dto.displayName,
    );

    return {
      success: true,
      data: result,
    };
  }
}
