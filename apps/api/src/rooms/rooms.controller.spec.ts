import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TokenPayload } from '../auth/token.service';

describe('RoomsController', () => {
  let controller: RoomsController;

  const createRoomMock = jest.fn();
  const getRoomsByHostMock = jest.fn();
  const validateRoomCodeMock = jest.fn();
  const getRoomByIdMock = jest.fn();
  const deleteRoomMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        {
          provide: RoomsService,
          useValue: {
            createRoom: createRoomMock,
            getRoomsByHost: getRoomsByHostMock,
            validateRoomCode: validateRoomCodeMock,
            getRoomById: getRoomByIdMock,
            deleteRoom: deleteRoomMock,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RoomsController>(RoomsController);
  });

  const mockUser: TokenPayload = {
    sub: 'host-123',
    email: 'host@example.com',
    name: 'Host User',
    role: 'host',
  };

  describe('createRoom', () => {
    it('creates a room and returns standard success envelope', async () => {
      const mockRoom = {
        id: 'room-123',
        code: 'ABCDEF',
        status: 'LOBBY',
        createdAt: new Date(),
      };
      createRoomMock.mockResolvedValue(mockRoom);

      const result = await controller.createRoom(mockUser);

      expect(result).toEqual({
        success: true,
        data: {
          room: {
            id: mockRoom.id,
            code: mockRoom.code,
            status: mockRoom.status,
            createdAt: mockRoom.createdAt,
          },
        },
      });
      expect(createRoomMock).toHaveBeenCalledWith('host-123');
    });
  });

  describe('getRooms', () => {
    it('returns host rooms successfully', async () => {
      const mockRooms = [{ id: 'room-1', hostId: 'host-123' }];
      getRoomsByHostMock.mockResolvedValue(mockRooms);

      const result = await controller.getRooms(mockUser);

      expect(result).toEqual({ success: true, data: mockRooms });
      expect(getRoomsByHostMock).toHaveBeenCalledWith('host-123');
    });
  });

  describe('validateRoomCode', () => {
    it('validates code and returns success envelope', async () => {
      const mockResult = {
        exists: true,
        room: { id: 'room-1', code: 'ABCDEF', status: 'LOBBY' },
      };
      validateRoomCodeMock.mockResolvedValue(mockResult);

      const result = await controller.validateRoomCode('abcdef');

      expect(result).toEqual({ success: true, data: mockResult });
      expect(validateRoomCodeMock).toHaveBeenCalledWith('abcdef');
    });
  });

  describe('getRoomById', () => {
    it('returns room details successfully', async () => {
      const mockRoom = { id: 'room-1', hostId: 'host-123', players: [] };
      getRoomByIdMock.mockResolvedValue(mockRoom);

      const result = await controller.getRoomById('room-1', mockUser);

      expect(result).toEqual({ success: true, data: mockRoom });
      expect(getRoomByIdMock).toHaveBeenCalledWith('room-1', 'host-123');
    });
  });

  describe('deleteRoom', () => {
    it('deletes room and returns no content', async () => {
      deleteRoomMock.mockResolvedValue(undefined);

      await controller.deleteRoom('room-1', mockUser);

      expect(deleteRoomMock).toHaveBeenCalledWith('room-1', 'host-123');
    });
  });
});
