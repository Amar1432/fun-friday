export interface Player {
  id: string;
  displayName: string;
  score: number;
  isReady: boolean;
  joinedAt?: string;
  isConnected?: boolean;
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
    hostName?: string | null;
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
    room: {
      id: string;
      code: string;
      status: 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';
    };
    playerId: string;
    players: Player[];
    leaderboard?: LeaderboardEntry[];
    game?: {
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
    } | null;
  }) => void;
  error: (error: { code: string; message: string }) => void;
  SubmitAnswerAck: (data: {
    success: boolean;
    data: {
      playerId: string;
      roundId: string;
      questionId: string;
      answerText: string;
      responseTimeMs: number;
    };
  }) => void;
  Kicked: (data: { message: string }) => void;
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
  KickPlayer: (payload: { roomId: string; playerId: string }) => void;
}

export type ConnectionStatus =
  'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'restoring' | 'auth_failed';
