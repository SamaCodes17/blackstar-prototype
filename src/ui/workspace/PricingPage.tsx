import { useState } from 'react';
const plans = [
  {
    name: 'Startup',
    price: '₹4,999',
    audience: 'Small teams finding their first security priorities',
    features: ['One organization', 'Guided risk assessment', 'Budget comparison & board brief'],
  },
  {
    name: 'MSME',
    price: '₹14,999',
    audience: 'Growing businesses balancing protection and cost',
    features: [
      'Everything in Startup',
      'Assisted business-input review',
      'Prioritized remediation planning',
    ],
  },
  {
    name: 'Business',
    price: '₹49,999',
    audience: 'Larger organizations coordinating business units',
    features: [
      'Everything in MSME',
      'Onboarding and scope workshops',
      'Assisted executive reporting',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Let’s scope it',
    audience: 'Global organizations with complex requirements',
    features: [
      'Custom scope and deployment design',
      'Identity, integration & residency review',
      'Capacity and support agreed after discovery',
    ],
  },
];
export function PricingPage() {
  const [selected, setSelected] = useState('Enterprise');
  return (
    <>
      <div className="ws-heading">
        <div>
          <p className="ws-eyebrow">PLANS / GROW WITH CONFIDENCE</p>
          <h1>Clarity at every stage.</h1>
          <p>Start with the decisions you need to make. Build a plan around your organization.</p>
        </div>
      </div>
      <p className="demo-notice">
        <strong>Proposed pilot pricing.</strong> Monthly INR, excluding taxes. Discuss a scoped
        pilot with us—no payment is collected here.
      </p>
      <div className="pricing-grid">
        {plans.map((plan) => (
          <section
            className={'ws-card pricing-card ' + (plan.name === 'MSME' ? 'pricing-highlight' : '')}
            key={plan.name}
          >
            <p className="ws-eyebrow">
              {plan.name === 'MSME' ? 'FOR GROWING TEAMS' : plan.name.toUpperCase()}
            </p>
            <h2>{plan.name}</h2>
            <p>{plan.audience}</p>
            <div className="pricing-price">
              {plan.price}
              {plan.name !== 'Enterprise' && <small>/ month</small>}
            </div>
            <ul>
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button
              className="exec-button secondary"
              onClick={() => {
                setSelected(plan.name);
                document.getElementById('plan-enquiry')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Discuss {plan.name}
            </button>
          </section>
        ))}
      </div>
      <section className="ws-card pricing-enquiry" id="plan-enquiry">
        <div>
          <p className="ws-eyebrow">LET’S FIND YOUR FIT</p>
          <h2>A plan built around your needs.</h2>
          <p>
            For very large organizations, we first agree on systems, business units, identity
            controls, integrations and support. Enterprise capabilities and capacity require
            separate validation beyond this prototype.
          </p>
        </div>
        <form
          className="onboarding-form"
          onSubmit={(e) => {
            e.preventDefault();
            const values = new FormData(e.currentTarget);
            const body = `Plan: ${selected}\nOrganization: ${values.get('organization')}\nApproximate employees: ${values.get('employees')}\nRequirements: ${values.get('requirements')}\n\nPlease help us scope an appropriate BlackStar pilot.`;
            window.location.href = `mailto:samscollege17@gmail.com?subject=${encodeURIComponent('BlackStar ' + selected + ' enquiry')}&body=${encodeURIComponent(body)}`;
          }}
        >
          <label>
            Plan
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {plans.map((p) => (
                <option key={p.name}>{p.name}</option>
              ))}
            </select>
          </label>
          <label>
            Organization
            <input name="organization" required maxLength={100} placeholder="Your organization" />
          </label>
          <label>
            Approximate employees
            <input name="employees" type="number" min="1" max="10000000" required />
          </label>
          <label>
            What do you need?
            <textarea
              name="requirements"
              rows={3}
              maxLength={1500}
              placeholder="Teams, systems, reporting or integration needs"
            />
          </label>
          <button className="exec-button primary">Open email enquiry</button>
          <small>
            Opens your email app for review. Nothing is sent automatically. You can also email{' '}
            <a href="mailto:samscollege17@gmail.com">samscollege17@gmail.com</a>.
          </small>
        </form>
      </section>
    </>
  );
}
