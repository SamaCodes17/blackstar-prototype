import { NumberValue as N } from '../shared';

export function Metric({
  label,
  value,
  caption,
  formula,
  accent = false,
}: {
  label: string;
  value: number;
  caption: string;
  formula: string;
  accent?: boolean;
}) {
  return (
    <div className={`metric ${accent ? 'metric-accent' : ''}`}>
      <p>{label}</p>
      <N label={label} value={value} formula={formula} />
      <span>{caption}</span>
    </div>
  );
}
