import { Test, TestingModule } from '@nestjs/testing';
import { GameModeRegistry } from './game-mode-registry.service';

describe('GameModeRegistry', () => {
  let registry: GameModeRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameModeRegistry],
    }).compile();

    registry = module.get<GameModeRegistry>(GameModeRegistry);
  });

  describe('getAll', () => {
    it('should return all three game modes', () => {
      const modes = registry.getAll();
      expect(modes).toHaveLength(3);
    });

    it('should include Emoji Guess', () => {
      const modes = registry.getAll();
      expect(modes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'emoji-guess',
            displayName: 'Emoji Guess',
            iconRef: '🎭',
            renderingStrategy: 'emoji-prompt',
          }),
        ]),
      );
    });

    it('should include Bad Movie Description', () => {
      const modes = registry.getAll();
      expect(modes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'bad-movie-description',
            displayName: 'Bad Movie Description',
            iconRef: '🎬',
            renderingStrategy: 'description-text',
          }),
        ]),
      );
    });

    it('should include Gibberish', () => {
      const modes = registry.getAll();
      expect(modes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'gibberish',
            displayName: 'Gibberish',
            iconRef: '🔤',
            renderingStrategy: 'gibberish-text',
          }),
        ]),
      );
    });

    it('each mode should have all required fields defined', () => {
      const modes = registry.getAll();
      for (const mode of modes) {
        expect(mode.identifier).toBeDefined();
        expect(typeof mode.identifier).toBe('string');
        expect(mode.identifier.length).toBeGreaterThan(0);

        expect(mode.displayName).toBeDefined();
        expect(typeof mode.displayName).toBe('string');
        expect(mode.displayName.length).toBeGreaterThan(0);

        expect(mode.description).toBeDefined();
        expect(typeof mode.description).toBe('string');
        expect(mode.description.length).toBeGreaterThan(0);

        expect(mode.iconRef).toBeDefined();
        expect(typeof mode.iconRef).toBe('string');
        expect(mode.iconRef.length).toBeGreaterThan(0);

        expect(mode.renderingStrategy).toBeDefined();
        expect(typeof mode.renderingStrategy).toBe('string');
        expect(mode.renderingStrategy.length).toBeGreaterThan(0);
      }
    });

    it('should have unique identifiers across all modes', () => {
      const modes = registry.getAll();
      const identifiers = modes.map((m) => m.identifier);
      const uniqueIdentifiers = new Set(identifiers);
      expect(uniqueIdentifiers.size).toBe(identifiers.length);
    });

    it('should not mutate the internal array when called multiple times', () => {
      const firstCall = registry.getAll();
      const secondCall = registry.getAll();
      expect(firstCall).toEqual(secondCall);
      // Verify they are different array instances (immutability)
      expect(firstCall).not.toBe(secondCall);
    });
  });

  describe('getByIdentifier', () => {
    it('should return Emoji Guess when queried with emoji-guess', () => {
      const mode = registry.getByIdentifier('emoji-guess');
      expect(mode).not.toBeNull();
      expect(mode?.identifier).toBe('emoji-guess');
      expect(mode?.displayName).toBe('Emoji Guess');
      expect(mode?.iconRef).toBe('🎭');
      expect(mode?.renderingStrategy).toBe('emoji-prompt');
    });

    it('should return Bad Movie Description when queried with bad-movie-description', () => {
      const mode = registry.getByIdentifier('bad-movie-description');
      expect(mode).not.toBeNull();
      expect(mode?.identifier).toBe('bad-movie-description');
      expect(mode?.displayName).toBe('Bad Movie Description');
      expect(mode?.iconRef).toBe('🎬');
      expect(mode?.renderingStrategy).toBe('description-text');
    });

    it('should return Gibberish when queried with gibberish', () => {
      const mode = registry.getByIdentifier('gibberish');
      expect(mode).not.toBeNull();
      expect(mode?.identifier).toBe('gibberish');
      expect(mode?.displayName).toBe('Gibberish');
      expect(mode?.iconRef).toBe('🔤');
      expect(mode?.renderingStrategy).toBe('gibberish-text');
    });

    it('should return null for unknown identifier', () => {
      const mode = registry.getByIdentifier('unknown-game-mode');
      expect(mode).toBeNull();
    });

    it('should return null for empty string identifier', () => {
      const mode = registry.getByIdentifier('');
      expect(mode).toBeNull();
    });

    it('should be case-sensitive for identifiers', () => {
      const mode = registry.getByIdentifier('Emoji-Guess');
      expect(mode).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for emoji-guess', () => {
      expect(registry.exists('emoji-guess')).toBe(true);
    });

    it('should return true for bad-movie-description', () => {
      expect(registry.exists('bad-movie-description')).toBe(true);
    });

    it('should return true for gibberish', () => {
      expect(registry.exists('gibberish')).toBe(true);
    });

    it('should return false for unknown game mode', () => {
      expect(registry.exists('non-existent-mode')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(registry.exists('')).toBe(false);
    });
  });
});
