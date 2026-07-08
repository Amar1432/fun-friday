import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import * as authService from '../auth/token.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createRoom(@CurrentUser() user: authService.TokenPayload) {
    const room = await this.roomsService.createRoom(user.sub);
    return {
      success: true,
      data: {
        room: {
          id: room.id,
          code: room.code,
          status: room.status,
          createdAt: room.createdAt,
        },
      },
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getRooms(@CurrentUser() user: authService.TokenPayload) {
    const rooms = await this.roomsService.getRoomsByHost(user.sub);
    return {
      success: true,
      data: rooms,
    };
  }

  @Get('validate/:code')
  async validateRoomCode(@Param('code') code: string) {
    const result = await this.roomsService.validateRoomCode(code);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getRoomById(
    @Param('id') id: string,
    @CurrentUser() user: authService.TokenPayload,
  ) {
    const room = await this.roomsService.getRoomById(id, user.sub);
    return {
      success: true,
      data: room,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRoom(
    @Param('id') id: string,
    @CurrentUser() user: authService.TokenPayload,
  ) {
    await this.roomsService.deleteRoom(id, user.sub);
  }
}
