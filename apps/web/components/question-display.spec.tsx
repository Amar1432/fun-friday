import React from 'react';
import { render, screen } from '@testing-library/react';
import { QuestionDisplay } from './question-display';

describe('QuestionDisplay', () => {
  const mockQuestion = {
    id: 'q-1',
    prompt: '🎩⚡👦',
    timeLimitSeconds: 20,
    difficulty: 'MEDIUM',
  };

  it('renders the question prompt correctly', () => {
    render(<QuestionDisplay question={mockQuestion} currentRoundIndex={0} totalRounds={5} />);
    expect(screen.getByText('🎩⚡👦')).toBeInTheDocument();
  });

  it('renders the round number correctly', () => {
    render(<QuestionDisplay question={mockQuestion} currentRoundIndex={2} totalRounds={5} />);
    expect(screen.getByText('Round 3 of 5')).toBeInTheDocument();
  });

  it('renders the difficulty metadata', () => {
    render(<QuestionDisplay question={mockQuestion} currentRoundIndex={0} totalRounds={5} />);
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('does not render any correct answer', () => {
    render(<QuestionDisplay question={mockQuestion} currentRoundIndex={0} totalRounds={5} />);
    // The component does not even receive the answer as a prop,
    // so it naturally cannot render it. Here we just assert it doesn't somehow show it from prompt.
    expect(screen.queryByText('Harry Potter')).not.toBeInTheDocument();
  });
});
