import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmojiPicker } from '../EmojiPicker';

describe('EmojiPicker', () => {
  it('renders the trigger button', () => {
    render(<EmojiPicker onSelect={vi.fn()} />);
    expect(screen.getByTestId('emoji-picker-trigger')).toBeInTheDocument();
    expect(screen.getByLabelText('Emoji picker')).toBeInTheDocument();
  });

  it('opens popover on click', async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onSelect={vi.fn()} />);

    await user.click(screen.getByTestId('emoji-picker-trigger'));

    expect(screen.getByTestId('emoji-picker-popover')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-grid')).toBeInTheDocument();
  });

  it('calls onSelect when an emoji is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<EmojiPicker onSelect={onSelect} />);

    await user.click(screen.getByTestId('emoji-picker-trigger'));

    // Click the first emoji in the grid
    const firstEmoji = screen.getByTestId('emoji-grid').querySelector('button');
    expect(firstEmoji).toBeTruthy();
    await user.click(firstEmoji!);

    expect(onSelect).toHaveBeenCalledOnce();
    expect(typeof onSelect.mock.calls[0][0]).toBe('string');
  });

  it('filters emojis when searching', async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onSelect={vi.fn()} />);

    await user.click(screen.getByTestId('emoji-picker-trigger'));
    await user.type(screen.getByTestId('emoji-search-input'), 'rocket');

    const grid = screen.getByTestId('emoji-grid');
    const buttons = grid.querySelectorAll('button');
    // Should find "rocket" in the results
    const rocketBtn = screen.queryByTestId('emoji-rocket');
    expect(rocketBtn).toBeInTheDocument();
    // Should have fewer results than full category
    expect(buttons.length).toBeLessThan(50);
  });

  it('shows no results message for unknown search', async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onSelect={vi.fn()} />);

    await user.click(screen.getByTestId('emoji-picker-trigger'));
    await user.type(screen.getByTestId('emoji-search-input'), 'xyznotfound');

    expect(screen.getByText('No emojis found')).toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    render(<EmojiPicker onSelect={vi.fn()} disabled />);
    expect(screen.getByTestId('emoji-picker-trigger')).toBeDisabled();
  });

  it('renders category tabs', async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onSelect={vi.fn()} />);

    await user.click(screen.getByTestId('emoji-picker-trigger'));

    expect(screen.getByRole('tab', { name: 'Smileys' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'People' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Nature' })).toBeInTheDocument();
  });

  it('switches category on tab click', async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onSelect={vi.fn()} />);

    await user.click(screen.getByTestId('emoji-picker-trigger'));

    // Click on Nature tab
    await user.click(screen.getByRole('tab', { name: 'Nature' }));

    // Should show dog emoji (first in Nature category)
    expect(screen.getByTestId('emoji-dog')).toBeInTheDocument();
  });
});
