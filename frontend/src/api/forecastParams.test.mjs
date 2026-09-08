// Unit tests for forecastParams.js (pure selection logic).
// Run: npm run test:params   (plain node, no dependencies)
import assert from 'node:assert';
import {
  normalizeCommodity,
  normalizeVessel,
  validateSelection,
  buildRatesQuery,
  buildGenerateBody,
  emptyShape,
  matchesSelection,
  displayCommodity,
  forecastUrlForRoute,
  filterForecastByRange,
} from './forecastParams.js';

// Display names from the cargo/vessel selectors must normalize to DB keys.
assert.strictEqual(normalizeCommodity('Coking Coal'), 'coking_coal');
assert.strictEqual(normalizeCommodity('Non-Coking Coal'), 'non_coking_coal');
assert.strictEqual(normalizeCommodity('Iron Ore'), 'iron_ore');
assert.strictEqual(normalizeCommodity('Limestone'), 'limestone');
assert.strictEqual(normalizeVessel('Capesize'), 'capesize');
assert.strictEqual(normalizeVessel('Panamax'), 'panamax');

// Capesize/Coking Coal and Panamax/Iron Ore produce different params.
const capesize = validateSelection({ routeId: '1', vesselClass: 'Capesize', commodity: 'Coking Coal' });
const panamax = validateSelection({ routeId: '1', vesselClass: 'Panamax', commodity: 'Iron Ore' });
assert.deepStrictEqual(capesize, {
  valid: true, routeId: '1', numericRouteId: 1, vesselKey: 'capesize', commodityKey: 'coking_coal',
});
assert.deepStrictEqual(panamax, {
  valid: true, routeId: '1', numericRouteId: 1, vesselKey: 'panamax', commodityKey: 'iron_ore',
});

// Mock-namespace ids (backend unreachable) validate with null numeric id.
const mockSel = validateSelection({ routeId: 'route_001', vesselClass: 'Capesize', commodity: 'Coking Coal' });
assert.strictEqual(mockSel.valid, true);
assert.strictEqual(mockSel.numericRouteId, null);
const q1 = buildRatesQuery({ numericRouteId: capesize.numericRouteId, vesselId: 3, commodityKey: capesize.commodityKey, horizonDays: 90 });
const q2 = buildRatesQuery({ numericRouteId: panamax.numericRouteId, vesselId: 2, commodityKey: panamax.commodityKey, horizonDays: 90 });
assert.notDeepStrictEqual(q1, q2);
assert.deepStrictEqual(q1, { route: 1, vessel_class: 3, commodity: 'coking_coal', horizon_days: 90 });

// Generation body carries the current selection, not defaults.
const body = buildGenerateBody({ numericRouteId: panamax.numericRouteId, vesselId: 2, commodityKey: panamax.commodityKey, horizonDays: 90 });
assert.deepStrictEqual(body, {
  route_id: 1, vessel_class_id: 2, commodity: 'iron_ore', horizon_days: 90,
});

// Invalid selections are explicit errors, never silent defaults.
for (const bad of [
  { routeId: 'abc', vesselClass: 'Capesize', commodity: 'Coking Coal' },
  { routeId: '1', vesselClass: 'Handysize', commodity: 'Coking Coal' },
  { routeId: '1', vesselClass: 'Capesize', commodity: '' },
  { routeId: '1', vesselClass: 'Capesize', commodity: 'Uranium' },
]) {
  const r = validateSelection(bad);
  assert.strictEqual(r.valid, false, JSON.stringify(bad));
}

// Empty shape carries identity and no data.
const empty = emptyShape({ routeId: 1, vesselClass: 'Panamax', commodityKey: 'iron_ore' });
assert.strictEqual(empty.isEmpty, true);
assert.deepStrictEqual(empty.historical, []);
assert.strictEqual(empty.commodity, 'iron_ore');

// Selection matching detects mismatches (stale renders).
const tagged = { route_id: 1, vessel_class: 'Panamax', commodity: 'iron_ore' };
assert.strictEqual(
  matchesSelection(tagged, { routeId: '1', vesselClass: 'Panamax', commodity: 'Iron Ore' }),
  true,
);
assert.strictEqual(
  matchesSelection(tagged, { routeId: '1', vesselClass: 'Capesize', commodity: 'Iron Ore' }),
  false,
);
assert.strictEqual(
  matchesSelection(tagged, { routeId: '1', vesselClass: 'Panamax', commodity: 'Coking Coal' }),
  false,
);

// Route cards deep-link to the exact forecast graph.
assert.strictEqual(forecastUrlForRoute('33'), '/rates/forecast?route=33');
assert.strictEqual(forecastUrlForRoute('route_001'), '/rates/forecast?route=route_001');

// Backend commodity keys map to selector display names; unknowns pass through.
assert.strictEqual(displayCommodity('coking_coal'), 'Coking Coal');
assert.strictEqual(displayCommodity('non_coking_coal'), 'Non-Coking Coal');
assert.strictEqual(displayCommodity('iron_ore'), 'Iron Ore');
assert.strictEqual(displayCommodity('limestone'), 'Limestone');
assert.strictEqual(displayCommodity('Coking Coal'), 'Coking Coal');
assert.strictEqual(displayCommodity('mystery_ore'), 'mystery_ore');

// 2Y range on live-shaped data: 366 daily history rows + 90-day forecast.
const dayMs = 86400000;
const maxHist = new Date('2026-09-05T00:00:00Z').getTime();
const iso = (t) => new Date(t).toISOString().split('T')[0];
const liveHist = Array.from({ length: 366 }, (_, k) => ({
  date: iso(maxHist - (365 - k) * dayMs), rate: 20,
}));
const liveFc = Array.from({ length: 90 }, (_, k) => ({
  date: iso(maxHist + (k + 1) * dayMs),
  rate: null, forecast: 20, lower_bound: 18, upper_bound: 22,
}));
const liveCombined = [
  ...liveHist.map((h) => ({ ...h, forecast: null, lower_bound: null, upper_bound: null })),
  ...liveFc,
];
// Transition stamp mirrors ensureTransition: forecast pinned to last history point.
liveCombined[liveHist.length - 1] = {
  ...liveCombined[liveHist.length - 1], forecast: 20, lower_bound: 20, upper_bound: 20,
};

const r2y = filterForecastByRange(liveHist, liveCombined, '2y');
assert.strictEqual(r2y.historical.length, 366);
assert.strictEqual(r2y.historical[0].date, '2025-09-05');
assert.strictEqual(r2y.combined.length, 366 + 90);
assert.strictEqual(r2y.combined.at(-1).date, '2026-12-04');
// Transition preserved: last history date carries both rate and forecast.
const transition = r2y.combined.find((c) => c.date === '2026-09-05');
assert.ok(transition.rate != null && transition.forecast != null);
// No gaps across the full 2Y history slice.
for (let i = 1; i < r2y.historical.length; i++) {
  const gap = new Date(r2y.historical[i].date) - new Date(r2y.historical[i - 1].date);
  assert.strictEqual(gap, dayMs);
}

const r1y = filterForecastByRange(liveHist, liveCombined, '1y');
assert.strictEqual(r1y.historical.length, 366);
assert.strictEqual(r1y.historical[0].date, '2025-09-05');
assert.strictEqual(r1y.combined.length, 366 + 90);
assert.strictEqual(r1y.combined.at(-1).date, '2026-12-04');

const r6m = filterForecastByRange(liveHist, liveCombined, '6m');
assert.strictEqual(r6m.historical.length, 181);
assert.strictEqual(r6m.combined.length, 181 + 90);

// Unknown range falls back to the full two-year window; empty stays empty.
const rBogus = filterForecastByRange(liveHist, liveCombined, '9y');
assert.strictEqual(rBogus.historical.length, 366);
assert.deepStrictEqual(filterForecastByRange([], [], '2y'), { historical: [], combined: [] });

// Real seeded span: 731 daily rows over two years — 2Y keeps every one.
const max2y = new Date('2026-09-08T00:00:00Z').getTime();
const hist731 = Array.from({ length: 731 }, (_, k) => ({
  date: iso(max2y - (730 - k) * dayMs), rate: 20,
}));
const comb731 = hist731.map((h) => ({ ...h, forecast: null }));
const r731 = filterForecastByRange(hist731, comb731, '2y');
assert.strictEqual(r731.historical.length, 731);
assert.strictEqual(r731.historical[0].date, '2024-09-08');
assert.strictEqual(r731.historical.at(-1).date, '2026-09-08');
assert.strictEqual(r731.combined.length, 731);

console.log('forecastParams: all assertions passed');
