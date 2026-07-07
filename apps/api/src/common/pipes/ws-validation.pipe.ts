import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  Logger,
  Type,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { WsException } from '@nestjs/websockets';

/**
 * A WebSocket-aware validation pipe that validates incoming event payloads
 * using class-validator decorators.
 *
 * When a payload fails validation, a structured WsException is thrown so the
 * client receives a protocol-compliant `error` event with:
 *   { success: false, error: { code: 'BAD_REQUEST', message: string } }
 *
 * Usage: apply `@UsePipes(new WsValidationPipe())` on individual
 * `@SubscribeMessage` handlers, or register it globally.
 */
@Injectable()
export class WsValidationPipe implements PipeTransform {
  private readonly logger = new Logger(WsValidationPipe.name);

  constructor(
    private readonly options?: {
      whitelist?: boolean;
      forbidNonWhitelisted?: boolean;
      skipMissingProperties?: boolean;
    },
  ) {}

  async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<unknown> {
    const { metatype } = metadata;

    // Skip validation when no metatype is provided (plain primitives etc.)
    if (!metatype || !this.hasValidationDecorators(metatype)) {
      return value;
    }

    // Skip validation for Socket instances (which are passed as first argument to handlers)
    if (
      metatype.name === 'Socket' ||
      (value && typeof value === 'object' && 'handshake' in value)
    ) {
      return value;
    }

    // Reject null/undefined before attempting validation — these are always invalid.
    if (value === null || value === undefined) {
      throw new WsException({
        code: 'BAD_REQUEST',
        message: 'Payload must not be null or undefined',
      });
    }

    // Transform the plain incoming object into a class instance so decorators apply
    const object = plainToInstance(metatype, value) as object;

    const errors: ValidationError[] = await validate(object, {
      whitelist: this.options?.whitelist ?? true,
      forbidNonWhitelisted: this.options?.forbidNonWhitelisted ?? true,
      skipMissingProperties: this.options?.skipMissingProperties ?? false,
    });

    if (errors.length > 0) {
      const message = this.formatErrors(errors);
      this.logger.warn(`WS payload validation failed: ${message}`);
      throw new WsException({ code: 'BAD_REQUEST', message });
    }

    return object;
  }

  /**
   * Returns true only for class types that may carry class-validator decorators.
   * Native constructor types (String, Number, Boolean, Array, Object) are bypassed.
   */
  private hasValidationDecorators(metatype: Type<any>): boolean {
    const nativeTypes: Array<Type<any>> = [
      String,
      Boolean,
      Number,
      Array,
      Object,
    ];
    return !nativeTypes.includes(metatype);
  }

  /**
   * Flattens class-validator ValidationError[] into a human-readable string.
   */
  private formatErrors(errors: ValidationError[]): string {
    return errors
      .map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints).join(', ')
          : 'invalid value';
        return `${error.property}: ${constraints}`;
      })
      .join('; ');
  }
}
