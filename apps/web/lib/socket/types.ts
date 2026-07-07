export interface Player {
  id: string;
  displayName: string;
  score: number;
  isReady: boolean;
  joinedAt?: string;
}

export interface RoomMetadata {
  id: string;
  code: string;
  status: 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';
  hostId: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
  streak: number;
}

export interface ServerToClientEvents {
  PlayerJoined: (data: { player: Player }) => void;
  PlayerLeft: (data: { playerId: string }) => void;
  RoomStateUpdated: (data: {
    players: Player[];
    status: 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';
    hostId: string;
    playerCount: number;
  }) => void;
  GameStarted: (data: { gameId: string; totalRounds: number }) => void;
  QuestionStarted: (data: {
    questionId: string;
    prompt: string;
    timeLimitSeconds: number;
    difficulty: string;
  }) => void;
  TimerTick: (data: { secondsRemaining: number }) => void;
  AnswerReveal: (data: { correctAnswer: string; explanations?: Record<string, unknown> }) => void;
  LeaderboardUpdated: (data: LeaderboardEntry[]) => void;
  GameFinished: (data: { finalRankings: LeaderboardEntry[] }) => void;
  StateSync: (data: {
    status: 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';
    players: Player[];
    leaderboard?: LeaderboardEntry[];
  }) => void;
  error: (error: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  JoinRoom: (payload: { roomCode: string; displayName: string; guestToken: string }) => void;
  LeaveRoom: (payload: { roomId: string; playerId: string }) => void;
  PlayerReady: (payload: { roomId: string; playerId: string }) => void;
  StartGame: (payload: { roomId: string; gameId: string }) => void;
  NextRound: (payload: { roomId: string }) => void;
  EndGame: (payload: { roomId: string }) => void;
  SubmitAnswer: (payload: {
    roomId: string;
    questionId: string;
    answer: string;
    responseTimeMs: number;
  }) => void;
  ReconnectRequest: (payload: { playerId: string; roomId: string }) => void;
}

export type ConnectionStatus =
  'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'auth_failed';
