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
