import { useState } from 'react';
import type { State } from '../../core/types';
import { Modal } from '../shared';
export function AdminLogin({
  configured,
  close,
  accept,
}: {
  configured: boolean;
  close: () => void;
  accept: (state: State) => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Private admin workspace" close={close}>
      <p>
        Judges and visitors can explore the complete fictional demo without an account. Admin access
        is for managing approved private assessments.
      </p>
      {!configured ? (
        <p role="status">
          Admin sign-in has not been configured for this deployment. The public demo is ready to
          explore.
        </p>
      ) : (
        <form
          className="onboarding-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            const form = e.currentTarget;
            try {
              const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: new FormData(form).get('password') }),
              });
              const data = await response.json();
              if (!response.ok) throw new Error(data.error);
              form.reset();
              accept(data);
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : 'Sign-in failed');
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Admin password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button className="exec-button primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      )}
    </Modal>
  );
}
