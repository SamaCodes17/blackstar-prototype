export type Tag = 'CITED' | 'ASSUMED' | 'COMPUTED' | 'PREVIEW';
export interface Source { id: string; title: string; url: string; date: string; note: string }
export interface Fact { value: number; tag: Tag; reason: string; source?: string; min?: number; max?: number }
export interface Asset { id: string; label: string; hostname: string; kind: string; hostTag: Tag; source?: string; records: Fact; baseline: Fact; epss?: Fact; cve?: string; cvss?: number; kev?: boolean; findingTag?: Tag; product?: string }
export interface Edge { from: string; to: string; weight: Fact; days: Fact; reason: string }
export interface Control { id: string; name: string; description: string; cost: Fact; efficacy: Fact; nodes: string[]; edges: string[]; cvss: number }
export interface AttackerType { id: string; name: string; prior: Fact; entries: string[]; preference: string; multiplier: number }
export interface Assumptions { costPerRecord: Fact; exposure: Fact; recordScale: Fact; edgeScale: Fact; opportunity: Fact; alertThreshold: Fact; partner: Fact; sector: Fact; downstream: Fact }
export interface ScanStatus { collector: string; status: 'LIVE' | 'SNAPSHOT' | 'PREVIEW' | 'UNAVAILABLE'; checkedAt: string; dataAt?: string; message: string; count: number }
export interface Organization { id: string; name: string; domain: string; sector: string; size: number; example: boolean; authorized: boolean; createdAt: string; assets: Asset[]; edges: Edge[]; controls: Control[]; attackers: AttackerType[]; assumptions: Assumptions; scans: ScanStatus[]; inventory: string[]; budget: number; horizon: number; continuous: boolean }
export interface Model { ids: string[]; labels: string[]; e: number[]; values: number[]; parents: { node: number; p: number }[][] }
export interface Risk { ale: number; p90: number; mean: number; ci: [number, number]; parameterBand: [number, number]; p90Band: [number, number]; probabilities: number[]; approximate: number[]; histogram: { low: number; high: number; count: number }[]; trials: number; horizon: number }
export interface Response { type: string; path: string[]; probability: number; utility: number; loss: number; target: string }
export interface Portfolio { mask: number; ids: string[]; cost: number; ale: number; gameLoss: number; responses: Response[]; rosi: number }
export interface QuboResult { backend: string; mask: number; ids: string[]; ale: number; gameLoss: number; ratio: number; feasible: boolean; energy: number; probability?: number }
export interface Timeline { at: string; event: string; ale: number; tag: Tag; affected: string[]; alert: boolean }
export interface Output { at: string; risk: Risk; after: Risk; optimal: Portfolio; naive: Portfolio; portfolios: Portfolio[]; quantum: { results: QuboResult[]; linear: number[]; pairs: { i: number; j: number; coefficient: number }[]; penalty: number; slack: number[]; qubits: number; circuit: string }; sensitivity: { name: string; low: number; high: number }[]; contagion: { direct: number; partner: number; sector: number; downstream: number; total: number }; narration: string; narrationValues: string[]; interventions: { id: string; saved: number; rosi: number }[]; blast: { entry: string; probabilities: number[]; loss: number }[] }
export interface State { org: Organization; output: Output; timeline: Timeline[]; organizations: { id: string; name: string; example: boolean }[] }
