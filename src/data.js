// Synthetic demo scenario — single source of truth for every screen and language.
// Nothing here is a model output, a forecast, or live operational data.

export const scenario = {
  meta: {
    source: 'synthetic-demo', // i18n key suffix: provenance.synthetic
    asOf: '2026-10-07T06:30:00+09:00', // illustrative timestamp
    validated: false,
    integrations: {
      government: 'not-connected',
      market: 'not-connected',
      supplier: 'not-connected',
      tracesource: 'not-connected',
    },
  },
  order: {
    id: 'ORD-2026-1009-SKJ',
    species: 'skipjack', // i18n key: species.skipjack
    quantityKg: 5000,
    dueDate: '2026-10-09',
    buyer: 'buyer-a', // i18n key: buyer.buyer-a
  },
  stock: {
    confirmedKg: 1100,
    location: 'cold-store-1', // i18n key: location.cold-store-1
    verifiedAt: '2026-10-07T05:50:00+09:00',
  },
  // Illustrative landing outlook by the deadline. Static scenario inputs.
  forecast: {
    p10Kg: 2500,
    p50Kg: 3150,
    p90Kg: 3800,
    horizonEnds: '2026-10-09',
  },
  // Offered / unconfirmed. Never counted toward confirmed coverage until a human records it as verified.
  offers: [
    {
      id: 'OFF-001',
      supplier: 'supplier-b', // i18n key: supplier.supplier-b
      quantityKg: 600,
      status: 'offered', // 'offered' | 'verified' | 'declined'
      etaDate: '2026-10-08',
    },
  ],
  arrivals: [
    { id: 'ARR-1', date: '2026-10-07', vesselKey: 'vessel-1', expectedKg: 900, status: 'expected' },
    { id: 'ARR-2', date: '2026-10-08', vesselKey: 'vessel-2', expectedKg: 1250, status: 'expected' },
    { id: 'ARR-3', date: '2026-10-09', vesselKey: 'vessel-3', expectedKg: 1000, status: 'uncertain' },
  ],
  // Explainable next-step suggestions. Selecting one records a local demo event only.
  suggestions: [
    { id: 'SUG-offer', key: 'request-offer', evidenceKeys: ['ev.gap-median', 'ev.offer-exists'] },
    { id: 'SUG-wait', key: 'wait-update', evidenceKeys: ['ev.next-landing', 'ev.p90-covers'] },
    { id: 'SUG-buyer', key: 'discuss-buyer', evidenceKeys: ['ev.gap-median', 'ev.deadline'] },
  ],
};

// Pure arithmetic shown on screen as a traceable breakdown.
export function computeCoverage(s) {
  const stock = s.stock.confirmedKg;
  const need = s.order.quantityKg;
  const cov = (p) => stock + p;
  const gap = (p) => Math.max(0, need - cov(p));
  return {
    need,
    stock,
    coverage: { p10: cov(s.forecast.p10Kg), p50: cov(s.forecast.p50Kg), p90: cov(s.forecast.p90Kg) },
    gap: { p10: gap(s.forecast.p10Kg), p50: gap(s.forecast.p50Kg), p90: gap(s.forecast.p90Kg) },
    offeredUnconfirmedKg: s.offers.filter((o) => o.status === 'offered').reduce((a, o) => a + o.quantityKg, 0),
    verifiedOffersKg: s.offers.filter((o) => o.status === 'verified').reduce((a, o) => a + o.quantityKg, 0),
  };
}

// Local demo activity: in-memory only, resets on reload.
export const initialActivity = [];
