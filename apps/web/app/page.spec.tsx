import * as React from 'react';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home (Landing Page)', () => {
  it('renders the landing page title and CTAs', () => {
    render(<Home />);

    // Verify main header title
    const mainTitle = screen.getByText(/The easiest way to host/i);
    expect(mainTitle).toBeInTheDocument();

    // Verify the multiplayer games phrase
    expect(screen.getByText(/multiplayer games/)).toBeInTheDocument();

    // Verify sub-description text
    expect(screen.getByText(/Create a room, share the code/)).toBeInTheDocument();

    // Verify primary CTA button
    expect(screen.getByText('Host a Game')).toBeInTheDocument();

    // Verify secondary CTA button
    expect(screen.getByText('Join a Game')).toBeInTheDocument();

    // Verify feature cards render
    expect(screen.getByText('Zero Sign-Up for Players')).toBeInTheDocument();
    expect(screen.getByText('Real-Time Gameplay')).toBeInTheDocument();
    expect(screen.getByText('Team Building, Gamified')).toBeInTheDocument();

    // Verify header links
    expect(screen.getByText('Host Game')).toBeInTheDocument();
  });
});
