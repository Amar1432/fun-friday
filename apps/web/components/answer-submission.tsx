'use client';

import * as React from 'react';

export interface AnswerSubmissionProps {
  onSubmit: (answer: string) => void | Promise<void>;
  timerRemaining: number | null;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export const AnswerSubmission: React.FC<AnswerSubmissionProps> = ({
  onSubmit,
  timerRemaining,
  isSubmitting = false,
  disabled = false,
}) => {
  const [answer, setAnswer] = React.useState('');
  const [localSubmitting, setLocalSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const activeSubmitting = isSubmitting || localSubmitting;
  const isTimeUp = timerRemaining === 0;
  const isInputDisabled = hasSubmitted || activeSubmitting || isTimeUp || disabled;

  // Submit button is disabled if time is up, it has already been submitted, is currently submitting, or is explicitly disabled.
  // We do NOT disable it if the input is empty to allow validation to trigger on click.
  const isButtonDisabled = hasSubmitted || activeSubmitting || isTimeUp || disabled;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswer(e.target.value);
    if (error) {
      setError(null);
    }
  };

  const handleBlur = () => {
    if (!answer.trim() && !hasSubmitted && !isTimeUp) {
      setError('Answer cannot be empty.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isInputDisabled) return;

    const trimmedAnswer = answer.trim();

    if (!trimmedAnswer) {
      setError('Please enter an answer before submitting.');
      inputRef.current?.focus();
      return;
    }

    setLocalSubmitting(true);
    setHasSubmitted(true);
    setError(null);

    try {
      const result = onSubmit(trimmedAnswer);
      if (result instanceof Promise) {
        await result;
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to submit answer. Please try again.';
      setError(errorMessage);
      setLocalSubmitting(false);
      setHasSubmitted(false);
    } finally {
      setLocalSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto space-y-4"
      data-testid="answer-submission-form"
      noValidate
    >
      <div className="space-y-2">
        <label htmlFor="answer-input" className="sr-only">
          Your Answer
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            id="answer-input"
            type="text"
            placeholder={isTimeUp ? "Time's up!" : 'Type your guess here...'}
            value={answer}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isInputDisabled}
            aria-invalid={!!error}
            aria-describedby={error ? 'answer-error' : undefined}
            className={`w-full bg-slate-950/80 border focus:border-indigo-500 rounded-xl px-4 py-4 text-center text-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner ${
              error ? 'border-rose-500/50 focus:ring-rose-500/30' : 'border-slate-800'
            }`}
            autoComplete="off"
            autoFocus
          />
        </div>

        {/* Error message container with aria-live */}
        <div
          id="answer-error"
          aria-live="polite"
          className="min-h-[20px] text-xs font-semibold text-rose-400 text-center animate-fade-in"
          data-testid="answer-error-message"
        >
          {error ? (
            <span className="flex items-center justify-center gap-1">
              <svg
                className="w-3.5 h-3.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              {error}
            </span>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isButtonDisabled}
        data-testid="submit-answer-button"
        className={`w-full py-4 font-bold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
          isButtonDisabled
            ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed shadow-none hover:scale-100 active:scale-100'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 hover:scale-[1.01] active:scale-[0.99]'
        }`}
      >
        {activeSubmitting ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Submitting...</span>
          </>
        ) : (
          <span>Submit Answer</span>
        )}
      </button>
    </form>
  );
};
