import { useGameStore, sortPlayers, deduplicateLeaderboard } from './use-game-store';
import { Player, LeaderboardEntry } from '@/lib/socket/types';

describe('useGameStore', () => {
  beforeEach(() => {
    // Reset room state before each test
    useGameStore.getState().resetRoom();
  });

  it('should initialize with default states', () => {
    const state = useGameStore.getState();
    expect(state.user).toBeNull();
    expect(state.connectionStatus).toBe('disconnected');
    expect(state.players).toEqual([]);
    expect(state.room).toEqual({
      id: null,
      code: null,
      status: null,
      hostId: null,
    });
    expect(state.game).toEqual({
      gameId: null,
      renderingStrategy: null,
      totalRounds: 0,
      currentRoundIndex: 0,
      currentRoundId: null,
      currentQuestion: null,
      timerRemaining: null,
      correctAnswer: null,
      submittedAnswer: null,
    });
    expect(state.leaderboard).toEqual([]);
  });

  it('should allow setting the user', () => {
    const store = useGameStore.getState();
    const user = { id: 'u-1', name: 'John Doe', email: 'john@example.com' };

    store.setUser(user);
    expect(useGameStore.getState().user).toEqual(user);

    store.setUser(null);
    expect(useGameStore.getState().user).toBeNull();
  });

  it('should update room fields and support resetting', () => {
    const store = useGameStore.getState();

    store.setRoom({ id: 'room-1', code: 'ABCDEF', status: 'LOBBY', hostId: 'host-1' });
    expect(useGameStore.getState().room).toEqual({
      id: 'room-1',
      code: 'ABCDEF',
      status: 'LOBBY',
      hostId: 'host-1',
    });

    store.resetRoom();
    expect(useGameStore.getState().room.id).toBeNull();
    expect(useGameStore.getState().players).toEqual([]);
  });

  it('should deterministically sort players by score, then display name, then ID', () => {
    const p1: Player = { id: '1', displayName: 'Charlie', score: 100, isReady: true };
    const p2: Player = { id: '2', displayName: 'Alice', score: 200, isReady: true };
    const p3: Player = { id: '3', displayName: 'Bob', score: 100, isReady: true };
    const p4: Player = { id: '4', displayName: 'Alice', score: 100, isReady: true };

    const sorted = sortPlayers([p1, p2, p3, p4]);

    // Expected order:
    // 1st: p2 (score 200)
    // 2nd: p4 (score 100, name Alice, id 4)
    // 3rd: p3 (score 100, name Bob, id 3)
    // 4th: p1 (score 100, name Charlie, id 1)
    expect(sorted[0]).toEqual(p2);
    expect(sorted[1]).toEqual(p4);
    expect(sorted[2]).toEqual(p3);
    expect(sorted[3]).toEqual(p1);
  });

  it('should add, remove, and update players with correct sorting', () => {
    const store = useGameStore.getState();
    const p1: Player = { id: '1', displayName: 'Bob', score: 10, isReady: true };
    const p2: Player = { id: '2', displayName: 'Alice', score: 20, isReady: true };

    store.addPlayer(p1);
    expect(useGameStore.getState().players).toEqual([p1]);

    // Adding p2 should sort it to the top (higher score)
    store.addPlayer(p2);
    expect(useGameStore.getState().players).toEqual([p2, p1]);

    // Updating p1's score to 30 should sort it to the top
    store.updatePlayer('1', { score: 30 });
    expect(useGameStore.getState().players[0].id).toBe('1');
    expect(useGameStore.getState().players[0].score).toBe(30);

    // Remove player
    store.removePlayer('2');
    expect(useGameStore.getState().players.length).toBe(1);
    expect(useGameStore.getState().players[0].id).toBe('1');
  });

  it('should handle game started transitions', () => {
    const store = useGameStore.getState();
    store.setGameStarted('game-abc', 5);

    const state = useGameStore.getState();
    expect(state.room.status).toBe('IN_PROGRESS');
    expect(state.game.gameId).toBe('game-abc');
    expect(state.game.totalRounds).toBe(5);
    expect(state.game.currentRoundIndex).toBe(0);
  });

  it('should set renderingStrategy when provided', () => {
    const store = useGameStore.getState();
    store.setGameStarted('game-abc', 5, 'gibberish-text');
    expect(useGameStore.getState().game.renderingStrategy).toBe('gibberish-text');

    // Without renderingStrategy, keeps previous value
    store.setGameStarted('game-def', 3);
    expect(useGameStore.getState().game.renderingStrategy).toBe('gibberish-text');

    // Explicit override
    store.setGameStarted('game-ghi', 4, 'emoji-prompt');
    expect(useGameStore.getState().game.renderingStrategy).toBe('emoji-prompt');
  });

  it('should handle question started and round updates', () => {
    const store = useGameStore.getState();

    // First question
    store.setQuestionStarted({
      id: 'q-1',
      prompt: 'Prompt 1',
      timeLimitSeconds: 15,
      difficulty: 'EASY',
    });

    const state = useGameStore.getState();
    expect(state.game.currentQuestion).toEqual({
      id: 'q-1',
      prompt: 'Prompt 1',
      timeLimitSeconds: 15,
      difficulty: 'EASY',
    });
    expect(state.game.timerRemaining).toBe(15);
    expect(state.game.currentRoundIndex).toBe(1);

    // Same question start (e.g. re-broadcast or sync) should not increment round
    store.setQuestionStarted({
      id: 'q-1',
      prompt: 'Prompt 1',
      timeLimitSeconds: 15,
      difficulty: 'EASY',
    });
    expect(useGameStore.getState().game.currentRoundIndex).toBe(1);

    // Next question
    store.setQuestionStarted({
      id: 'q-2',
      prompt: 'Prompt 2',
      timeLimitSeconds: 20,
      difficulty: 'MEDIUM',
    });
    expect(useGameStore.getState().game.currentRoundIndex).toBe(2);
  });

  it('should handle timer ticks, answer submissions, reveals, and game completion', () => {
    const store = useGameStore.getState();

    store.setTimerTick(9);
    expect(useGameStore.getState().game.timerRemaining).toBe(9);

    store.setSubmittedAnswer('User Answer');
    expect(useGameStore.getState().game.submittedAnswer).toBe('User Answer');

    store.setAnswerReveal('Correct Answer');
    expect(useGameStore.getState().game.correctAnswer).toBe('Correct Answer');

    // Finalize game
    const finalRankings: LeaderboardEntry[] = [
      { rank: 1, playerId: '1', displayName: 'Player 1', score: 1000, streak: 3 },
    ];
    store.setGameFinished(finalRankings);

    expect(useGameStore.getState().room.status).toBe('FINISHED');
    expect(useGameStore.getState().leaderboard).toEqual(finalRankings);
  });

  it('should support full state synchronization', () => {
    const store = useGameStore.getState();
    const players: Player[] = [{ id: '1', displayName: 'Player 1', score: 50, isReady: true }];
    const leaderboard: LeaderboardEntry[] = [
      { rank: 1, playerId: '1', displayName: 'Player 1', score: 50, streak: 1 },
    ];

    store.syncState({
      room: { id: 'room-1', code: 'ABCDEF', status: 'IN_PROGRESS' },
      players,
      leaderboard,
    });

    const state = useGameStore.getState();
    expect(state.room.id).toBe('room-1');
    expect(state.room.code).toBe('ABCDEF');
    expect(state.room.status).toBe('IN_PROGRESS');
    expect(state.players).toEqual(players);
    expect(state.leaderboard).toEqual(leaderboard);
  });

  it('should clear stale transient game UI when syncing with no active game', () => {
    const store = useGameStore.getState();
    store.setQuestionStarted({
      id: 'q-1',
      prompt: 'Stale prompt',
      timeLimitSeconds: 15,
      difficulty: 'EASY',
    });
    store.setSubmittedAnswer('Stale answer');
    store.setAnswerReveal('Stale correct');

    const staleState = useGameStore.getState();
    expect(staleState.game.currentQuestion).not.toBeNull();
    expect(staleState.game.submittedAnswer).toBe('Stale answer');
    expect(staleState.game.correctAnswer).toBe('Stale correct');

    // Server reports the room with no active game (player dropped or in LOBBY)
    store.syncState({
      room: { id: 'room-1', code: 'ABCDEF', status: 'LOBBY' },
      players: [],
    });

    const syncedState = useGameStore.getState();
    expect(syncedState.room.status).toBe('LOBBY');
    expect(syncedState.game.currentQuestion).toBeNull();
    expect(syncedState.game.timerRemaining).toBeNull();
    expect(syncedState.game.submittedAnswer).toBeNull();
    expect(syncedState.game.correctAnswer).toBeNull();
  });

  it('should deduplicate leaderboard entries by playerId', () => {
    const rawLeaderboard: LeaderboardEntry[] = [
      { rank: 1, playerId: 'p1', displayName: 'Player 1', score: 100, streak: 1 },
      { rank: 2, playerId: 'p2', displayName: 'Player 2', score: 80, streak: 1 },
      { rank: 3, playerId: 'p1', displayName: 'Player 1 Duplicate', score: 100, streak: 1 },
    ];

    const deduplicated = deduplicateLeaderboard(rawLeaderboard);
    expect(deduplicated).toEqual([
      { rank: 1, playerId: 'p1', displayName: 'Player 1', score: 100, streak: 1 },
      { rank: 2, playerId: 'p2', displayName: 'Player 2', score: 80, streak: 1 },
    ]);
  });

  it('should deduplicate leaderboard state when setLeaderboard, setGameFinished, or syncState is called', () => {
    const store = useGameStore.getState();
    const rawLeaderboard: LeaderboardEntry[] = [
      { rank: 1, playerId: 'p1', displayName: 'Player 1', score: 100, streak: 1 },
      { rank: 2, playerId: 'p1', displayName: 'Player 1 Duplicate', score: 100, streak: 1 },
    ];

    store.setLeaderboard(rawLeaderboard);
    expect(useGameStore.getState().leaderboard).toEqual([
      { rank: 1, playerId: 'p1', displayName: 'Player 1', score: 100, streak: 1 },
    ]);

    store.setGameFinished(rawLeaderboard);
    expect(useGameStore.getState().leaderboard).toEqual([
      { rank: 1, playerId: 'p1', displayName: 'Player 1', score: 100, streak: 1 },
    ]);

    store.syncState({
      room: {
        id: 'room-123',
        code: 'ABCDEF',
        status: 'IN_PROGRESS',
      },
      players: [],
      leaderboard: rawLeaderboard,
    });
    expect(useGameStore.getState().leaderboard).toEqual([
      { rank: 1, playerId: 'p1', displayName: 'Player 1', score: 100, streak: 1 },
    ]);
  });
});
