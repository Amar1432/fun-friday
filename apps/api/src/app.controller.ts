import {
  Body,
  Controller,
  Get,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { TestValidationDto } from './test-validation.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      success: true,
      data: this.appService.getHealth(),
    };
  }

  @Get('api/v1/health')
  getHealthV1() {
    return {
      success: true,
      data: this.appService.getHealth(),
    };
  }

  @Post('test-validation')
  testValidation(@Body() body: TestValidationDto) {
    return {
      success: true,
      data: body,
    };
  }

  @Get('test-error')
  testError() {
    throw new Error('Test internal error');
  }

  @Get('test-http-error')
  testHttpError() {
    throw new BadRequestException('Custom HTTP error message');
  }
}
