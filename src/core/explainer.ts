import type { State } from './types';
import { decisionSummary } from './decision';
const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
export interface Explanation {
  text: string;
  destination: 'overview' | 'evidence' | 'risk' | 'investment' | 'report';
}
/** Deliberately bounded local explainer: it never invents observations or calls an AI service. */
export function explainAssessment(question: string, state: State, page: string): Explanation {
  const q = question.toLowerCase();
  const { org, output } = state;
  const d = decisionSummary(org, output);
  const answer = (text: string, destination: Explanation['destination']): Explanation => ({
    text,
    destination,
  });
  if (/this page|where.*start|help me|how.*use/.test(q)) {
    const pages: Record<string, string> = {
      overview:
        'Start with estimated loss, then review the recommended investment. Evidence explains what was observed; Attack paths explores what could happen; Board brief prepares a printable summary.',
      evidence:
        'Source cards show the latest recorded result, not a guarantee of continuous coverage. Open a source for dates and evidence, search the systems table, or expand discovered names and assessment activity.',
      risk: 'Select a graph node to inspect its business impact. Switch between current exposure and recommended protections. Click any node to force a starting breach and see every downstream branch. Replay spread to step through the connections, or explore the explicitly illustrative network.',
      investment:
        'Choose an annual budget and planning period, then select Update plan. Compare the recommendation against current exposure and a severity-first plan. Expand the protection options to see alternatives.',
      report:
        'The board brief summarizes the selected plan, its estimated impact and the inputs requiring validation. Use Print / PDF to produce a shareable copy.',
    };
    return answer(
      pages[page] ?? pages.overview,
      page in pages ? (page as Explanation['destination']) : 'overview',
    );
  }
  if (/shodan|shodun|api|key/.test(q)) {
    const scan = org.scans.find((s) => s.collector === 'Service / CVE correlation');
    return answer(
      !state.integrations?.shodanConfigured
        ? 'An authenticated Shodan key is not configured. The public InternetDB fallback does not require a key and can return weekly IP-level snapshots; check the source card for its actual result.'
        : scan?.issue === 'ACCESS_DENIED'
          ? 'A Shodan key is configured, but the latest search was blocked by the account’s access permissions. No successful search is implied by having a key. See the Shodan source card for the recorded status.'
          : `A Shodan key is configured. Latest recorded service lookup: ${scan?.status ?? 'not checked'}. Configuration alone does not establish that live observations were retrieved. The collector can fall back from filtered search to public DNS plus IP-host lookups, then the public InternetDB snapshot when host access is restricted. Open its source card to inspect which method succeeded.`,
      'evidence',
    );
  }
  if (
    /genuine|real|computed|assum|accur|trust|estimate|financial|loss|ale|saving/.test(q) &&
    !/p90|uncert|conditional/.test(q)
  )
    return answer(
      `For ${org.name}, estimated loss is ${rupees(d.before)} over ${org.horizon} days, compared with ${rupees(d.after)} with the selected protections. The difference is ${rupees(d.avoided)}. These figures are calculated, but record counts, financial impact, connections and protection effectiveness include assumptions. They are not observed losses or guaranteed savings. Annual protection cost is ${rupees(d.spend)}.`,
      'investment',
    );
  if (/p90|uncert|distribution|confidence|simulation/.test(q))
    return answer(
      `The simulated 90th-percentile loss is ${rupees(output.risk.p90)}: 90% of the ${output.risk.trials.toLocaleString('en-IN')} modeled outcomes are at or below it. That describes this model, not a promise about reality. The simulation’s sampling confidence interval is different from uncertainty in the assumed inputs.`,
      'risk',
    );
  if (/conditional|blast|compromis|what if/.test(q))
    return answer(
      'The attack graph forces your selected starting system to be compromised, switches off other initial entry events, then estimates spread through the mapped connections. It is a hypothetical impact estimate, not the probability of a real incident. Clicking a node or exploring sandbox connections does not change saved evidence.',
      'risk',
    );
  if (/plan|budget|recommend|invest|cost|protect|optim/.test(q))
    return answer(
      `The plan selects ${d.controls.length} protections for ${rupees(d.spend)} per year within your ${rupees(org.budget)} annual budget. It weighs modeled attacker responses and overlapping protections. It is not simply a ranking of vulnerability severity or a guarantee of maximum cash savings. Loss comparisons cover ${org.horizon} days; prices are annual. Review quotes and effectiveness before approving spend.`,
      'investment',
    );
  if (/graph|path|connect|attack|edge|node/.test(q))
    return answer(
      `The graph contains ${org.assets.length} modeled systems and ${org.edges.length} mapped connections. A node represents a system; a line represents an assumed route through which compromise could spread. ${org.edges.length ? 'Highlighted routes are modeled attacker choices.' : 'No connections are currently mapped, so the graph does not establish internal attack paths.'} Select a node or compare protections to inspect the estimate. This is not detection of an active attack.`,
      'risk',
    );
  if (/source|evidence|live|cve|epss|kev|vulnerab|certificate|asset/.test(q))
    return answer(
      `This assessment includes ${org.assets.length} modeled systems and ${org.inventory.length} discovered names. A certificate observation establishes a name, not a vulnerability. EPSS describes global exploitation probability; KEV lists known exploited vulnerabilities. Neither proves a particular system is affected. PREVIEW associations are illustrative. Source cards show actual recorded availability, timestamps and observations.`,
      'evidence',
    );
  if (/layer/.test(q))
    return answer(
      'The prototype supports evidence collection, modeled risk propagation and investment comparison. Evidence collection is partial: public observations do not automatically establish internal dependencies or verified business impact. Those gaps remain assumptions that your team needs to validate.',
      'overview',
    );
  if (/quantum|method|experiment/.test(q))
    return answer(
      'The experimental comparison runs software methods on the same small planning problem, including simulated quantum circuits. It does not use quantum hardware and does not demonstrate quantum advantage. The main recommendation remains a bounded prototype calculation.',
      'investment',
    );
  if (/report|board|print|pdf/.test(q))
    return answer(
      'Open Board brief to review the selected actions, financial comparison and validation checklist. Print / PDF uses your browser’s print dialog. Validate business assumptions before using it to approve an investment.',
      'report',
    );
  return answer(
    'I can explain this assessment’s loss estimates, sources, attack paths, uncertainty, budget and board brief. I cannot answer unrelated questions or verify new security findings. Try “Are these numbers genuine?” or “Why was this plan selected?”',
    'overview',
  );
}
