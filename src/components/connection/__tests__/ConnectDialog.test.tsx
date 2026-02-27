import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectDialog } from '../ConnectDialog';
import { useSettingsStore } from '@/store/settings-store';

describe('ConnectDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConnect: vi.fn(),
  };

  beforeEach(() => {
    useSettingsStore.setState({ savedConnection: null });
  });

  it('renders all form fields', () => {
    render(<ConnectDialog {...defaultProps} />);

    expect(screen.getByTestId('host-input')).toBeInTheDocument();
    expect(screen.getByTestId('port-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('ssl-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('connect-button')).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup();
    render(<ConnectDialog {...defaultProps} />);

    await user.click(screen.getByTestId('connect-button'));

    expect(screen.getByTestId('host-error')).toHaveTextContent('Host is required');
    expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
    expect(defaultProps.onConnect).not.toHaveBeenCalled();
  });

  it('calls onConnect with settings when form is valid', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    render(<ConnectDialog {...defaultProps} onConnect={onConnect} />);

    await user.type(screen.getByTestId('host-input'), 'relay.example.com');
    await user.clear(screen.getByTestId('port-input'));
    await user.type(screen.getByTestId('port-input'), '9001');
    await user.type(screen.getByTestId('password-input'), 'secret');
    await user.click(screen.getByTestId('connect-button'));

    expect(onConnect).toHaveBeenCalledWith({
      host: 'relay.example.com',
      port: 9001,
      password: 'secret',
      ssl: true,
    });
  });

  it('submits with SSL disabled when unchecked', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    render(<ConnectDialog {...defaultProps} onConnect={onConnect} />);

    await user.type(screen.getByTestId('host-input'), 'localhost');
    await user.type(screen.getByTestId('password-input'), 'pass');
    await user.click(screen.getByTestId('ssl-checkbox'));
    await user.click(screen.getByTestId('connect-button'));

    expect(onConnect).toHaveBeenCalledWith(expect.objectContaining({ ssl: false }));
  });

  it('validates port range', async () => {
    const user = userEvent.setup();
    render(<ConnectDialog {...defaultProps} />);

    await user.type(screen.getByTestId('host-input'), 'localhost');
    await user.clear(screen.getByTestId('port-input'));
    await user.type(screen.getByTestId('port-input'), 'abc');
    await user.type(screen.getByTestId('password-input'), 'pass');
    await user.click(screen.getByTestId('connect-button'));

    expect(screen.getByTestId('port-error')).toHaveTextContent('Port must be 1-65535');
    expect(defaultProps.onConnect).not.toHaveBeenCalled();
  });

  it('pre-fills from saved connection settings', () => {
    useSettingsStore.setState({
      savedConnection: { host: 'saved.example.com', port: 8443, ssl: false },
    });
    render(<ConnectDialog {...defaultProps} />);

    expect(screen.getByTestId('host-input')).toHaveValue('saved.example.com');
    expect(screen.getByTestId('port-input')).toHaveValue(8443);
    expect(screen.getByTestId('ssl-checkbox')).not.toBeChecked();
    expect(screen.getByTestId('password-input')).toHaveValue('');
  });

  it('uses defaults when no saved connection exists', () => {
    render(<ConnectDialog {...defaultProps} />);

    expect(screen.getByTestId('host-input')).toHaveValue('');
    expect(screen.getByTestId('port-input')).toHaveValue(9001);
    expect(screen.getByTestId('ssl-checkbox')).toBeChecked();
    expect(screen.getByTestId('password-input')).toHaveValue('');
  });
});
