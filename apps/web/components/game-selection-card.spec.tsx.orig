import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { GameSelectionCard, GameSelectionGrid } from './game-selection-card';
import { GAME_MODES } from '@/lib/game-modes';

describe('GameSelectionCard', () => {
  const mode = GAME_MODES[0];

  it('renders game name, description, icon, and question count', () => {
    render(<GameSelectionCard mode={mode} isSelected={false} onSelect={jest.fn()} />);

    expect(screen.getByRole('radio', { name: /Emoji Guess/ })).toBeInTheDocument();
    expect(
      screen.getByText('Guess the movie, show, or phrase from a set of emojis!'),
    ).toBeInTheDocument();
    expect(screen.getByText('🎭')).toBeInTheDocument();
    expect(screen.getByText('40 questions')).toBeInTheDocument();
  });

  it('marks selected state accessibly and visually', () => {
    render(<GameSelectionCard mode={mode} isSelected={true} onSelect={jest.fn()} />);

    const card = screen.getByRole('radio', { name: /Emoji Guess/ });
    expect(card).toHaveAttribute('aria-checked', 'true');
    expect(card).toHaveClass('bg-surface-raised');
    expect(card).toHaveClass('shadow-panel');
    expect(screen.getByTestId('emoji-guess-selection-indicator')).toHaveClass('bg-game-emoji-soft');
  });

  it('calls onSelect with the mode gameId', () => {
    const onSelect = jest.fn();
    render(<GameSelectionCard mode={mode} isSelected={false} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('radio', { name: /Emoji Guess/ }));

    expect(onSelect).toHaveBeenCalledWith(mode.gameId);
  });
});

describe('GameSelectionGrid', () => {
  it('renders all modes inside a radiogroup', () => {
    render(
      <GameSelectionGrid
        modes={GAME_MODES}
        selectedGameId={GAME_MODES[1].gameId}
        onSelectGame={jest.fn()}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'Game mode' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: /Bad Movie Description/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
