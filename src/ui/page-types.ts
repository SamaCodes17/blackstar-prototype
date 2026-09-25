import type { State } from '../core/types';
export interface PageProps {
  state: State;
  expert: boolean;
  selected: string;
  select: (id: string) => void;
  navigate: (page: string) => void;
  update: (body: unknown) => Promise<boolean>;
  action: (path: string, body?: unknown) => Promise<boolean>;
  busy: boolean;
}
