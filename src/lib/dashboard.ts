import { createClient } from '@/lib/supabase/server';
import type { BidRecord, DealContact, DealStatus, DealType } from '@/lib/types';

export interface DashboardDeal {
  id: string;
  title: string;
  deal_type: DealType;
  current_bid: number;
  status: DealStatus;
  views_count: number;
  contacts_count: number;
  created_at: string;
  updated_at: string;
  deal_closed: boolean;
  closed_date: string | null;
  position: number | null;
}

export interface DashboardContact extends DealContact {
  deal_title: string;
}

export interface DashboardData {
  deals: DashboardDeal[];
  bids: (BidRecord & { deal_title: string })[];
  contacts: DashboardContact[];
  totals: { spent: number; views: number; contacts: number };
}

/** Datos privados del panel del usuario autenticado. */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = createClient();

  const [{ data: myDeals }, { data: ranked }, { data: bidRows }] = await Promise.all([
    supabase
      .from('deals')
      .select(
        'id,title,deal_type,current_bid,status,views_count,contacts_count,created_at,updated_at,deal_closed,closed_date',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase.from('ranked_deals').select('id,position').eq('user_id', userId),
    supabase
      .from('bid_history')
      .select('id,deal_id,user_id,amount,payment_id,payment_status,kind,timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(50),
  ]);

  const positions = new Map<string, number | null>(
    (ranked ?? []).map((row: { id: string; position: number | null }) => [row.id, row.position]),
  );
  const deals: DashboardDeal[] = (myDeals ?? []).map((deal) => ({
    ...(deal as Omit<DashboardDeal, 'position'>),
    current_bid: Number(deal.current_bid),
    position: positions.get(deal.id) ?? null,
  }));

  const titles = new Map(deals.map((deal) => [deal.id, deal.title]));
  const dealIds = deals.map((deal) => deal.id);

  let contacts: DashboardContact[] = [];
  if (dealIds.length > 0) {
    const { data: contactRows } = await supabase
      .from('deal_contacts')
      .select('id,deal_id,visitor_email,visitor_name,message,contacted_at')
      .in('deal_id', dealIds)
      .order('contacted_at', { ascending: false })
      .limit(100);

    contacts = (contactRows ?? []).map((row) => ({
      ...(row as DealContact),
      deal_title: titles.get(row.deal_id) ?? 'Deal eliminado',
    }));
  }

  const bids = (bidRows ?? []).map((bid) => ({
    ...(bid as BidRecord),
    amount: Number(bid.amount),
    deal_title: titles.get(bid.deal_id) ?? 'Deal eliminado',
  }));

  return {
    deals,
    bids,
    contacts,
    totals: {
      spent: bids
        .filter((bid) => bid.payment_status === 'succeeded')
        .reduce((sum, bid) => sum + bid.amount, 0),
      views: deals.reduce((sum, deal) => sum + deal.views_count, 0),
      contacts: deals.reduce((sum, deal) => sum + deal.contacts_count, 0),
    },
  };
}
