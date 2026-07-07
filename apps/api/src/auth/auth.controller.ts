import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SsoLoginDto } from './dto/sso-login.dto';

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
}
