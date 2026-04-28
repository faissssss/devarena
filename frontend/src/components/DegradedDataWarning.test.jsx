import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import DegradedDataWarning from './DegradedDataWarning';

describe('DegradedDataWarning', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders warning message when provided', () => {
    const message = 'Database unavailable. Showing live data from CLIST/Kontests only.';
    render(<DegradedDataWarning message={message} />);
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('does not render when message is empty', () => {
    const { container } = render(<DegradedDataWarning message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when message is null', () => {
    const { container } = render(<DegradedDataWarning message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('dismisses warning when close button is clicked', () => {
    const message = 'Test warning message';
    render(<DegradedDataWarning message={message} />);
    
    const dismissButton = screen.getByLabelText('Dismiss warning');
    fireEvent.click(dismissButton);
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('persists dismissal state in sessionStorage', () => {
    const message = 'Test warning message';
    const { rerender } = render(<DegradedDataWarning message={message} />);
    
    const dismissButton = screen.getByLabelText('Dismiss warning');
    fireEvent.click(dismissButton);
    
    // Rerender component to simulate page refresh
    rerender(<DegradedDataWarning message={message} />);
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders with correct accessibility attributes', () => {
    const message = 'Test warning message';
    render(<DegradedDataWarning message={message} />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    
    const dismissButton = screen.getByLabelText('Dismiss warning');
    expect(dismissButton).toBeInTheDocument();
  });
});
