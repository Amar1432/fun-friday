import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

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
}
