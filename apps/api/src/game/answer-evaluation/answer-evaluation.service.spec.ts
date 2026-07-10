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

  describe('normalize', () => {
    it('should convert to lowercase', () => {
      expect(service.normalize('HARRY POTTER')).toBe('harry potter');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(service.normalize('  harry potter  ')).toBe('harry potter');
    });

    it('should collapse multiple spaces into a single space', () => {
      expect(service.normalize('harry   potter')).toBe('harry potter');
      expect(service.normalize('harry    potter  the')).toBe(
        'harry potter the',
      );
    });

    it('should remove hyphens', () => {
      expect(service.normalize('spider-man')).toBe('spiderman');
      expect(service.normalize('-hello-')).toBe('hello');
    });

    it('should remove underscores', () => {
      expect(service.normalize('hello_world')).toBe('helloworld');
      expect(service.normalize('_foo_bar_')).toBe('foobar');
    });

    it('should remove punctuation', () => {
      expect(service.normalize('hello, world!')).toBe('hello world');
      expect(service.normalize('star wars: episode v')).toBe(
        'star wars episode v',
      );
      expect(service.normalize("what's up?")).toBe('whats up');
    });

    it('should combine all normalization rules', () => {
      // Hyphen removed, lowercase, extra spaces collapsed
      expect(service.normalize('Spider-man')).toBe('spiderman');
      // Spaces collapsed, lowercase
      expect(service.normalize('Spider   man')).toBe('spider man');
      // Already normalized
      expect(service.normalize('spiderman')).toBe('spiderman');
    });

    it('should handle empty string', () => {
      expect(service.normalize('')).toBe('');
    });

    it('should handle string with only punctuation', () => {
      expect(service.normalize('!!!???...')).toBe('');
    });

    it('should handle unicode characters', () => {
      expect(service.normalize('café')).toBe('café');
      expect(service.normalize('  Café  ')).toBe('café');
    });
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

    it('should normalize punctuation before comparison', () => {
      // Both sides normalise: colon, exclamation removed, case folded
      expect(
        service.evaluate('Star Wars: Episode V', 'star wars: episode v'),
      ).toBe(true);
      // Exclamation removed
      expect(service.evaluate('Hello!', 'hello!')).toBe(true);
      // Punctuation-only difference — now considered equal after normalisation
      expect(service.evaluate('Hello!', 'hello')).toBe(true);
      // Comma difference
      expect(service.evaluate('Hello, World', 'hello world')).toBe(true);
    });

    it('should normalize hyphens and underscores', () => {
      expect(service.evaluate('spider-man', 'spiderman')).toBe(true);
      expect(service.evaluate('Spider-man', 'spider man')).toBe(false);
      expect(service.evaluate('hello_world', 'hello world')).toBe(false);
      expect(service.evaluate('hello-world', 'hello world')).toBe(false);
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
