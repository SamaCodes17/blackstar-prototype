import type { WorkspaceProps } from './types';
export { viewFromHash, type View } from './types';
import { OverviewPage } from './OverviewPage';
import { EvidencePage } from './EvidencePage';
import { RiskExplorer } from './RiskExplorer';
import { InvestmentPage } from './InvestmentPage';
export function Workspace(p: WorkspaceProps) {
  if (p.view === 'overview') return <OverviewPage {...p} />;
  if (p.view === 'evidence') return <EvidencePage {...p} />;
  if (p.view === 'risk') return <RiskExplorer {...p} />;
  return <InvestmentPage {...p} />;
}
