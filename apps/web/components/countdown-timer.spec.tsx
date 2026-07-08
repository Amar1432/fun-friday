import React from 'react';
import { render, screen } from '@testing-library/react';
import { CountdownTimer } from './countdown-timer';

describe('CountdownTimer', () => {
  it('renders nothing when timerRemaining is null', () => {
    const { container } = render(<CountdownTimer timerRemaining={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the time remaining correctly with normal styles', () => {
    render(<CountdownTimer timerRemaining={15} />);
    expect(screen.getByText('Time Remaining')).toBeInTheDocument();

    const timeElement = screen.getByText('15s');
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveClass('text-slate-100');
    expect(timeElement).not.toHaveClass('text-rose-500');
    expect(timeElement).not.toHaveClass('animate-pulse');
  });

  it('renders the time remaining with danger styles when time is 5 or below', () => {
    render(<CountdownTimer timerRemaining={5} />);
    expect(screen.getByText('Time Remaining')).toBeInTheDocument();

    const timeElement = screen.getByText('5s');
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveClass('text-rose-500');
    expect(timeElement).toHaveClass('animate-pulse');
    expect(timeElement).not.toHaveClass('text-slate-100');
  });
});
