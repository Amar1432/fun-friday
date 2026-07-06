import { Logger } from '@nestjs/common';

export interface DatabaseClient {
  $connect(): Promise<void>;
}

export async function verifyDatabaseConnection(
  client: DatabaseClient,
  logger = new Logger('Database'),
): Promise<void> {
  try {
    await client.$connect();
    logger.log('PostgreSQL connection established');
  } catch (error) {
    logger.error('Unable to connect to PostgreSQL', error);
    throw new Error('Database connection failed', { cause: error });
  }
}
