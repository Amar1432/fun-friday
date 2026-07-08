import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Room } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(hostId: string): Promise<Room> {
    // Verify host exists
    const host = await this.prisma.user.findUnique({
      where: { id: hostId },
    });
    if (!host) {
      throw new UnauthorizedException('Host user not found');
    }

    // Generate unique room code
    let code = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = this.generateCode();
      const existing = await this.prisma.room.findUnique({
        where: { code },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new BadRequestException(
        'Failed to generate a unique room code. Please try again.',
      );
    }

    return this.prisma.room.create({
      data: {
        code,
        hostId,
        status: 'LOBBY',
      },
    });
  }

  async getRoomsByHost(hostId: string): Promise<Room[]> {
    return this.prisma.room.findMany({
      where: { hostId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRoomById(id: string, hostId: string): Promise<Room> {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        players: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.hostId !== hostId) {
      throw new UnauthorizedException('You do not have access to this room');
    }

    return room;
  }

  async deleteRoom(id: string, hostId: string): Promise<void> {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.hostId !== hostId) {
      throw new UnauthorizedException('You do not have access to this room');
    }

    if (room.status !== 'LOBBY') {
      throw new BadRequestException('Can only delete rooms in LOBBY status');
    }

    await this.prisma.room.delete({
      where: { id },
    });
  }

  async validateRoomCode(
    code: string,
  ): Promise<{ exists: boolean; room: Partial<Room> | null }> {
    const room = await this.prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true,
        code: true,
        status: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Room does not exist.');
    }

    return {
      exists: true,
      room,
    };
  }

  private generateCode(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
