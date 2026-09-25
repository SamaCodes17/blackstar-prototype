import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { State } from '../core/types';
import { Modal, Tag, Note } from './shared';
export function Onboarding({
  close,
  accept,
}: {
  close: () => void;
  accept: (state: State) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          domain: form.get('domain'),
          sector: form.get('sector'),
          size: Number(form.get('size')),
          authorized: form.get('authorized') === 'on',
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      accept(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Add your organization" close={close}>
      <p className="muted">
        Start with your public footprint. Public indexes discover certificate names; uncertain
        dependencies and loss inputs remain editable.
      </p>
      <form className="onboarding-form" onSubmit={(e) => void submit(e)}>
        <label>
          Organization name
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            placeholder="Your institution or business"
          />
        </label>
        <label>
          Primary domain
          <input name="domain" required placeholder="example.org" autoCapitalize="none" />
        </label>
        <div className="two-column">
          <label>
            Sector
            <select name="sector">
              <option value="education">Education</option>
              <option value="government">Government</option>
              <option value="msme">MSME</option>
              <option value="financial">Bank / financial</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            People / students / employees <Tag tag="ASSUMED" />
            <input name="size" type="number" min={1} max={10000000} defaultValue={1000} required />
          </label>
        </div>
        <label className="checkbox-label">
          <input name="authorized" type="checkbox" required />I am authorized to assess this domain.
        </label>
        <Note>
          Only third-party public indexes are queried. No packets are sent to the target
          infrastructure. This local prototype stores no login credentials.
        </Note>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-button" disabled={busy} type="submit">
          {busy ? 'Reading public indexes…' : 'Create assessment'}
          <ArrowRight size={15} />
        </button>
      </form>
    </Modal>
  );
}
