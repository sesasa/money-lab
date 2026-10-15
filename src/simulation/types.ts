export type CountryId = "US" | "EU" | "IN";
export type CurrencyCode = "USD" | "EUR" | "INR";
export type Stage =
  | "raw"
  | "processor"
  | "manufacturer"
  | "distributor"
  | "consumer";
export interface Currency {
  code: CurrencyCode;
  symbol: string;
  issuerCountry: CountryId;
}
export interface Wallet {
  USD: number;
  EUR: number;
  INR: number;
}
export interface Inventory {
  input: number;
  output: number;
}
export interface EconomicNode {
  id: string;
  country: CountryId;
  chainId: string;
  name: string;
  stage: Stage;
  inventory: Inventory;
  capacity: number;
  productivity: number;
  inputRequirement: number;
  output: number;
  wallet: Wallet;
}
export interface CurrencyIssuer {
  autoStabilize: boolean;
  targetPrice: number;
  adjustmentRate: number;
  targetSupply: number;
  netIssued: number;
  lastAdjustment: number;
}
export interface Country {
  id: CountryId;
  name: string;
  currency: CurrencyCode;
  nodes: EconomicNode[];
  productivity: number;
  capacity: number;
  velocity: number;
  issuer: CurrencyIssuer;
  metrics: Metrics;
}
export interface Metrics {
  Y: number;
  M: number;
  V: number;
  P: number | null;
  inflation: number | null;
  capacity: number;
  inventory: number;
  consumption: number;
  cumulativeConsumption: number;
  imports: number;
  exports: number;
}
export interface Transaction {
  id: string;
  tick: number;
  kind: "goods" | "income" | "issuance";
  from: string;
  to: string;
  currency: CurrencyCode;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  good?: string;
}
export interface FXMarket {
  domesticCurrency: "EUR" | "INR";
  domesticPerUSD: number;
  liquidity: number;
  netUSDBuying: number;
}
export interface TimelinePoint {
  tick: number;
  time: number;
  Y: number;
  M: number;
  V: number;
  P: number | null;
  event?: string;
}
export interface Scenario {
  id: string;
  name: string;
  tag: string;
  description: string;
  observation: string;
  parameters: Partial<Parameters>;
}
export interface Parameters {
  productivity: number;
  capacity: number;
  moneySupply: number;
  velocity: number;
  autoStabilize: boolean;
  targetPrice: number;
}
export interface SimulationState {
  tick: number;
  time: number;
  dt: number;
  countries: Country[];
  currencies: Currency[];
  fxMarkets: FXMarket[];
  transactions: Transaction[];
  history: TimelinePoint[];
  scenarioId: string;
  explanation: string;
}
