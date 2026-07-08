import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AnswerSubmission } from './answer-submission';

describe('AnswerSubmission Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input field and submit button', () => {
    render(<AnswerSubmission key="q-1" onSubmit={mockOnSubmit} timerRemaining={15} />);

    expect(screen.getByPlaceholderText('Type your guess here...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Answer' })).toBeInTheDocument();
  });

  it('allows user to type an answer', () => {
    render(<AnswerSubmission key="q-1" onSubmit={mockOnSubmit} timerRemaining={15} />);

    const input = screen.getByPlaceholderText('Type your guess here...');
    fireEvent.change(input, { target: { value: 'My Guess' } });
    expect(input).toHaveValue('My Guess');
  });

  it('submits a valid answer', () => {
    render(<AnswerSubmission key="q-1" onSubmit={mockOnSubmit} timerRemaining={15} />);

    const input = screen.getByPlaceholderText('Type your guess here...');
    fireEvent.change(input, { target: { value: 'Harry Potter' } });

    const submitBtn = screen.getByRole('button', { name: 'Submit Answer' });
    fireEvent.click(submitBtn);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith('Harry Potter');
  });

  it('shows validation error when blur occurs on empty input', () => {
    render(<AnswerSubmission key="q-1" onSubmit={mockOnSubmit} timerRemaining={15} />);

    const input = screen.getByPlaceholderText('Type your guess here...');
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(screen.getByText('Answer cannot be empty.')).toBeInTheDocument();
  });

  it('clears error when user starts typing', () => {
    render(<AnswerSubmission key="q-1" onSubmit={mockOnSubmit} timerRemaining={15} />);

    const input = screen.getByPlaceholderText('Type your guess here...');
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(screen.getByText('Answer cannot be empty.')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'A' } });
    expect(screen.queryByText('Answer cannot be empty.')).not.toBeInTheDocument();
  });

  it('highlights error and focuses input if submit is clicked on empty input', () => {
    render(<AnswerSubmission key="q-1" onSubmit={mockOnSubmit} timerRemaining={15} />);

    const submitBtn = screen.getByRole('button', { name: 'Submit Answer' });
    fireEvent.click(submitBtn);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Please enter an answer before submitting.')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Type your guess here...');
    expect(document.activeElement).toBe(input);
  });

  it('disables input and button when timeRemaining is 0', () => {
    render(<AnswerSubmission key="q-1" onSubmit={mockOnSubmit} timerRemaining={0} />);

    const input = screen.getByPlaceholderText("Time's up!");
    const submitBtn = screen.getByRole('button', { name: 'Submit Answer' });

    expect(input).toBeDisabled();
    expect(submitBtn).toBeDisabled();
  });

  it('shows loading state when isSubmitting is true', () => {
    render(
      <AnswerSubmission
        key="q-1"
        onSubmit={mockOnSubmit}
        timerRemaining={15}
        isSubmitting={true}
      />,
    );

    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled();
    expect(screen.getByPlaceholderText('Type your guess here...')).toBeDisabled();
  });

  it('prevents double submission by disabling input and button locally', async () => {
    let resolvePromise: (() => void) | undefined;
    const asyncOnSubmit = jest.fn().mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
    });

    render(<AnswerSubmission key="q-1" onSubmit={asyncOnSubmit} timerRemaining={15} />);

    const input = screen.getByPlaceholderText('Type your guess here...');
    fireEvent.change(input, { target: { value: 'Titanic' } });

    const submitBtn = screen.getByRole('button', { name: 'Submit Answer' });
    fireEvent.click(submitBtn);

    // Call submit again immediately
    fireEvent.click(submitBtn);

    expect(asyncOnSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(input).toBeDisabled();
    expect(submitBtn).toBeDisabled();

    // Resolve the promise
    await act(async () => {
      if (resolvePromise) {
        resolvePromise();
      }
    });

    await waitFor(() => {
      expect(screen.queryByText('Submitting...')).not.toBeInTheDocument();
    });
  });

  it('resets local state when component key changes', () => {
    const { rerender } = render(
      <AnswerSubmission key="q-1" onSubmit={mockOnSubmit} timerRemaining={15} />,
    );

    const input = screen.getByPlaceholderText('Type your guess here...');
    fireEvent.change(input, { target: { value: 'Original Guess' } });

    // Rerender with a new key to recreate the component
    rerender(<AnswerSubmission key="q-2" onSubmit={mockOnSubmit} timerRemaining={15} />);

    expect(screen.getByPlaceholderText('Type your guess here...')).toHaveValue('');
    expect(screen.queryByText('Answer cannot be empty.')).not.toBeInTheDocument();
  });
});
