import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsForm } from '../SettingsForm';
import { useSettingsStore } from '@/store/settings-store';
import { themes } from '@/lib/themes';

describe('ThemePicker', () => {
  beforeEach(() => {
    useSettingsStore.setState({ theme: 'default-dark' });
  });

  it('renders a trigger showing the current theme name', () => {
    render(<SettingsForm />);
    const trigger = screen.getByTestId('theme-select');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Default Dark');
  });

  it('shows color swatches on the trigger', () => {
    render(<SettingsForm />);
    const trigger = screen.getByTestId('theme-select');
    const swatches = within(trigger).getAllByTestId('theme-swatch-dot');
    expect(swatches.length).toBeGreaterThanOrEqual(4);
  });

  it('opens dropdown with all themes on click', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    await user.click(screen.getByTestId('theme-select'));

    const dropdown = screen.getByTestId('theme-dropdown');
    expect(dropdown).toBeInTheDocument();

    // Should have a "System (Auto)" option
    expect(within(dropdown).getByText('System (Auto)')).toBeInTheDocument();

    // Should have light and dark section labels
    expect(within(dropdown).getByText('Light')).toBeInTheDocument();
    expect(within(dropdown).getByText('Dark')).toBeInTheDocument();
  });

  it('lists all themes in the dropdown', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    await user.click(screen.getByTestId('theme-select'));

    for (const theme of themes) {
      expect(screen.getByTestId(`theme-option-${theme.id}`)).toBeInTheDocument();
    }
  });

  it('each theme option shows color swatches', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    await user.click(screen.getByTestId('theme-select'));

    const firstOption = screen.getByTestId(`theme-option-${themes[0].id}`);
    const swatches = within(firstOption).getAllByTestId('theme-swatch-dot');
    expect(swatches.length).toBeGreaterThanOrEqual(4);
  });

  it('selects a theme when clicked', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    await user.click(screen.getByTestId('theme-select'));
    await user.click(screen.getByTestId('theme-option-dracula'));

    expect(useSettingsStore.getState().theme).toBe('dracula');
  });

  it('closes dropdown after selection', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    await user.click(screen.getByTestId('theme-select'));
    expect(screen.getByTestId('theme-dropdown')).toBeInTheDocument();

    await user.click(screen.getByTestId('theme-option-nord'));

    expect(screen.queryByTestId('theme-dropdown')).not.toBeInTheDocument();
  });

  it('highlights the currently selected theme', async () => {
    useSettingsStore.setState({ theme: 'monokai' });
    const user = userEvent.setup();
    render(<SettingsForm />);

    await user.click(screen.getByTestId('theme-select'));

    const option = screen.getByTestId('theme-option-monokai');
    expect(option.getAttribute('data-selected')).toBe('true');
  });

  it('shows "System (Auto)" as trigger text when theme is system', () => {
    useSettingsStore.setState({ theme: 'system' });
    render(<SettingsForm />);
    expect(screen.getByTestId('theme-select')).toHaveTextContent('System (Auto)');
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(<SettingsForm />);

    await user.click(screen.getByTestId('theme-select'));
    expect(screen.getByTestId('theme-dropdown')).toBeInTheDocument();

    // Click outside
    await user.click(document.body);

    expect(screen.queryByTestId('theme-dropdown')).not.toBeInTheDocument();
  });
});
