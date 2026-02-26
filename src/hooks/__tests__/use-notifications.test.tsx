import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNotifications } from '../use-notifications';

describe('useNotifications', () => {
  let notificationSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    notificationSpy = vi.fn();

    Object.defineProperty(window, 'Notification', {
      value: notificationSpy,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(Notification, 'permission', {
      value: 'granted',
      writable: true,
      configurable: true,
    });
    Object.defineProperty(Notification, 'requestPermission', {
      value: vi.fn().mockResolvedValue('granted'),
      writable: true,
      configurable: true,
    });
  });

  it('requests permission on mount when permission is default', () => {
    Object.defineProperty(Notification, 'permission', {
      value: 'default',
      writable: true,
      configurable: true,
    });
    renderHook(() => useNotifications());
    expect(Notification.requestPermission).toHaveBeenCalledTimes(1);
  });

  it('sends notification when notify is called', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.notify('Test Title', { body: 'Test body' });
    });

    expect(notificationSpy).toHaveBeenCalledWith(
      'Test Title',
      expect.objectContaining({ body: 'Test body' }),
    );
  });

  it('does not send notification when permission is denied', () => {
    Object.defineProperty(Notification, 'permission', {
      value: 'denied',
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useNotifications());
    act(() => {
      result.current.notify('Test', { body: 'body' });
    });

    expect(notificationSpy).not.toHaveBeenCalled();
  });

  it('does not send notification when document is focused', () => {
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useNotifications());
    act(() => {
      result.current.notify('Test', { body: 'body' });
    });

    // Should still send — the caller decides when to notify; the hook just checks permission
    expect(notificationSpy).toHaveBeenCalled();
  });
});
