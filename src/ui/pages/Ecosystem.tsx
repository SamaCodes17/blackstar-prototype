import { ArrowRight, ExternalLink, Network, Shield } from 'lucide-react';
import { Panel, Tag, NumberValue as N, Note } from '../shared';
import type { PageProps } from '../page-types';

export function Ecosystem(p: PageProps) {
  const { output } = p.state,
    c = output.contagion;
  return (
    <>
      <Note>
        This is a PREVIEW economic network, not a claim about the institution’s actual partners.
        Corporate filings and peer market data have not been ingested. The coefficients describe
        incremental, non-overlapping losses to reduce double counting.
      </Note>
      <div className="ecosystem-hero">
        <div>
          <p className="eyebrow">Cyber Contagion Extension</p>
          <h2>
            A local incident can have
            <br />a wider economic footprint.
          </h2>
          <p>
            Explore a transparent scenario for partner disruption, peer reputation, and customer
            revenue.
          </p>
          <Tag tag="PREVIEW" />
        </div>
        <div>
          <small>Total modeled ecosystem impact</small>
          <N
            value={c.total}
            label="Ecosystem total"
            formula="Direct ALE + partner loss + sector loss + downstream loss; external coefficients are assumed on a preview network"
          />
        </div>
      </div>
      <Panel title="Trace the economic cascade">
        <div className="contagion-flow">
          <div className="contagion-node primary">
            <Shield size={24} />
            <h3>Direct loss</h3>
            <N value={c.direct} label="Direct expected loss" formula="Stored baseline ALE" />
          </div>
          <div className="flow-arrow">→</div>
          <div className="contagion-branches">
            {[
              { label: 'Partner disruption', value: c.partner, key: 'partner' },
              { label: 'Sector reputation', value: c.sector, key: 'sector' },
              { label: 'Customer revenue', value: c.downstream, key: 'downstream' },
            ].map((item) => (
              <div className="contagion-node" key={item.key}>
                <Network size={20} />
                <h3>{item.label}</h3>
                <N
                  value={item.value}
                  label={item.label}
                  formula={`Direct expected loss × assumed ${item.key} coefficient`}
                />
                <Tag tag="PREVIEW" />
              </div>
            ))}
          </div>
        </div>
        <div className="panel-bottom">
          This bounded linear transmission scenario does not model cycles, market equilibrium, or
          causal stock-price effects.
        </div>
      </Panel>
      <div className="two-column">
        <Panel title="Intended public data sources">
          <div className="link-list">
            <a href="https://www.mca.gov.in/" target="_blank" rel="noreferrer">
              MCA · company filings <ExternalLink size={15} />
            </a>
            <a href="https://www.bseindia.com/" target="_blank" rel="noreferrer">
              BSE · corporate disclosures <ExternalLink size={15} />
            </a>
            <a href="https://www.nseindia.com/" target="_blank" rel="noreferrer">
              NSE · peer market context <ExternalLink size={15} />
            </a>
          </div>
        </Panel>
        <Panel title="Make the scenario your own">
          <p className="panel-copy">
            Adjust each transmission coefficient in the assumption editor. These coefficients are
            illustrative; use validated, non-overlapping business loss channels before treating this
            as investment evidence.
          </p>
          <button className="primary-button" onClick={() => p.navigate('assumptions')}>
            Edit contagion assumptions <ArrowRight size={15} />
          </button>
        </Panel>
      </div>
    </>
  );
}
