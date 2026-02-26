import { useState, useCallback, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConnectionError } from './ConnectionError';
import type { ConnectionSettings } from '@/store/types';

interface ConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (settings: ConnectionSettings) => void;
  connectionError?: string | null;
}

interface FormErrors {
  host?: string;
  port?: string;
  password?: string;
}

export function ConnectDialog({ open, onOpenChange, onConnect, connectionError }: ConnectDialogProps) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('9001');
  const [password, setPassword] = useState('');
  const [ssl, setSsl] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
    if (!host.trim()) errs.host = 'Host is required';
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) errs.port = 'Port must be 1-65535';
    if (!password.trim()) errs.password = 'Password is required';
    return errs;
  }, [host, port, password]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const errs = validate();
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      onConnect({
        host: host.trim(),
        port: parseInt(port, 10),
        password: password.trim(),
        ssl,
      });
    },
    [host, port, password, ssl, validate, onConnect],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to WeeChat Relay</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="connect-form">
          <div className="space-y-2">
            <label htmlFor="host" className="text-sm font-medium">
              Host
            </label>
            <Input
              id="host"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="weechat.example.com"
              data-testid="host-input"
            />
            {errors.host && (
              <p className="text-sm text-destructive" data-testid="host-error">
                {errors.host}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="port" className="text-sm font-medium">
              Port
            </label>
            <Input
              id="port"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="9001"
              type="number"
              min="1"
              max="65535"
              data-testid="port-input"
            />
            {errors.port && (
              <p className="text-sm text-destructive" data-testid="port-error">
                {errors.port}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Relay password"
              data-testid="password-input"
            />
            {errors.password && (
              <p className="text-sm text-destructive" data-testid="password-error">
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="ssl"
              type="checkbox"
              checked={ssl}
              onChange={(e) => setSsl(e.target.checked)}
              className="h-4 w-4 rounded border-border"
              data-testid="ssl-checkbox"
            />
            <label htmlFor="ssl" className="text-sm font-medium">
              Use SSL/TLS
            </label>
          </div>

          <ConnectionError error={connectionError ?? null} />

          <DialogFooter>
            <Button type="submit" data-testid="connect-button">
              Connect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
