import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenService } from './token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleSsoProvider } from './providers/google-sso.provider';
import { MicrosoftSsoProvider } from './providers/microsoft-sso.provider';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        const expiresIn = (process.env.JWT_EXPIRATION ?? '24h') as never;

        if (!secret) {
          throw new Error('JWT_SECRET environment variable is not defined');
        }

        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    JwtAuthGuard,
    GoogleSsoProvider,
    MicrosoftSsoProvider,
  ],
  exports: [TokenService, JwtAuthGuard],
})
export class AuthModule {}
