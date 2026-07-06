import { Logger } from '@nestjs/common';
import { verifyDatabaseConnection } from './database-connection';

describe('verifyDatabaseConnection', () => {
  const logMock = jest.fn();
  const errorMock = jest.fn();
  const logger = {
    log: logMock,
    error: errorMock,
  } as unknown as Logger;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connects to PostgreSQL and logs success', async () => {
    const client = { $connect: jest.fn().mockResolvedValue(undefined) };

    await expect(
      verifyDatabaseConnection(client, logger),
    ).resolves.toBeUndefined();

    expect(client.$connect).toHaveBeenCalledTimes(1);
    expect(logMock).toHaveBeenCalledWith('PostgreSQL connection established');
  });

  it('logs and rethrows connection failures with a safe message', async () => {
    const connectionError = new Error('password authentication failed');
    const client = { $connect: jest.fn().mockRejectedValue(connectionError) };

    await expect(verifyDatabaseConnection(client, logger)).rejects.toThrow(
      'Database connection failed',
    );

    expect(errorMock).toHaveBeenCalledWith(
      'Unable to connect to PostgreSQL',
      connectionError,
    );
  });
});
