import { create } from 'zustand';
import { Player, LeaderboardEntry, ConnectionStatus } from '@/lib/socket/types';
import { UserProfile } from '@/lib/auth/auth-context';

export interface RoomState {
  id: string | null;
  code: string | null;
  status: 'LOBBY' | 'IN_PROGRESS' | 'FINISHED' | null;
  hostId: string | null;
}

export interface GameState {
  gameId: string | null;
  totalRounds: number;
  currentRoundIndex: number;
  currentRoundId: string | null;
  currentQuestion: {
    id: string;
    prompt: string;
    timeLimitSeconds: number;
    difficulty: string;
  } | null;
  timerRemaining: number | null;
  correctAnswer: string | null;
  submittedAnswer: string | null;
}

export interface GameStore {
  // User State
  user: UserProfile | null;

  // Connection Status
  connectionStatus: ConnectionStatus;

  // Room Slice
  room: RoomState;

  // Players Slice
  players: Player[];

  // Game Slice
  game: GameState;

  // Leaderboard Slice
  leaderboard: LeaderboardEntry[];

  // Actions
  setUser: (user: UserProfile | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setRoom: (room: Partial<RoomState>) => void;
  resetRoom: () => void;

  // Player Actions
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;

  // Game Actions
  setGameStarted: (gameId: string, totalRounds: number) => void;
  setQuestionStarted: (question: {
    id: string;
    prompt: string;
    timeLimitSeconds: number;
    difficulty: string;
  }) => void;
  setTimerTick: (secondsRemaining: number) => void;
  setAnswerReveal: (correctAnswer: string) => void;
  setSubmittedAnswer: (answer: string | null) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setGameFinished: (finalRankings: LeaderboardEntry[]) => void;
  syncState: (data: {
    status: 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';
    players: Player[];
    leaderboard?: LeaderboardEntry[];
  }) => void;
}

const initialRoomState: RoomState = {
  id: null,
  code: null,
  status: null,
  hostId: null,
};

const initialGameState: GameState = {
  gameId: null,
  totalRounds: 0,
  currentRoundIndex: 0,
  currentRoundId: null,
  currentQuestion: null,
  timerRemaining: null,
  correctAnswer: null,
  submittedAnswer: null,
};

// Deterministic player ordering helper
export const sortPlayers = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => {
    // Sort by score descending first
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Then sort by displayName alphabetically
    const nameCompare = a.displayName.localeCompare(b.displayName);
    if (nameCompare !== 0) return nameCompare;
    // Finally sort by player ID to guarantee stability
    return a.id.localeCompare(b.id);
  });
};

export const useGameStore = create<GameStore>((set) => ({
  user: null,
  connectionStatus: 'disconnected',
  room: initialRoomState,
  players: [],
  game: initialGameState,
  leaderboard: [],

  // General Actions
  setUser: (user) => set({ user }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setRoom: (roomUpdates) =>
    set((state) => ({
      room: { ...state.room, ...roomUpdates },
    })),

  resetRoom: () =>
    set({
      room: initialRoomState,
      players: [],
      game: initialGameState,
      leaderboard: [],
    }),

  // Player Actions
  setPlayers: (players) =>
    set({
      players: sortPlayers(players),
    }),

  addPlayer: (newPlayer) =>
    set((state) => {
      // Prevent duplicates
      const filtered = state.players.filter((p) => p.id !== newPlayer.id);
      return {
        players: sortPlayers([...filtered, newPlayer]),
      };
    }),

  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),

  updatePlayer: (playerId, updates) =>
    set((state) => {
      const updated = state.players.map((p) => (p.id === playerId ? { ...p, ...updates } : p));
      return {
        players: sortPlayers(updated),
      };
    }),

  // Game Actions
  setGameStarted: (gameId, totalRounds) =>
    set((state) => ({
      room: { ...state.room, status: 'IN_PROGRESS' },
      game: {
        ...state.game,
        gameId,
        totalRounds,
        currentRoundIndex: 0,
        currentQuestion: null,
        correctAnswer: null,
        submittedAnswer: null,
      },
    })),

  setQuestionStarted: (question) =>
    set((state) => ({
      game: {
        ...state.game,
        currentQuestion: question,
        timerRemaining: question.timeLimitSeconds,
        correctAnswer: null,
        submittedAnswer: null,
        currentRoundIndex:
          state.game.currentQuestion?.id === question.id
            ? state.game.currentRoundIndex
            : state.game.currentRoundIndex + 1,
      },
    })),

  setTimerTick: (secondsRemaining) =>
    set((state) => ({
      game: { ...state.game, timerRemaining: secondsRemaining },
    })),

  setAnswerReveal: (correctAnswer) =>
    set((state) => ({
      game: { ...state.game, correctAnswer },
    })),

  setSubmittedAnswer: (submittedAnswer) =>
    set((state) => ({
      game: { ...state.game, submittedAnswer },
    })),

  setLeaderboard: (leaderboard) => set({ leaderboard }),

  setGameFinished: (finalRankings) =>
    set((state) => ({
      room: { ...state.room, status: 'FINISHED' },
      leaderboard: finalRankings,
    })),

  syncState: (syncData) =>
    set((state) => ({
      room: { ...state.room, status: syncData.status },
      players: sortPlayers(syncData.players),
      leaderboard: syncData.leaderboard ?? state.leaderboard,
    })),
}));
