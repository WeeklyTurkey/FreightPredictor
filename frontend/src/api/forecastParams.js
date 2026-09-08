// Pure vessel/cargo selection logic for the forecast flow.
//
// Dependency-free (no axios, no import.meta) so it can be unit-tested with
// plain node: `npm run test:params`. freightService.js is the only importer.

export const SUPPORTED_COMMODITIES = [
  'coking_coal',
  'non_coking_coal',
  'iron_ore',
  'limestone',
];

export const SUPPORTED_VESSELS = ['capesize', 'panamax', 'supramax'];

export const normalizeCommodity = (commodity) =>
  (commodity || '').toLowerCase().replace(/[-\s]/g, '_');

export const normalizeVessel = (vesselClass) =>
  (vesselClass || '').toLowerCase().replace(/[-\s]/g, '');

const COMMODITY_DISPLAY = {
  coking_coal: 'Coking Coal',
  non_coking_coal: 'Non-Coking Coal',
  iron_ore: 'Iron Ore',
  limestone: 'Limestone',
};

// Backend commodity key → selector display name. Unknown keys pass through
// unchanged (never silently substituted).
export const displayCommodity = (commodityKey) =>
  COMMODITY_DISPLAY[normalizeCommodity(commodityKey)] || String(commodityKey || '');

// Deep link from an Overview route card to its forecast graph.
export const forecastUrlForRoute = (routeId) => `/rates/forecast?route=${routeId}`;

// Validate a UI selection. Returns normalized values or an explicit error —
// never a silently substituted default.
//
// Route ids come in two namespaces: numeric backend ids ('33') and mock ids
// ('route_001', used when the backend is unreachable). Both are accepted;
// garbage is rejected.
export const validateSelection = ({ routeId, vesselClass, commodity }) => {
  const rawRouteId = String(routeId ?? '').trim();
  const numericRouteId = /^\d+$/.test(rawRouteId) ? parseInt(rawRouteId, 10) : null;
  if (rawRouteId === '' || (numericRouteId === null && !/^route_\d+$/i.test(rawRouteId))) {
    return { valid: false, error: `Invalid route id: ${routeId}` };
  }
  const vesselKey = normalizeVessel(vesselClass);
  if (!SUPPORTED_VESSELS.includes(vesselKey)) {
    return { valid: false, error: `Unsupported vessel class: ${vesselClass}` };
  }
  const commodityKey = normalizeCommodity(commodity);
  if (!SUPPORTED_COMMODITIES.includes(commodityKey)) {
    return { valid: false, error: `Unsupported commodity: ${commodity}` };
  }
  return { valid: true, routeId: rawRouteId, numericRouteId, vesselKey, commodityKey };
};

// Query params for GET /rates/ and GET /forecasts/ (backend namespace:
// numeric ids only).
export const buildRatesQuery = ({ numericRouteId, vesselId, commodityKey, horizonDays }) => {
  const params = { route: numericRouteId, vessel_class: vesselId, commodity: commodityKey };
  if (horizonDays) params.horizon_days = horizonDays;
  return params;
};

// Body for POST /forecasts/generate/.
export const buildGenerateBody = ({ numericRouteId, vesselId, commodityKey, horizonDays }) => ({
  route_id: numericRouteId,
  vessel_class_id: vesselId,
  commodity: commodityKey,
  horizon_days: horizonDays,
});

// Explicit empty result: identifies the requested combination and carries
// no other combination's data.
export const emptyShape = ({ routeId, vesselClass, commodityKey }) => ({
  route_id: routeId,
  vessel_class: vesselClass,
  vessel_class_id: null,
  commodity: commodityKey,
  historical: [],
  forecast: [],
  combined: [],
  confidence: 0,
  isEmpty: true,
});

// Verify rendered data matches the current selection.
export const matchesSelection = (data, { routeId, vesselClass, commodity }) => {
  if (!data) return false;
  const wantedCommodity = normalizeCommodity(commodity);
  if (data.commodity && normalizeCommodity(data.commodity) !== wantedCommodity) {
    return false;
  }
  if (
    data.route_id != null &&
    String(data.route_id) !== String(routeId) &&
    Number(data.route_id) !== Number(routeId)
  ) {
    return false;
  }
  if (data.vessel_class && normalizeVessel(data.vessel_class) !== normalizeVessel(vesselClass)) {
    return false;
  }
  return true;
};

// Day counts behind each chart range button. Unknown keys fall back to the
// full two-year window rather than silently showing nothing.
export const RANGE_DAYS = { '6m': 180, '1y': 365, '2y': 730 };
export const DEFAULT_RANGE = '2y';

// Pure date-range slice for the forecast chart. Anchors the window at the
// latest historical date (never "today", so seeded backfills behave), keeps
// every in-window history point plus the FULL forecast tail, and therefore
// preserves the historical→forecast transition point in every range.
// Returns { historical, combined } with the same row identities.
export const filterForecastByRange = (historical, combined, dateRange) => {
  const hist = Array.isArray(historical) ? historical : [];
  const comb = Array.isArray(combined) ? combined : [];
  const days = RANGE_DAYS[dateRange] ?? RANGE_DAYS[DEFAULT_RANGE];
  if (hist.length === 0) return { historical: [], combined: [] };
  // Explicit chronological sort (never lexicographic string sort, which
  // breaks on non-zero-padded or non-ISO date inputs).
  const ascending = [...hist].sort((a, b) => new Date(a.date) - new Date(b.date));
  const cutoff = new Date(ascending[ascending.length - 1].date).getTime() - days * 86400000;
  const histSlice = hist.filter((h) => new Date(h.date).getTime() >= cutoff);
  const histDates = new Set(histSlice.map((h) => h.date));
  const combinedSlice = comb.filter((c) => histDates.has(c.date) || c.forecast != null);
  return { historical: histSlice, combined: combinedSlice };
};
