import { WsValidationPipe } from './ws-validation.pipe';
import { WsException } from '@nestjs/websockets';
import { ArgumentMetadata } from '@nestjs/common';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// ─── Test DTOs ───────────────────────────────────────────────────────────────

class SimpleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

class NumericDto {
  @IsNumber()
  @Min(0)
  count!: number;
}

class OptionalFieldDto {
  @IsString()
  @IsNotEmpty()
  required!: string;

  @IsString()
  @IsOptional()
  optional?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMetadata(
  metatype: new (...args: unknown[]) => unknown,
): ArgumentMetadata {
  return { type: 'body', metatype, data: '' };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('WsValidationPipe', () => {
  let pipe: WsValidationPipe;

  beforeEach(() => {
    pipe = new WsValidationPipe();
  });

  // ── Pass-through for native types ─────────────────────────────────────────

  describe('native type pass-through', () => {
    it('should return value unchanged when metatype is String', async () => {
      const result = await pipe.transform('hello', {
        type: 'body',
        metatype: String,
        data: '',
      });
      expect(result).toBe('hello');
    });

    it('should return value unchanged when metatype is Number', async () => {
      const result = await pipe.transform(42, {
        type: 'body',
        metatype: Number,
        data: '',
      });
      expect(result).toBe(42);
    });

    it('should return value unchanged when no metatype is provided', async () => {
      const result = await pipe.transform(
        { any: 'thing' },
        {
          type: 'body',
          metatype: undefined,
          data: '',
        },
      );
      expect(result).toEqual({ any: 'thing' });
    });
  });

  // ── Valid payloads ────────────────────────────────────────────────────────

  describe('valid payloads', () => {
    it('should return the transformed DTO instance for a valid string field', async () => {
      const result = await pipe.transform(
        { name: 'Alice' },
        makeMetadata(SimpleDto),
      );
      expect(result).toBeInstanceOf(SimpleDto);
      expect((result as SimpleDto).name).toBe('Alice');
    });

    it('should pass validation when optional field is omitted', async () => {
      const result = await pipe.transform(
        { required: 'hello' },
        makeMetadata(OptionalFieldDto),
      );
      expect(result).toBeInstanceOf(OptionalFieldDto);
      expect((result as OptionalFieldDto).required).toBe('hello');
      expect((result as OptionalFieldDto).optional).toBeUndefined();
    });

    it('should pass validation when optional field is present', async () => {
      const result = await pipe.transform(
        { required: 'hello', optional: 'world' },
        makeMetadata(OptionalFieldDto),
      );
      expect((result as OptionalFieldDto).optional).toBe('world');
    });

    it('should pass validation for a valid numeric field', async () => {
      const result = await pipe.transform(
        { count: 10 },
        makeMetadata(NumericDto),
      );
      expect((result as NumericDto).count).toBe(10);
    });

    it('should pass validation for a numeric field equal to minimum (0)', async () => {
      const result = await pipe.transform(
        { count: 0 },
        makeMetadata(NumericDto),
      );
      expect((result as NumericDto).count).toBe(0);
    });
  });

  // ── Invalid payloads → WsException ────────────────────────────────────────

  describe('invalid payloads', () => {
    it('should throw WsException when a required string field is missing', async () => {
      await expect(
        pipe.transform({}, makeMetadata(SimpleDto)),
      ).rejects.toBeInstanceOf(WsException);
    });

    it('should include BAD_REQUEST code in the exception', async () => {
      try {
        await pipe.transform({}, makeMetadata(SimpleDto));
        fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(WsException);
        const exception = err as WsException;
        const response = exception.getError() as {
          code: string;
          message: string;
        };
        expect(response.code).toBe('BAD_REQUEST');
        expect(typeof response.message).toBe('string');
        expect(response.message.length).toBeGreaterThan(0);
      }
    });

    it('should throw WsException when required field is an empty string', async () => {
      await expect(
        pipe.transform({ name: '' }, makeMetadata(SimpleDto)),
      ).rejects.toBeInstanceOf(WsException);
    });

    it('should throw WsException when required string field is given a non-string value', async () => {
      await expect(
        pipe.transform({ name: 123 }, makeMetadata(SimpleDto)),
      ).rejects.toBeInstanceOf(WsException);
    });

    it('should throw WsException when numeric field is below minimum', async () => {
      await expect(
        pipe.transform({ count: -1 }, makeMetadata(NumericDto)),
      ).rejects.toBeInstanceOf(WsException);
    });

    it('should throw WsException when numeric field is a string instead of number', async () => {
      await expect(
        pipe.transform({ count: 'five' }, makeMetadata(NumericDto)),
      ).rejects.toBeInstanceOf(WsException);
    });

    it('should throw WsException when forbidden extra field is present (forbidNonWhitelisted)', async () => {
      await expect(
        pipe.transform(
          { name: 'Alice', extraField: 'bad' },
          makeMetadata(SimpleDto),
        ),
      ).rejects.toBeInstanceOf(WsException);
    });

    it('should throw WsException when payload is null', async () => {
      await expect(
        pipe.transform(null, makeMetadata(SimpleDto)),
      ).rejects.toBeInstanceOf(WsException);
    });
  });

  // ── Error message format ──────────────────────────────────────────────────

  describe('error message formatting', () => {
    it('should include the field name in the error message', async () => {
      try {
        await pipe.transform({}, makeMetadata(SimpleDto));
        fail('should have thrown');
      } catch (err) {
        const exception = err as WsException;
        const response = exception.getError() as {
          code: string;
          message: string;
        };
        expect(response.message).toContain('name');
      }
    });

    it('should list all failing field names when multiple fields fail', async () => {
      try {
        await pipe.transform({}, makeMetadata(OptionalFieldDto));
        fail('should have thrown');
      } catch (err) {
        const exception = err as WsException;
        const response = exception.getError() as {
          code: string;
          message: string;
        };
        // Only 'required' is mandatory; message must mention it
        expect(response.message).toContain('required');
      }
    });
  });
});
