import type { ListDealsOptions, ListDealsResult } from '@/lib/deals';
import type { PublicDeal } from '@/lib/types';
import { isoWeekNumber } from '@/lib/week';

/**
 * Datos de ejemplo para el modo demo (sin Supabase configurado). Sirven para
 * ver la interfaz y el ranking funcionando; no se guarda nada.
 */

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

function demoDeal(deal: Partial<PublicDeal> & Pick<PublicDeal, 'id' | 'title' | 'description'>): PublicDeal {
  return {
    user_id: `demo-user-${deal.id}`,
    deal_type: 'busco_socio',
    image_url: null,
    current_bid: 0,
    status: 'active',
    week_number: isoWeekNumber(),
    views_count: 0,
    contacts_count: 0,
    created_at: daysAgo(3),
    updated_at: daysAgo(1),
    deal_closed: false,
    closed_date: null,
    author_name: 'Equipo demo',
    position: null,
    ...deal,
  } as PublicDeal;
}

const DEMO_DEALS: PublicDeal[] = [
  demoDeal({
    id: 'demo-1',
    title: 'Busco socio tecnico para SaaS de facturacion con 40 clientes',
    description:
      'Llevo 14 meses con un SaaS de facturacion para autonomos. 40 clientes de pago, 1.900 € de MRR y crecimiento del 12 % mensual. Yo llevo producto y ventas; busco un perfil tecnico que quiera entrar como socio (20-30 %) y tomar las riendas del desarrollo.\n\nStack actual: Laravel + Vue, alojado en Hetzner. Hay deuda tecnica que ordenar y una integracion con Verifactu pendiente para 2026.\n\nNo busco freelance ni agencia: busco socio con dedicacion completa a medio plazo.',
    deal_type: 'busco_socio',
    current_bid: 65,
    views_count: 412,
    contacts_count: 18,
    author_name: 'Marta Ibanez',
    created_at: daysAgo(9),
    updated_at: daysAgo(0.4),
  }),
  demoDeal({
    id: 'demo-2',
    title: 'Vendo ecommerce de material deportivo con 180k € de facturacion',
    description:
      'Tienda online de material de escalada y montana, activa desde 2019. Facturacion 2025: 182.000 € con margen bruto del 38 %. Almacen propio subcontratado, 2.400 pedidos al ano y una lista de 11.000 suscriptores.\n\nMotivo de la venta: me mudo fuera y no puedo seguir con la operativa diaria. Traspaso completo: dominio, tienda, proveedores, stock y formacion durante 2 meses.\n\nPrecio orientativo: 145.000 €. Abierto a negociar pago aplazado.',
    deal_type: 'vendo_empresa',
    current_bid: 50,
    views_count: 356,
    contacts_count: 12,
    author_name: 'Javier Ortiz',
    created_at: daysAgo(6),
    updated_at: daysAgo(1),
  }),
  demoDeal({
    id: 'demo-3',
    title: 'Busco inversor para ronda pre-seed de 150k € en logistica urbana',
    description:
      'Plataforma que agrupa entregas de ultima milla para comercios de barrio. Piloto cerrado en Valencia con 26 comercios y 3.100 entregas en 4 meses, reduciendo un 22 % el coste por entrega.\n\nBuscamos 150.000 € pre-seed para abrir Sevilla y Zaragoza y contratar a dos personas de operaciones. Valoracion post-money: 1,2 M €.\n\nEquipo: dos fundadores a tiempo completo, con experiencia previa en logistica y producto.',
    deal_type: 'busco_inversor',
    current_bid: 45,
    views_count: 298,
    contacts_count: 9,
    author_name: 'Nerea Solis',
    created_at: daysAgo(11),
    updated_at: daysAgo(2),
  }),
  demoDeal({
    id: 'demo-4',
    title: 'Partnership: agencia de contenidos busca estudio de diseno',
    description:
      'Somos una agencia de contenidos B2B con 9 clientes recurrentes en sector industrial. Nos piden cada vez mas trabajo de diseno y marca que hoy rechazamos.\n\nBuscamos un estudio pequeno para acuerdo estable de derivacion cruzada: nosotros aportamos volumen de contenidos, vosotros la parte visual. Comision del 10 % por derivacion en ambos sentidos.\n\nIdealmente en Espana y con experiencia en clientes industriales.',
    deal_type: 'partnership',
    current_bid: 30,
    views_count: 187,
    contacts_count: 6,
    author_name: 'Colectivo Norte',
    created_at: daysAgo(4),
    updated_at: daysAgo(1.5),
  }),
  demoDeal({
    id: 'demo-5',
    title: 'Busco asesor fiscal con experiencia en stock options para startups',
    description:
      'Estamos montando un plan de stock options para 7 empleados y necesitamos asesoramiento serio sobre la fiscalidad en Espana tras la Ley de Startups.\n\nBuscamos asesor o despacho que ya lo haya hecho antes, para una consultoria puntual de 4-6 sesiones y la documentacion del plan. Presupuesto cerrado, no por horas.',
    deal_type: 'busco_asesor',
    current_bid: 20,
    views_count: 143,
    contacts_count: 5,
    author_name: 'Ana Redondo',
    created_at: daysAgo(2),
    updated_at: daysAgo(0.8),
  }),
  demoDeal({
    id: 'demo-6',
    title: 'Busco colaborador freelance para app React Native (3 meses)',
    description:
      'App de reservas para centros deportivos, ya en produccion con 4.000 usuarios. Necesito refuerzo durante 3 meses para sacar la version de iOS y rehacer el onboarding.\n\nColaboracion freelance, 20-25 h semanales, remoto. Tarifa a convenir segun experiencia. Codigo en React Native + Expo con backend en Supabase.',
    deal_type: 'busco_colaborador',
    current_bid: 12,
    views_count: 96,
    contacts_count: 4,
    author_name: 'Diego Ferrer',
    created_at: daysAgo(1),
    updated_at: daysAgo(0.5),
  }),
  demoDeal({
    id: 'demo-7',
    title: 'Busco socio comercial para consultora de eficiencia energetica',
    description:
      'Consultora de eficiencia energetica para pymes industriales, facturando 90.000 € al ano con dos tecnicos. Toda la captacion depende hoy del boca a boca.\n\nBusco perfil comercial que quiera entrar como socio minoritario y construir el canal de venta. Hay margen de sobra: cada proyecto medio deja 8.000 € y el mercado esta en plena subida por normativa.',
    deal_type: 'busco_socio',
    current_bid: 0,
    views_count: 31,
    contacts_count: 1,
    author_name: 'Enerlab',
    created_at: daysAgo(0.6),
    updated_at: daysAgo(0.6),
  }),
  demoDeal({
    id: 'demo-8',
    title: 'Vendo dominio y comunidad de newsletter sobre inversion indexada',
    description:
      'Newsletter semanal sobre inversion indexada con 6.800 suscriptores, 47 % de apertura y dominio .es con 4 anos de antiguedad. Monetizada con patrocinios puntuales (unos 400 €/mes).\n\nLa dejo porque he cambiado de sector. Se traspasa dominio, lista, archivo de 120 numeros y las plantillas.',
    deal_type: 'vendo_empresa',
    current_bid: 0,
    views_count: 24,
    contacts_count: 0,
    author_name: 'Pablo Marin',
    created_at: daysAgo(0.3),
    updated_at: daysAgo(0.3),
  }),
  demoDeal({
    id: 'demo-9',
    title: 'Busco inversor para abrir segunda cafeteria de especialidad',
    description:
      'Cafeteria de especialidad en el centro de Granada, rentable desde el mes 8, con 21.000 € de ticket mensual medio. Quiero abrir un segundo local en 2026.\n\nBusco inversor privado para 60.000 € con retorno a 4 anos o entrada en capital del nuevo local. Cuentas auditadas disponibles bajo NDA.',
    deal_type: 'busco_inversor',
    current_bid: 0,
    views_count: 18,
    contacts_count: 0,
    author_name: 'Cafe Vertice',
    created_at: daysAgo(0.15),
    updated_at: daysAgo(0.15),
  }),
];

/** Ranking igual que en produccion: puja DESC, actualizacion DESC. */
function rankedDemoDeals(): PublicDeal[] {
  const featured = DEMO_DEALS.filter((deal) => deal.current_bid > 0).sort(
    (a, b) =>
      b.current_bid - a.current_bid ||
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  return [
    ...featured.map((deal, index) => ({ ...deal, position: index + 1 })),
    ...DEMO_DEALS.filter((deal) => deal.current_bid === 0),
  ];
}

export function demoListDeals(options: ListDealsOptions = {}): ListDealsResult {
  const { page = 1, perPage = 10, type, q, section = 'all' } = options;
  let deals = rankedDemoDeals();

  if (section === 'featured') deals = deals.filter((deal) => deal.current_bid > 0);
  if (section === 'latest') {
    deals = deals
      .filter((deal) => deal.current_bid === 0)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  if (type) deals = deals.filter((deal) => deal.deal_type === type);
  if (q) {
    const term = q.toLowerCase();
    deals = deals.filter(
      (deal) =>
        deal.title.toLowerCase().includes(term) || deal.description.toLowerCase().includes(term),
    );
  }

  const from = (page - 1) * perPage;
  return {
    deals: deals.slice(from, from + perPage),
    total: deals.length,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(deals.length / perPage)),
  };
}

export function demoGetDeal(id: string): PublicDeal | null {
  return rankedDemoDeals().find((deal) => deal.id === id) ?? null;
}

export function demoStats() {
  return { activeDeals: DEMO_DEALS.length, users: 34 };
}
