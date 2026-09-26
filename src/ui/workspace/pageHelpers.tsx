import { CircleHelp } from 'lucide-react';
import type { WorkspaceProps } from './types';
export function pageHelpers(p: WorkspaceProps) {
  const help = (question: string) => (
    <button className="ws-help" onClick={() => p.ask(question)}>
      <CircleHelp size={15} /> Explain this
    </button>
  );
  const heading = (kicker: string, title: string, text: string) => (
    <div className="ws-heading">
      <div>
        <p className="ws-eyebrow">{kicker}</p>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {help('Help me understand this page')}
    </div>
  );
  return { help, heading };
}
