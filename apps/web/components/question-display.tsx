import * as React from 'react';

export interface QuestionDisplayProps {
  question: {
    id: string;
    prompt: string;
    timeLimitSeconds: number;
    difficulty: string;
  };
  currentRoundIndex: number;
  totalRounds: number;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  currentRoundIndex,
  totalRounds,
}) => {
  return (
    <div className="space-y-6 text-center py-8">
      <div className="space-y-1">
        <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-semibold border border-indigo-500/20 mr-2">
          {question.difficulty}
        </span>
        <h2 className="text-lg font-bold text-white mt-1.5 inline-block">
          Round {currentRoundIndex + 1} of {totalRounds}
        </h2>
      </div>

      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mt-4">
        Guess the prompt
      </span>
      <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-wide py-4 select-none drop-shadow-lg break-words">
        {question.prompt}
      </div>
    </div>
  );
};
