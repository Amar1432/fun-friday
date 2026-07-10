import { Test, TestingModule } from '@nestjs/testing';
import { AnswerEvaluationService } from './answer-evaluation.service';

describe('AnswerEvaluationService', () => {
  let service: AnswerEvaluationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnswerEvaluationService],
    }).compile();

    service = module.get<AnswerEvaluationService>(AnswerEvaluationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluate', () => {
    it('should return true for an exact match', () => {
      expect(service.evaluate('Harry Potter', 'Harry Potter')).toBe(true);
    });

    it('should return true for a case-insensitive match', () => {
      expect(service.evaluate('harry potter', 'HARRY POTTER')).toBe(true);
      expect(service.evaluate('HaRrY PoTtEr', 'harry potter')).toBe(true);
    });

    it('should return true when input has leading/trailing whitespace', () => {
      expect(service.evaluate('  Harry Potter  ', 'Harry Potter')).toBe(true);
      expect(service.evaluate('Harry Potter', '  Harry Potter  ')).toBe(true);
      expect(service.evaluate('  Harry Potter  ', '  HARRY POTTER  ')).toBe(
        true,
      );
    });

    it('should return false for a completely different answer', () => {
      expect(service.evaluate('Voldemort', 'Harry Potter')).toBe(false);
    });

    it('should return false when input is empty but target is not', () => {
      expect(service.evaluate('', 'Harry Potter')).toBe(false);
    });

    it('should return true when both input and target are empty strings', () => {
      expect(service.evaluate('', '')).toBe(true);
    });

    it('should return true when both input and target are only whitespace', () => {
      expect(service.evaluate('   ', '   ')).toBe(true);
    });

    it('should return false when input has extra words', () => {
      expect(service.evaluate('The Harry Potter', 'Harry Potter')).toBe(false);
    });

    it('should handle numbers as strings', () => {
      expect(service.evaluate('42', '42')).toBe(true);
      expect(service.evaluate(' 42 ', '42')).toBe(true);
      expect(service.evaluate('42', '41')).toBe(false);
    });

    it('should handle special characters', () => {
      expect(
        service.evaluate('Star Wars: Episode V', 'star wars: episode v'),
      ).toBe(true);
      expect(service.evaluate('Hello!', 'hello!')).toBe(true);
      expect(service.evaluate('Hello!', 'hello')).toBe(false);
    });

    it('should handle mixed case and whitespace together', () => {
      expect(
        service.evaluate('  To Kill A Mockingbird  ', 'to kill a mockingbird'),
      ).toBe(true);
      expect(service.evaluate('THE GREAT GATSBY', '  the great gatsby  ')).toBe(
        true,
      );
    });
  });
});
