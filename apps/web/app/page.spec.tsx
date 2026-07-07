import * as React from 'react';
import { render, screen } from '@testing-library/react';
import Home from './page';

// Mock the Button component from the workspace package to isolate the test
jest.mock('@fun-friday/ui', () => ({
  Button: ({
    children,
    onClick,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button onClick={onClick} className={variant}>
      {children}
    </button>
  ),
}));

describe('Home (Landing Page)', () => {
  it('renders the landing page title and description', () => {
    render(<Home />);

    // Verify main header title
    const mainTitle = screen.getByText(/The easiest way to host/i);
    expect(mainTitle).toBeInTheDocument();

    // Verify sub-description text
    expect(screen.getByText(/boost employee engagement/i)).toBeInTheDocument();

    // Verify buttons render
    expect(screen.getByText('Create a Room')).toBeInTheDocument();
    expect(screen.getByText('Join Room')).toBeInTheDocument();
  });
});
