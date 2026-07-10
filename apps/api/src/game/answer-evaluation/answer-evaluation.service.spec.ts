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

  describe('calculateDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(service.calculateDistance('hello', 'hello')).toBe(0);
      expect(service.calculateDistance('', '')).toBe(0);
    });

    it('should return the length of the non-empty string when the other is empty', () => {
      expect(service.calculateDistance('', 'hello')).toBe(5);
      expect(service.calculateDistance('world', '')).toBe(5);
    });

    it('should detect a single missing character', () => {
      expect(service.calculateDistance('harry potter', 'harry potte')).toBe(1);
      expect(service.calculateDistance('hary potter', 'harry potter')).toBe(1);
    });

    it('should detect a single additional character', () => {
      expect(service.calculateDistance('harry potter', 'harry potters')).toBe(
        1,
      );
      expect(service.calculateDistance('harrry potter', 'harry potter')).toBe(
        1,
      );
    });

    it('should detect a single adjacent transposition', () => {
      expect(service.calculateDistance('harry potter', 'haryr potter')).toBe(2);
      // "ahrry" vs "harry" — the 'h' and 'a' are swapped
      expect(service.calculateDistance('ahry', 'hary')).toBe(2);
    });

    it('should detect a single incorrect character (substitution)', () => {
      expect(service.calculateDistance('harry potter', 'harry pottur')).toBe(1);
      expect(service.calculateDistance('harry potter', 'harry kotter')).toBe(1);
    });

    it('should return larger distances for multiple differences', () => {
      expect(service.calculateDistance('harry potter', 'herry pottar')).toBe(2);
      expect(service.calculateDistance('abc', 'xyz')).toBe(3);
    });

    it('should be symmetric', () => {
      const a = 'harry potter';
      const b = 'harry potte';
      expect(service.calculateDistance(a, b)).toBe(
        service.calculateDistance(b, a),
      );
    });
  });

  describe('evaluate with typo tolerance (threshold > 0)', () => {
    it('should accept a single missing character within threshold 1', () => {
      expect(service.evaluate('Harry Pottr', 'Harry Potter', 1)).toBe(true);
    });

    it('should accept a single additional character within threshold 1', () => {
      expect(service.evaluate('Harry Potterr', 'Harry Potter', 1)).toBe(true);
    });

    it('should accept a single incorrect character within threshold 1', () => {
      expect(service.evaluate('Harry Kotter', 'Harry Potter', 1)).toBe(true);
    });

    it('should accept a single adjacent transposition within threshold 2', () => {
      // "Potter" → "Potetr" is a transposition requiring 2 edits
      expect(service.evaluate('Harry Potetr', 'Harry Potter', 2)).toBe(true);
    });

    it('should reject answers with multiple unrelated mistakes', () => {
      // "Horry Pottar" has 2 substitutions vs "Harry Potter"
      expect(service.evaluate('Horry Pottar', 'Harry Potter', 1)).toBe(false);
    });

    it('should reject completely different words even with threshold', () => {
      expect(service.evaluate('Voldemort', 'Harry Potter', 1)).toBe(false);
      expect(service.evaluate('Voldemort', 'Harry Potter', 3)).toBe(false);
    });

    it('should normalize before applying typo tolerance', () => {
      // "harry potter" vs "Harry Potter!" — after normalization, both become
      // "harry potter" so distance is 0, matches even at threshold 1
      expect(service.evaluate('harry potter', 'Harry Potter!', 1)).toBe(true);
    });

    it('should accept exact matches even with threshold set', () => {
      expect(service.evaluate('Harry Potter', 'Harry Potter', 1)).toBe(true);
      expect(service.evaluate('', '', 1)).toBe(true);
    });

    it('should reject empty vs non-empty with threshold 1 when distance > 1', () => {
      // Empty → "Harry Potter" has distance 11
      expect(service.evaluate('', 'Harry Potter', 1)).toBe(false);
    });

    it('should handle normalized threshold matching with punctuation', () => {
      // "Hello!" normalizes to "hello", "hello" normalizes to "hello"
      // Distance 0, matches
      expect(service.evaluate('Hello!', 'hello', 1)).toBe(true);
    });

    it('should accept a typo with hyphen normalization', () => {
      // "The Empir-Strikes Back" normalizes to "the empirestrikes back"
      // "The Empire-Strikes Back" normalizes to "the empirestrikes back"
      // Distance is small enough for threshold 1
      expect(
        service.evaluate(
          'The Empir-Strikes Back',
          'The Empire-Strikes Back',
          1,
        ),
      ).toBe(true);
    });

    it('should reject when threshold is 0 (backward compatible)', () => {
      expect(service.evaluate('Harry Pottr', 'Harry Potter', 0)).toBe(false);
      expect(service.evaluate('Harry Potter', 'Harry Potter', 0)).toBe(true);
    });
  });

  describe('evaluate with multiple accepted answers', () => {
    it('should accept the primary answer', () => {
      expect(
        service.evaluate('Harry Potter', ['Harry Potter', 'The Boy Who Lived']),
      ).toBe(true);
    });

    it('should accept an alternate spelling', () => {
      expect(
        service.evaluate('Spider-Man', ['Spiderman', 'Peter Parker']),
      ).toBe(true);
    });

    it('should accept a common abbreviation', () => {
      expect(
        service.evaluate('LOTR', [
          'The Lord of the Rings',
          'Lord of the Rings',
          'LOTR',
        ]),
      ).toBe(true);
    });

    it('should accept an alias or synonym', () => {
      expect(
        service.evaluate('The Dark Knight', ['Batman', 'The Dark Knight']),
      ).toBe(true);
    });

    it('should reject when input does not match any target', () => {
      expect(
        service.evaluate('Voldemort', ['Harry Potter', 'The Boy Who Lived']),
      ).toBe(false);
    });

    it('should reject when input does not match any of many targets', () => {
      expect(
        service.evaluate('Sauron', [
          'Harry Potter',
          'The Boy Who Lived',
          'Spider-Man',
          'Peter Parker',
        ]),
      ).toBe(false);
    });

    it('should normalize each accepted answer before comparison', () => {
      expect(
        service.evaluate('  harry potter  ', [
          'Harry Potter',
          'The Boy Who Lived!',
        ]),
      ).toBe(true);
      // Second target has punctuation, first is exact after normalization
      expect(
        service.evaluate('the boy who lived', [
          'Harry Potter',
          'The Boy Who Lived!',
        ]),
      ).toBe(true);
    });

    it('should apply typo tolerance independently to each target', () => {
      // Input has a typo but matches the first target with threshold 1
      expect(
        service.evaluate(
          'Harry Pottr',
          ['Harry Potter', 'The Boy Who Lived'],
          1,
        ),
      ).toBe(true);
      // Input is far from the first target but matches the second with threshold 2
      expect(
        service.evaluate(
          'The Boy Who Lives',
          ['Harry Potter', 'The Boy Who Lived'],
          1,
        ),
      ).toBe(true);
    });

    it('should reject when input is within threshold of some targets but not the specified threshold', () => {
      // "Harry Pottr" is at distance 1 from "Harry Potter" but threshold is 0
      expect(
        service.evaluate(
          'Harry Pottr',
          ['Harry Potter', 'The Boy Who Lived'],
          0,
        ),
      ).toBe(false);
    });

    it('should work with a single-element array the same as a string', () => {
      expect(service.evaluate('Harry Potter', ['Harry Potter'])).toBe(true);
      expect(service.evaluate('Voldemort', ['Harry Potter'])).toBe(false);
    });

    it('should handle normalization with hyphens across multiple targets', () => {
      // Input normalizes to "spiderman", first target normalizes to "spiderman"
      expect(
        service.evaluate('spider-man', ['Spiderman', 'Peter Parker']),
      ).toBe(true);
    });

    it('should handle case and whitespace differences with multiple targets', () => {
      expect(
        service.evaluate('  the LORD of the RINGS  ', [
          'The Lord of the Rings',
          'LOTR',
        ]),
      ).toBe(true);
    });

    it('should pass through to the old behavior when given a single string (backward compatible)', () => {
      // These tests mirror the original evaluate() tests but use the new signature
      expect(service.evaluate('Harry Potter', 'Harry Potter')).toBe(true);
      expect(service.evaluate('harry potter', 'HARRY POTTER')).toBe(true);
      expect(service.evaluate('Voldemort', 'Harry Potter')).toBe(false);
      expect(service.evaluate('', 'Harry Potter')).toBe(false);
      expect(service.evaluate('42', '42')).toBe(true);
      // Threshold still works
      expect(service.evaluate('Harry Pottr', 'Harry Potter', 1)).toBe(true);
      expect(service.evaluate('Horry Pottar', 'Harry Potter', 1)).toBe(false);
    });
  });
});
