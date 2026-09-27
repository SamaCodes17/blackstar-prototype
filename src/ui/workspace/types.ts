import type { State } from '../../core/types';
export type View = 'overview' | 'evidence' | 'risk' | 'investment' | 'report' | 'pricing';
export function viewFromHash(): View {
  const route = window.location.hash.replace('#/', '');
  return ['overview', 'evidence', 'risk', 'investment', 'report', 'pricing'].includes(route)
    ? (route as View)
    : 'overview';
}
export interface WorkspaceProps {
  view: View;
  state: State;
  busy: boolean;
  offline: boolean;
  navigate: (view: View) => void;
  update: (body: unknown) => Promise<boolean>;
  refresh: () => Promise<boolean>;
  inputs: () => void;
  ask: (question: string) => void;
  explain: () => void;
}
