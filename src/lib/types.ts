export const DEAL_TYPES = [
  'busco_socio',
  'vendo_empresa',
  'busco_inversor',
  'busco_colaborador',
  'busco_asesor',
  'partnership',
] as const;

export type DealType = (typeof DEAL_TYPES)[number];

export type DealStatus = 'pending' | 'active' | 'closed' | 'archived';

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  busco_socio: 'Busco socio',
  vendo_empresa: 'Vendo empresa',
  busco_inversor: 'Busco inversor',
  busco_colaborador: 'Busco colaborador',
  busco_asesor: 'Busco asesor',
  partnership: 'Partnership',
};

/** Clases Tailwind del badge por tipo de deal. */
export const DEAL_TYPE_BADGE: Record<DealType, string> = {
  busco_socio: 'bg-blue-50 text-blue-700 ring-blue-200',
  vendo_empresa: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  busco_inversor: 'bg-amber-50 text-amber-700 ring-amber-200',
  busco_colaborador: 'bg-violet-50 text-violet-700 ring-violet-200',
  busco_asesor: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  partnership: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export interface PublicDeal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  deal_type: DealType;
  image_url: string | null;
  current_bid: number;
  status: DealStatus;
  week_number: number;
  views_count: number;
  contacts_count: number;
  created_at: string;
  updated_at: string;
  deal_closed: boolean;
  closed_date: string | null;
  author_name: string;
  position: number | null;
}

export interface DealContact {
  id: string;
  deal_id: string;
  visitor_email: string;
  visitor_name: string;
  message: string;
  contacted_at: string;
}

export interface BidRecord {
  id: string;
  deal_id: string;
  user_id: string;
  amount: number;
  payment_id: string | null;
  payment_status: 'pending' | 'succeeded' | 'failed' | 'free';
  kind: 'initial' | 'rebid';
  timestamp: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  created_at: string;
}

export function isDealType(value: unknown): value is DealType {
  return typeof value === 'string' && (DEAL_TYPES as readonly string[]).includes(value);
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
