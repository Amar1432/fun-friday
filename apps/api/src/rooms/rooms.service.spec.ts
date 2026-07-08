/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../database/prisma.service';
import {
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('RoomsService', () => {
  let service: RoomsService;

  const userFindUniqueMock = jest.fn();
  const roomFindUniqueMock = jest.fn();
  const roomFindManyMock = jest.fn();
  const roomCreateMock = jest.fn();
  const roomDeleteMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: userFindUniqueMock,
            },
            room: {
              findUnique: roomFindUniqueMock,
              findMany: roomFindManyMock,
              create: roomCreateMock,
              delete: roomDeleteMock,
            },
          },
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  describe('createRoom', () => {
    it('creates a room successfully when host exists', async () => {
      userFindUniqueMock.mockResolvedValue({
        id: 'host-123',
        name: 'Host User',
      });
      roomFindUniqueMock.mockResolvedValue(null); // Unique room code check passes
      roomCreateMock.mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'room-123',
          code: data.code,
          hostId: 'host-123',
          status: 'LOBBY',
          createdAt: new Date(),
        }),
      );

      const room = await service.createRoom('host-123');

      expect(room).toBeDefined();
      expect(room.hostId).toBe('host-123');
      expect(room.status).toBe('LOBBY');
      expect(room.code).toHaveLength(6);
      expect(roomCreateMock).toHaveBeenCalled();
    });

    it('throws UnauthorizedException if host user does not exist', async () => {
      userFindUniqueMock.mockResolvedValue(null);

      await expect(service.createRoom('host-123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('retries generation if code is not unique', async () => {
      userFindUniqueMock.mockResolvedValue({ id: 'host-123' });
      roomFindUniqueMock
        .mockResolvedValueOnce({ id: 'existing-room' }) // First attempt duplicate
        .mockResolvedValueOnce(null); // Second attempt unique

      roomCreateMock.mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'room-123',
          code: data.code,
          hostId: 'host-123',
          status: 'LOBBY',
        }),
      );

      const room = await service.createRoom('host-123');
      expect(room).toBeDefined();
      expect(roomFindUniqueMock).toHaveBeenCalledTimes(2);
    });

    it('throws BadRequestException if unique code generation fails repeatedly', async () => {
      userFindUniqueMock.mockResolvedValue({ id: 'host-123' });
      roomFindUniqueMock.mockResolvedValue({ id: 'existing-room' }); // Always duplicate

      await expect(service.createRoom('host-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getRoomsByHost', () => {
    it('returns all rooms for host', async () => {
      const mockRooms = [{ id: 'room-1', hostId: 'host-123' }];
      roomFindManyMock.mockResolvedValue(mockRooms);

      const result = await service.getRoomsByHost('host-123');
      expect(result).toEqual(mockRooms);
      expect(roomFindManyMock).toHaveBeenCalledWith({
        where: { hostId: 'host-123' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getRoomById', () => {
    it('returns room details successfully if owned by host', async () => {
      const mockRoom = { id: 'room-1', hostId: 'host-123', players: [] };
      roomFindUniqueMock.mockResolvedValue(mockRoom);

      const result = await service.getRoomById('room-1', 'host-123');
      expect(result).toEqual(mockRoom);
    });

    it('throws NotFoundException if room does not exist', async () => {
      roomFindUniqueMock.mockResolvedValue(null);

      await expect(service.getRoomById('room-1', 'host-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnauthorizedException if room is not owned by host', async () => {
      const mockRoom = { id: 'room-1', hostId: 'other-host' };
      roomFindUniqueMock.mockResolvedValue(mockRoom);

      await expect(service.getRoomById('room-1', 'host-123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('deleteRoom', () => {
    it('deletes room successfully if status is LOBBY and owned by host', async () => {
      const mockRoom = { id: 'room-1', hostId: 'host-123', status: 'LOBBY' };
      roomFindUniqueMock.mockResolvedValue(mockRoom);

      await service.deleteRoom('room-1', 'host-123');
      expect(roomDeleteMock).toHaveBeenCalledWith({ where: { id: 'room-1' } });
    });

    it('throws BadRequestException if room status is not LOBBY', async () => {
      const mockRoom = {
        id: 'room-1',
        hostId: 'host-123',
        status: 'IN_PROGRESS',
      };
      roomFindUniqueMock.mockResolvedValue(mockRoom);

      await expect(service.deleteRoom('room-1', 'host-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateRoomCode', () => {
    it('returns room validation state if room exists', async () => {
      const mockRoom = { id: 'room-1', code: 'ABCDEF', status: 'LOBBY' };
      roomFindUniqueMock.mockResolvedValue(mockRoom);

      const result = await service.validateRoomCode('abcdef');
      expect(result).toEqual({ exists: true, room: mockRoom });
    });

    it('throws NotFoundException if room does not exist', async () => {
      roomFindUniqueMock.mockResolvedValue(null);

      await expect(service.validateRoomCode('abcdef')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
