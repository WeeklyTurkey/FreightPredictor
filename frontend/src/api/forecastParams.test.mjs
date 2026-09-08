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

console.log('forecastParams: all assertions passed');
