import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ConnectionError } from '../ConnectionError';

describe('ConnectionError', () => {
  beforeEach(() => {
    // nothing
  });

  it('renders nothing when error is null', () => {
    const { container } = render(<ConnectionError error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders error message when error is provided', () => {
    render(<ConnectionError error="Authentication failed" />);
    expect(screen.getByText('Authentication failed')).toBeInTheDocument();
  });

  it('has destructive styling', () => {
    render(<ConnectionError error="Connection refused" />);
    const el = screen.getByTestId('connection-error');
    expect(el.className).toContain('destructive');
  });
});
