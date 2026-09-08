import apiClient from './client';
import {
  mockRoutes,
  mockForecast,
  mockRecommendations,
  mockCharterers,
  mockVessels,
  mockVoyages,
  mockMarketKPIs,
  mockMarketTicker,
  mockPortStatus,
  mockPorts,
  mockVesselClasses,
  mockCargoTypes,
  mockBdi,
  mockVlsfo,
  simulateScenario,
} from './mockData';
import {
  validateSelection,
  buildRatesQuery,
  buildGenerateBody,
  displayCommodity,
  emptyShape,
} from './forecastParams';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// Helper to unwrap DRF paginated response (single page)
const unwrapDRF = (data) => (data && Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);

// Helper to fetch ALL pages from a DRF paginated endpoint
const fetchAllPages = async (url, params = {}) => {
  let allResults = [];
  let nextUrl = null;
  // First request uses apiClient with params
  const firstRes = await apiClient.get(url, { params });
  const firstData = firstRes.data;
  if (Array.isArray(firstData)) return firstData; // Not paginated
  allResults = firstData.results || [];
  nextUrl = firstData.next;
  // Follow next links
  while (nextUrl) {
    const res = await apiClient.get(nextUrl);
    const data = res.data;
    allResults = allResults.concat(data.results || []);
    nextUrl = data.next;
  }
  return allResults;
};

// Helper to format date strings YYYY-MM-DD
const formatDate = (d) => {
  if (!d) return '';
  const dateObj = new Date(d);
  return dateObj.toISOString().split('T')[0];
};

// --- Routes ---
export const getRoutes = async () => {
  if (USE_MOCK) return Promise.resolve(mockRoutes);
  try {
    const response = await apiClient.get('/routes/');
    const rawRoutes = unwrapDRF(response.data);
    return rawRoutes.map((r, index) => {
      const idStr = String(r.id);
      const mockFallback = mockRoutes.find((m) => String(m.id) === idStr) || mockRoutes[index % mockRoutes.length] || {};
      return {
        id: idStr,
        origin_port: r.origin_port_name || r.origin_port?.name || mockFallback.origin_port || 'Loading Port',
        destination_port: r.destination_port_name || r.destination_port?.name || mockFallback.destination_port || 'Indian Port',
        origin_country: r.origin_country || r.origin_port?.country || mockFallback.origin_country || 'Global',
        distance_nm: r.distance_nautical_miles || mockFallback.distance_nm || 3500,
        avg_transit_days: r.typical_transit_days || mockFallback.avg_transit_days || 14,
        // Cargo served on this route comes from backend history data
        // (RouteListSerializer.commodities, most-served first) — never
        // hardcoded. Mock fallback only when the backend omits the field.
        cargoes: Array.isArray(r.commodities) && r.commodities.length > 0 ? r.commodities : null,
        primary_cargo: (Array.isArray(r.commodities) && r.commodities.length > 0
          ? displayCommodity(r.commodities[0])
          : null) || mockFallback.primary_cargo || 'Coking Coal',
        current_rate: mockFallback.current_rate || 24.50,
        rate_change_pct: mockFallback.rate_change_pct || -2.4,
      };
    });
  } catch (err) {
    console.warn('Backend routes call failed, falling back to mock routes:', err);
    return mockRoutes;
  }
};

// --- Historical Rates & Forecast Combined Data ---
// horizonDays: pass 30|60|90 to read only that forecast horizon (matches
// the backend `horizon_days` filter). Null reads all stored horizons.
const COMMODITY_FACTORS = {
  coking_coal: 1.0,
  non_coking_coal: 0.8,
  iron_ore: 0.9,
  limestone: 1.15,
};

export { normalizeCommodity } from './forecastParams';

// Guarantee one continuous history→forecast transition on the chart's
// categorical axis: stamp the forecast values onto the LAST historical
// point instead of emitting a separate duplicate-date bridge point (which
// Recharts renders as an adjacent tick, leaving a visible gap between the
// two lines). Idempotent and safe to apply to any combined shape.
export const ensureTransition = (combined) => {
  if (!Array.isArray(combined) || combined.length === 0) return combined;
  combined.sort((a, b) => new Date(a.date) - new Date(b.date));
  let lastHistIdx = -1;
  combined.forEach((c, i) => {
    if (c.rate != null) lastHistIdx = i;
  });
  if (lastHistIdx >= 0 && combined[lastHistIdx].forecast == null) {
    const p = combined[lastHistIdx];
    p.forecast = p.rate;
    p.lower_bound = p.rate;
    p.upper_bound = p.rate;
  }
  return combined;
};

export const getRates = async (routeId, vesselClass = 'Capesize', commodity = 'coking_coal', horizonDays = null) => {
  // Validate first: an invalid selection returns an explicit empty state,
  // never another combination's data.
  const selection = validateSelection({ routeId, vesselClass, commodity });
  if (!selection.valid) {
    console.warn(`Invalid forecast selection (${selection.error}); returning empty state.`);
    return emptyShape({ routeId, vesselClass, commodityKey: normalizeCommodity(commodity) });
  }
  const { routeId: validRouteId, numericRouteId, vesselKey, commodityKey } = selection;

  if (USE_MOCK) {
    return Promise.resolve(
      mockRates(validRouteId, vesselClass, vesselKey, commodityKey)
    );
  }

  try {
    // Vessel lookup doubles as a backend reachability check: if the
    // endpoint itself fails, fall back to mock data for the requested
    // combination. A reachable backend that lacks the vessel (or a
    // mock-namespace route id it cannot hold) returns an empty state —
    // never another combination's data.
    const vesselsRes = await apiClient.get('/vessels/').catch(() => null);
    if (!vesselsRes) {
      console.warn('Backend vessels call failed; using mock data for requested selection.');
      return mockRates(validRouteId, vesselClass, vesselKey, commodityKey);
    }
    let vesselId;
    if (typeof vesselClass === 'number') {
      vesselId = vesselClass;
    } else {
      const vessels = unwrapDRF(vesselsRes.data);
      const match = vessels.find((v) =>
        (v.size_class_display || v.size_class || '').toLowerCase().replace(/[-\s]/g, '') === vesselKey
      );
      if (!match) {
        console.warn(
          `Vessel class "${vesselClass}" not found in /vessels/ response; returning empty state.`
        );
        return emptyShape({ routeId: validRouteId, vesselClass, commodityKey });
      }
      vesselId = match.id;
    }
    if (numericRouteId === null) {
      return emptyShape({ routeId, vesselClass, commodityKey });
    }

    const [rawRates, initialForecasts] = await Promise.all([
      fetchAllPages('/rates/', buildRatesQuery({ numericRouteId, vesselId, commodityKey })).catch(() => []),
      fetchAllPages('/forecasts/', buildRatesQuery({ numericRouteId, vesselId, commodityKey, horizonDays })).catch(() => []),
    ]);

    // Automatic 90-day generation: history exists but no saved forecast rows
    // for this exact combination → trigger one generation with the same
    // parameters, then re-read. Server-side save is clear-then-recreate per
    // route/vessel/commodity/horizon inside a transaction, so repeats are
    // idempotent and never duplicate rows. A failed generation falls through
    // to the history-only result (and its honest warning) below.
    let rawForecasts = initialForecasts;
    if (rawRates.length > 0 && rawForecasts.length === 0) {
      try {
        await apiClient.post(
          '/forecasts/generate/',
          buildGenerateBody({ numericRouteId, vesselId, commodityKey, horizonDays: horizonDays || 90 }),
          { timeout: 120000 },
        );
        rawForecasts = await fetchAllPages(
          '/forecasts/',
          buildRatesQuery({ numericRouteId, vesselId, commodityKey, horizonDays }),
        ).catch(() => []);
      } catch (genErr) {
        console.warn('Automatic forecast generation failed; showing history only:', genErr);
      }
    }

    // Transform historical rates
    const historical = rawRates.map((item) => {
      const rateVal = parseFloat(item.rate_usd_per_ton) || 0;
      return {
        date: item.date,
        rate: rateVal,
        base_freight: Math.round(rateVal * 0.92 * 100) / 100,
        baf: Math.round(rateVal * 0.08 * 100) / 100,
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Transform forecasts
    const forecast = rawForecasts.map((item) => {
      const pred = parseFloat(item.predicted_rate) || 0;
      const lower = parseFloat(item.lower_bound) || pred * 0.95;
      const upper = parseFloat(item.upper_bound) || pred * 1.05;
      return {
        date: item.forecast_date,
        predictedRate: pred,
        lower_bound: lower,
        upper_bound: upper,
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Build combined list for Recharts
    const combinedHist = historical.map((h) => ({
      date: h.date,
      rate: h.rate,
      base_freight: h.base_freight,
      baf: h.baf,
      forecast: null,
      lower_bound: null,
      upper_bound: null,
    }));

    const combinedForecast = forecast.map((f) => ({
      date: f.date,
      rate: null,
      base_freight: null,
      baf: null,
      forecast: f.predictedRate,
      lower_bound: f.lower_bound,
      upper_bound: f.upper_bound,
    }));

    const combined = ensureTransition([...combinedHist, ...combinedForecast]);

    // Backend answered but holds no rows for this combination: explicit
    // empty state, never another combination's (or mock) data.
    if (combined.length === 0) {
      return emptyShape({ routeId: validRouteId, vesselClass, commodityKey });
    }

    // Compute model confidence from forecast interval tightness
    let confidence = 0.85;
    if (forecast.length > 0) {
      const avgSpread = forecast.reduce((sum, f) => sum + (f.upper_bound - f.lower_bound), 0) / forecast.length;
      const avgPred = forecast.reduce((sum, f) => sum + f.predictedRate, 0) / forecast.length;
      confidence = avgPred > 0 ? Math.max(0.5, Math.min(0.98, 1 - (avgSpread / avgPred / 2))) : 0.85;
    }

    return {
      route_id: numericRouteId,
      vessel_class: vesselClass,
      vessel_class_id: vesselId,
      commodity: commodityKey,
      isEmpty: false,
      historical,
      forecast,
      combined,
      confidence,
    };
  } catch (err) {
    // Network/backend failure (not an empty result): mock fallback keeps
    // the demo usable. Pass the validated selection so the fallback still
    // reflects the requested vessel and commodity.
    console.warn('Backend rates call failed, using mock data:', err);
    return mockRates(validRouteId, vesselClass, vesselKey, commodityKey);
  }
};

// Mock series per requested combination: vessel/commodity scaling plus a
// deterministic per-commodity variation so selections never share one
// identical series.
const mockRates = (routeId, vesselClass, vesselKey, commodityKey) => {
  const forecast = mockForecast[routeId] || mockForecast['default'];
  const multiplier = vesselKey === 'capesize' ? 1.0 : vesselKey === 'panamax' ? 0.85 : 0.72;
  const base = multiplier * (COMMODITY_FACTORS[commodityKey] || 1.0);
  const jitterFor = (dateStr) => {
    let h = 2166136261;
    const s = `${commodityKey}:${dateStr}`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return 1 + (((h >>> 0) % 300) - 150) / 10000;
  };
  const scaleVal = (v, dateStr) => (v ? Math.round(v * base * jitterFor(dateStr) * 100) / 100 : null);
  return {
    ...forecast,
    route_id: routeId,
    vessel_class: vesselClass,
    vessel_class_id: null,
    commodity: commodityKey,
    isEmpty: false,
    historical: forecast.historical.map((h) => ({
      ...h,
      rate: scaleVal(h.rate, h.date),
      base_freight: scaleVal(h.base_freight, h.date),
      baf: scaleVal(h.baf, h.date),
    })),
    // Bounds travel with the forecast through the identical per-date
    // scale: scaling one without the other splits the band from the line.
    forecast: (forecast.forecast || []).map((f) => ({
      ...f,
      forecast: scaleVal(f.forecast, f.date),
      predictedRate: scaleVal(f.predictedRate ?? f.forecast, f.date),
      lower_bound: scaleVal(f.lower_bound, f.date),
      upper_bound: scaleVal(f.upper_bound, f.date),
    })),
    combined: ensureTransition(forecast.combined.map((c) => ({
      ...c,
      rate: scaleVal(c.rate, c.date),
      base_freight: scaleVal(c.base_freight, c.date),
      baf: scaleVal(c.baf, c.date),
      forecast: scaleVal(c.forecast, c.date),
      lower_bound: scaleVal(c.lower_bound, c.date),
      upper_bound: scaleVal(c.upper_bound, c.date),
    }))),
  };
};

// --- Forecast ---
export const getForecast = async (routeId) => {
  return getRates(routeId);
};

// --- Recommendations ---
export const getRecommendations = async (routeId) => {
  if (USE_MOCK) {
    if (routeId) {
      return Promise.resolve(mockRecommendations.filter((r) => r.route_id === routeId));
    }
    return Promise.resolve(mockRecommendations);
  }

  try {
    const routeNum = parseInt(routeId, 10) || 1;
    const response = await apiClient.post('/recommendation/', {
      route_id: routeNum,
      vessel_class_id: 3,
      commodity: 'coking_coal',
      volume_mt: 150000,
    });

    const rec = response.data;
    const signalToAction = {
      BUY_NOW: { action: 'CHARTER NOW', action_type: 'urgent' },
      WAIT: { action: 'WAIT / SPOT MARKET', action_type: 'hold' },
      DELAY: { action: 'DELAY BOOKING', action_type: 'hold' },
    };

    const actionMeta = signalToAction[rec.signal] || signalToAction['BUY_NOW'];
    const currentRate = 24.50;
    const finImpactUSD = parseFloat(rec.financial_impact_usd) || 125000;
    const finImpactINR = parseFloat(rec.financial_impact_inr) || (finImpactUSD * 83);

    const transformed = [
      {
        id: rec.id || 'rec-1',
        route_id: String(rec.route || routeNum),
        route_name: rec.route_display || 'Hay Point → Vizag',
        action: actionMeta.action,
        action_type: actionMeta.action_type,
        confidence_score: 92,
        current_rate: currentRate,
        projected_rate_30d: (currentRate - (finImpactUSD / 150000)).toFixed(2),
        projected_rate_change: rec.signal === 'BUY_NOW' ? '+4.2%' : '-3.5%',
        projected_savings_total: finImpactUSD,
        projected_savings_inr: finImpactINR,
        recommended_vessel_class: rec.vessel_class_name || 'Capesize',
        recommended_charter_type: 'Spot Charter',
        cargo_type: rec.commodity ? rec.commodity.replace(/_/g, ' ').toUpperCase() : 'Coking Coal',
        recommended_volume_mt: 150000,
        time_horizon: '14-30 days',
        rationale: rec.rationale,
        cost_benefit: {
          charter_now_cost: 3675000,
          wait_30d_cost: 3675000 - finImpactUSD,
          savings: finImpactUSD,
          savings_pct: 3.4,
        },
        fuel_impact: {
          current_bunker_cost: 620,
          projected_bunker_cost_30d: 645,
          bunker_impact_pct: +4.0,
        },
        risk_factors: [
          'High monsoon swell risks at East Coast ports',
          'VLSFO price volatility in Singapore',
        ],
      },
    ];

    return transformed;
  } catch (err) {
    console.warn('Backend recommendation call failed, using mock recommendations:', err);
    return routeId ? mockRecommendations.filter((r) => r.route_id === routeId) : mockRecommendations;
  }
};

// --- Charterers & Trust Scores ---
export const getCharterers = async () => {
  if (USE_MOCK) return Promise.resolve(mockCharterers);
  try {
    const response = await apiClient.get('/charterers/');
    const rawCharterers = unwrapDRF(response.data);

    if (rawCharterers.length === 0) return mockCharterers;

    return rawCharterers.map((c, idx) => {
      const trustScore = parseFloat(c.trust_score) || 85;
      const onTimePct = parseFloat(c.on_time_delivery_pct) || 90;
      const damageIncidents = parseInt(c.cargo_damage_incidents, 10) || 0;
      const totalVoyages = parseInt(c.total_voyages, 10) || 50;

      return {
        id: String(c.id),
        name: c.name,
        type: 'Primary Charterer',
        country: c.country || 'Global',
        credit_rating: c.trust_grade ? `Grade ${c.trust_grade}` : 'A+',
        trust_score: trustScore,
        trust_grade: c.trust_grade || 'A',
        on_time_delivery_rate: Math.round(onTimePct),
        demurrage_incidents: damageIncidents,
        dispute_count: Math.max(0, Math.round(damageIncidents * 0.8)),
        avg_payment_days: c.payment_reliability_pct >= 90 ? 25 : 35,
        total_volume_mt: totalVoyages * 100000,
        contracts_active: Math.max(1, Math.round(totalVoyages / 15)),
        total_contracts: totalVoyages,
        default_risk: trustScore > 85 ? 'Low' : trustScore > 70 ? 'Low-Medium' : 'Medium',
        total_demurrage_paid: damageIncidents * 15000,
        dispute_resolution_rate: 95,
        notes: `Track record of ${totalVoyages} voyages across global trade routes. Contact: ${c.contact_email || 'chartering@desk.com'}`,
        // Raw scoring inputs for the trust breakdown (null when absent).
        on_time_delivery_pct: c.on_time_delivery_pct ?? null,
        cargo_damage_incidents: c.cargo_damage_incidents ?? null,
        payment_reliability_pct: c.payment_reliability_pct ?? null,
        years_in_operation: c.years_in_operation ?? null,
        total_voyages: totalVoyages,
      };
    });
  } catch (err) {
    console.warn('Backend charterers call failed, using mock charterers:', err);
    return mockCharterers;
  }
};

// --- Recalculate Trust Scores ---
export const recalculateTrustScores = async () => {
  if (USE_MOCK) return Promise.resolve({ status: 'success', message: 'Mock scores recalculated.' });
  const response = await apiClient.post('/charterers/recalculate-scores/');
  return response.data;
};

// --- Vessels ---
export const getVessels = async () => {
  if (USE_MOCK) return Promise.resolve(mockVessels);
  try {
    const response = await apiClient.get('/vessels/');
    const rawVessels = unwrapDRF(response.data);

    if (rawVessels.length === 0) return mockVessels;

    return rawVessels.map((v) => ({
      id: String(v.id),
      name: v.size_class_display || v.size_class,
      size_class: v.size_class,
      min_dwt: v.min_dwt,
      max_dwt: v.max_dwt,
      dwt: v.max_dwt,
      typical_draft: v.typical_draft,
      typical_beam: v.typical_beam,
      typical_loa: v.typical_loa,
    }));
  } catch (err) {
    console.warn('Backend vessels call failed, using mock vessels:', err);
    return mockVessels;
  }
};

// --- Voyages ---
export const getVoyages = async () => {
  if (USE_MOCK) return Promise.resolve(mockVoyages);
  return Promise.resolve(mockVoyages);
};

// --- Shared market period definitions (Overview cards + detail pages) ---
export const MARKET_PERIODS = ['1D', '1W', '1M', 'ALL'];
const PERIOD_DAYS = { '1D': 1, '1W': 7, '1M': 30 };

// Date-based slice of a [{date, ...}] series ending at its latest point.
// 'ALL' returns the full series. Used identically by Pipeline Overview and
// the BDI/VLSFO detail pages so periods always mean the same thing.
export const filterHistoryByPeriod = (history, period) => {
  if (!Array.isArray(history) || history.length === 0) return [];
  if (!period || period === 'ALL') return history;
  const days = PERIOD_DAYS[period];
  if (!days) return history;
  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const cutoff = new Date(sorted[sorted.length - 1].date).getTime() - days * 86400000;
  const sliced = sorted.filter((p) => new Date(p.date).getTime() >= cutoff);
  return sliced.length > 0 ? sliced : sorted.slice(-1);
};

// --- Market KPIs & Dashboard Summary ---
// BDI/VLSFO head values come from the SAME helpers as the detail pages
// (getBdiLatest/getVlsfoLatest + histories), so Overview can never drift.
export const getMarketKPIs = async () => {
  if (USE_MOCK) return Promise.resolve(mockMarketKPIs);
  try {
    const [dashRes, bdiLatest, bdiHistory, vlsfoLatest, vlsfoHistory] = await Promise.all([
      apiClient.get('/dashboard/').catch(() => ({ data: {} })),
      getBdiLatest(),
      getBdiHistory(90),
      getVlsfoLatest(),
      getVlsfoHistory(90),
    ]);
    const data = dashRes.data || {};

    const bci = data.market_indices?.find((i) => i.index_type === 'BCI') || { value: '2980' };
    const vlsfoChange =
      (Array.isArray(vlsfoHistory) && vlsfoHistory.length > 0
        ? vlsfoHistory[vlsfoHistory.length - 1].change_pct
        : null) ?? vlsfoLatest.change_pct ?? 0;

    return {
      baltic_dry_index: {
        value: bdiLatest.value,
        unit: 'points',
        change_pct: bdiLatest.change_pct,
        trend: bdiLatest.change_pct >= 0 ? 'up' : 'down',
        date: bdiLatest.date,
        historical: bdiHistory,
        components: {
          capesize: parseFloat(bci.value) || 2980,
          panamax: 1640,
          supramax: 1210,
        },
      },
      bunker_fuel: {
        vlsfo_singapore: {
          value: vlsfoLatest.value,
          unit: '$/MT',
          change_pct: vlsfoChange,
          date: vlsfoLatest.date,
          historical: vlsfoHistory,
        },
        vlsfo_fujairah: {
          value: 635.50,
          change_pct: -1.2,
        },
      },
      active_shipments: data.total_routes || 12,
      fleet_readiness: {
        readiness_pct: 87.5,
        available_vessels: 28,
        total_fleet: 32,
      },
      rate_projection_90d: {
        direction: 'down',
        magnitude_pct: 3.4,
      },
    };
  } catch (err) {
    console.warn('Backend dashboard summary call failed, using mock KPIs:', err);
    return mockMarketKPIs;
  }
};

// --- Market Ticker ---
export const getMarketTicker = async () => {
  if (USE_MOCK) return Promise.resolve(mockMarketTicker);
  return Promise.resolve(mockMarketTicker);
};

// --- Port Traffic & Port Status ---
export const getPortStatus = async () => {
  if (USE_MOCK) return Promise.resolve(mockPortStatus);
  try {
    const response = await apiClient.get('/port-traffic/');
    const rawPorts = response.data;

    if (!rawPorts || rawPorts.length === 0) return mockPortStatus;

    return rawPorts.map((p) => {
      const waiting = p.ships_currently_at_port || 3;
      const expected = p.expected_incoming_shipments || 5;

      let status = 'Normal';
      if (waiting > 4) status = 'Congested';
      else if (waiting > 2) status = 'Moderate';

      return {
        id: String(p.id),
        port: p.name,
        country: p.country || 'India',
        ships_in_port: p.ships_currently_at_port ?? null,
        vessels_waiting: waiting,
        avg_wait_days: Math.round((waiting * 0.8) * 10) / 10,
        berth_utilization: Math.min(95, 60 + waiting * 7),
        status,
        expected_incoming: expected,
      };
    });
  } catch (err) {
    console.warn('Backend port traffic call failed, using mock port status:', err);
    return mockPortStatus;
  }
};

// --- Port registry (physical limits; mirrors GET /ports/) ---
export const getPorts = async () => {
  if (USE_MOCK) return Promise.resolve(mockPorts);
  try {
    const rows = await fetchAllPages('/ports/');
    if (!rows || rows.length === 0) return mockPorts;
    return rows.map((p) => ({
      id: String(p.id),
      name: p.name,
      country: p.country || 'India',
      port_type: p.port_type,
      max_draft: p.max_draft,
      max_beam: p.max_beam,
      max_loa: p.max_loa,
      ships_currently_at_port: p.ships_currently_at_port,
      expected_incoming_shipments: p.expected_incoming_shipments,
    }));
  } catch (err) {
    console.warn('Backend ports call failed, using mock ports:', err);
    return mockPorts;
  }
};

// --- Feature C: Automated Physical Constraint & Port Feasibility Verification ---
// Live resolution strategy (root-cause fix for the old "network error"):
//  1. /ports/ and /vessels/ are DRF-paginated, so they are read with
//     fetchAllPages — never `.find` on the raw envelope.
//  2. Names are matched case-insensitively against the live registry. When a
//     name cannot be resolved — or the registry itself is unreachable — the
//     call throws a specific, user-facing error. It NEVER posts with
//     hardcoded fallback IDs (the old ids 15/6 do not exist in seeded DBs,
//     which turned every such request into a 404/network failure).
//  3. Backend 4xx responses carry `{error: ...}`; that message is surfaced
//     instead of a generic axios failure.
export const checkPortFeasibility = async (destPortName, vesselClassName, volumeMt) => {
  if (USE_MOCK) {
    return Promise.resolve({
      is_compatible: true,
      port_name: 'Visakhapatnam',
      vessel_class: 'Capesize',
      warnings: [],
      recommended_vessel: 'Capesize',
      details: {
        port_max_draft: 20.0,
        port_max_beam: 50.0,
        port_max_loa: 300.0,
        vessel_draft: 18.2,
        vessel_beam: 45.0,
        vessel_loa: 290.0,
        cargo_volume_mt: volumeMt,
        vessel_max_dwt: 180000,
      },
    });
  }

  const norm = (s) => String(s || '').trim().toLowerCase();

  let ports = null;
  try {
    ports = await fetchAllPages('/ports/');
  } catch {
    ports = null;
  }
  if (!ports) {
    throw new Error(
      'Could not load the live port registry (GET /ports/ failed). ' +
      'Start the Django backend (python manage.py runserver 8000) and retry.',
    );
  }
  const portMatch =
    ports.find((p) => norm(p.name) === norm(destPortName) && p.port_type !== 'origin') ||
    ports.find((p) => norm(p.name) === norm(destPortName));
  if (!portMatch) {
    throw new Error(
      `Port "${destPortName}" was not found in the live port registry. ` +
      'Pick a destination port from the Port Status list.',
    );
  }

  let vessels = null;
  try {
    vessels = await fetchAllPages('/vessels/');
  } catch {
    vessels = null;
  }
  if (!vessels) {
    throw new Error(
      'Could not load the live vessel registry (GET /vessels/ failed). ' +
      'Start the Django backend (python manage.py runserver 8000) and retry.',
    );
  }
  const vesselMatch = vessels.find(
    (v) => norm(v.size_class_display || v.size_class) === norm(vesselClassName),
  );
  if (!vesselMatch) {
    throw new Error(
      `Vessel class "${vesselClassName}" was not found in the live vessel registry. ` +
      'Choose one of the offered vessel classes.',
    );
  }

  let response;
  try {
    response = await apiClient.post('/port-feasibility/', {
      destination_port_id: portMatch.id,
      vessel_class_id: vesselMatch.id,
      volume_mt: parseFloat(volumeMt),
    });
  } catch (err) {
    const serverMsg = err?.response?.data?.error;
    if (serverMsg) throw new Error(serverMsg);
    if (err?.response?.status === 404) {
      throw new Error(
        'Port feasibility endpoint returned 404 — the selected port or vessel no longer exists in backend reference data.',
      );
    }
    throw new Error(
      'Port feasibility request failed: backend unreachable. ' +
      'Start the Django backend (python manage.py runserver 8000) and retry.',
    );
  }
  return response.data;
};

// --- Simulated vessel schedule (per-port ship activity) ---
// There is no live AIS/vessel-schedule endpoint on the backend, so ship
// activity is served from bundled simulated data in BOTH modes. The
// `simulated: true` flag must be surfaced in the UI ("Simulated" badge) so
// mocked movements are never mistaken for live operational data.
export const getVesselSchedule = async (portName) => {
  const { MOCK_VESSEL_SCHEDULE, MOCK_SCHEDULE_UPDATED } = await import('./mockData');
  const vessels = (MOCK_VESSEL_SCHEDULE[portName] || []).map((v) => ({ ...v }));
  return Promise.resolve({
    port: portName,
    vessels,
    simulated: true,
    source: 'Simulated schedule — illustrative planning data, not a live feed',
    updated: MOCK_SCHEDULE_UPDATED,
  });
};

// --- Feature D: Calculate Detailed Itemised Landed Cost ---
export const calculateCostBreakdown = async (routeId, vesselClassIdOrName, commodity, volumeMt) => {
  if (USE_MOCK) {
    const base = volumeMt * 24.50;
    const baf = base * 0.08;
    const port = volumeMt * 2.50;
    const demurrage = base * 0.03;
    const totalUSD = base + baf + port + demurrage;
    return Promise.resolve({
      route_display: 'Hay Point → Vizag',
      vessel_class_name: 'Capesize',
      commodity,
      volume_mt: volumeMt,
      base_freight_cost: base,
      bunker_adjustment_factor: baf,
      port_handling_charges: port,
      demurrage_buffer: demurrage,
      total_landed_cost_usd: totalUSD,
      total_landed_cost_inr: totalUSD * 83.00,
      usd_to_inr_rate: 83.00,
    });
  }

  const vesselsRes = await apiClient.get('/vessels/').catch(() => ({ data: [] }));
  const vessels = unwrapDRF(vesselsRes.data);
  let vesselId = 6;
  if (typeof vesselClassIdOrName === 'string') {
      const match = vessels.find((v) => (v.size_class_display || v.size_class || '').toLowerCase() === vesselClassIdOrName.toLowerCase());
      vesselId = match ? match.id : 6;
  } else {
      const nameMap = {3: 'Capesize', 2: 'Panamax', 1: 'Supramax'};
      const name = nameMap[vesselClassIdOrName] || 'Capesize';
      const match = vessels.find((v) => (v.size_class_display || v.size_class || '').toLowerCase() === name.toLowerCase());
      vesselId = match ? match.id : 6;
  }

  const response = await apiClient.post('/cost-breakdown/', {
    route_id: parseInt(routeId, 10),
    vessel_class_id: vesselId,
    commodity: commodity.toLowerCase().replace(/[-\s]/g, '_'),
    volume_mt: parseFloat(volumeMt),
  });
  return response.data;
};

// --- Vessel Classes ---
export const getVesselClasses = async () => {
  if (USE_MOCK) return Promise.resolve(mockVesselClasses);
  try {
    const response = await apiClient.get('/vessels/');
    const rawVessels = unwrapDRF(response.data);
    if (rawVessels.length === 0) return mockVesselClasses;

    return rawVessels.map((v) => ({
      id: String(v.id),
      name: v.size_class_display || (v.size_class ? v.size_class.charAt(0).toUpperCase() + v.size_class.slice(1) : 'Vessel'),
      dwt: v.max_dwt,
    }));
  } catch (err) {
    return mockVesselClasses;
  }
};

// --- Cargo Types ---
export const getCargoTypes = async () => {
  return Promise.resolve(mockCargoTypes);
};

// --- Scenario Simulation ---
export const runSimulation = async (volumeMt, laycanWeeks, routeId, charterType) => {
  if (USE_MOCK) return Promise.resolve(simulateScenario(volumeMt, laycanWeeks, routeId, charterType));

  try {
    const recRes = await apiClient.post('/recommendation/', {
      route_id: parseInt(routeId, 10) || 1,
      vessel_class_id: 3,
      commodity: 'coking_coal',
      volume_mt: parseFloat(volumeMt),
    });

    const rec = recRes.data;

    // Fetch route info for transit days
    let transitDays = 25; // sensible default
    try {
      const routeRes = await apiClient.get(`/routes/${parseInt(routeId, 10) || 1}/`);
      transitDays = (routeRes.data.avg_transit_days || 25) + laycanWeeks * 7;
    } catch { /* keep default */ }

    // Pick vessel economics based on volume (mirrors backend logic)
    let dailyHire, dailyConsumption, vesselDwt;
    if (volumeMt <= 65000) {
      dailyHire = 12000; dailyConsumption = 28; vesselDwt = 55000;   // Supramax
    } else if (volumeMt <= 85000) {
      dailyHire = 16500; dailyConsumption = 38; vesselDwt = 75000;   // Panamax
    } else {
      dailyHire = 28000; dailyConsumption = 55; vesselDwt = 180000;  // Capesize
    }

    // Spot: derive from recommendation's rationale or use a sensible estimate
    // The recommendation API returns signal + financial_impact but not the rate directly,
    // so we pull the latest rate from the rates endpoint as a fallback.
    let currentRate = 24.50;
    try {
      const ratesRes = await apiClient.get('/rates/', { params: { route: parseInt(routeId, 10) || 1, page_size: 1, ordering: '-date' } });
      const latestRate = ratesRes.data?.results?.[0];
      if (latestRate?.rate_usd_per_ton) currentRate = parseFloat(latestRate.rate_usd_per_ton);
    } catch { /* keep default */ }

    const spotRate = currentRate * 1.03;
    const spotTotal = volumeMt * spotRate;

    // Time charter: operational cost × voyages needed
    const voyages = Math.max(1, Math.ceil(volumeMt / vesselDwt));
    const hireCost = dailyHire * transitDays * voyages;
    const bunkerCost = dailyConsumption * 612 * transitDays * voyages;
    const portCharges = 45000 * 2 * voyages;
    const tcTotal = hireCost + bunkerCost + portCharges;

    const savings = Math.abs(spotTotal - tcTotal);

    return {
      recommended: rec.signal === 'BUY_NOW' ? 'spot' : 'time_charter',
      spot: {
        rate: Math.round(spotRate * 100) / 100,
        total_cost: Math.round(spotTotal),
        cost_per_mt: Math.round(spotRate * 100) / 100,
      },
      time_charter: {
        hire_cost: Math.round(hireCost),
        bunker_cost: Math.round(bunkerCost),
        port_charges: Math.round(portCharges),
        total_cost: Math.round(tcTotal),
        cost_per_mt: Math.round((tcTotal / volumeMt) * 100) / 100,
      },
      savings: Math.round(savings),
      savings_pct: Math.round((savings / Math.max(spotTotal, tcTotal)) * 1000) / 10,
      projected_rate_30d: currentRate * 1.02,
    };
  } catch (err) {
    return simulateScenario(volumeMt, laycanWeeks, routeId, charterType);
  }
};

// --- BDI (live MarketIndex, mock fallback) ---
export const getBdiLatest = async () => {
  if (USE_MOCK) return Promise.resolve(mockBdi.latest);
  try {
    const response = await apiClient.get('/market-indices/latest/');
    const items = Array.isArray(response.data) ? response.data : [];
    const bdi = items.find((i) => i.index_type === 'BDI');
    if (!bdi) return mockBdi.latest;
    return {
      value: parseFloat(bdi.value) || 0,
      change_pct: parseFloat(bdi.change_pct_24h) || 0,
      date: bdi.date || '',
      source: bdi.source || 'synthetic',
    };
  } catch (err) {
    console.warn('Backend BDI latest call failed, using mock BDI:', err);
    return mockBdi.latest;
  }
};

// Generic index history backing both getBdiHistory and the index-graph page.
export const getMarketIndexHistory = async (indexType = 'BDI', days = 90) => {
  if (USE_MOCK) return Promise.resolve(mockBdi.history);
  try {
    const rows = await fetchAllPages('/market-indices/', { index_type: indexType });
    const series = rows
      .map((r) => ({
        date: r.date,
        value: parseFloat(r.value) || 0,
        source: r.source || 'synthetic',
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-days);
    return series.length > 0 ? series : mockBdi.history;
  } catch (err) {
    console.warn('Backend BDI history call failed, using mock BDI:', err);
    return mockBdi.history;
  }
};

export const getBdiHistory = async (days = 90) => getMarketIndexHistory('BDI', days);

// --- VLSFO (live BunkerFuelPrice, mock fallback) ---
// Generic bunker history backing both getVlsfoHistory and the index-graph page.
export const getBunkerFuelHistory = async (days = 90) => {
  if (USE_MOCK) return Promise.resolve(mockVlsfo.history);
  try {
    const rows = await fetchAllPages('/bunker-fuel-prices/');
    const series = rows
      .map((r) => ({
        date: r.date,
        value: parseFloat(r.marine_gas_oil_usd) || 0,
        source: r.source || 'synthetic',
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-days);
    if (series.length >= 2) {
      const last = series[series.length - 1];
      const prev = series[series.length - 2];
      last.change_pct = prev.value
        ? Math.round(((last.value - prev.value) / prev.value) * 1000) / 10
        : null;
    }
    return series.length > 0 ? series : mockVlsfo.history;
  } catch (err) {
    console.warn('Backend VLSFO history call failed, using mock VLSFO:', err);
    return mockVlsfo.history;
  }
};

export const getVlsfoLatest = async () => {
  if (USE_MOCK) return Promise.resolve(mockVlsfo.latest);
  try {
    const response = await apiClient.get('/bunker-fuel-prices/latest/');
    const data = response.data || {};
    if (!data.marine_gas_oil_usd) return mockVlsfo.latest;
    return {
      value: parseFloat(data.marine_gas_oil_usd) || 0,
      unit: '$/MT',
      currency: 'USD',
      change_pct: null,
      date: data.date || '',
      source: data.source || 'synthetic',
    };
  } catch (err) {
    console.warn('Backend VLSFO latest call failed, using mock VLSFO:', err);
    return mockVlsfo.latest;
  }
};

export const getVlsfoHistory = async (days = 90) => getBunkerFuelHistory(days);
