// ============================================================
// Mock Data — Realistic Dry Bulk Maritime Shipping Dataset
// Routes: Indonesia/Australia/South Africa → East Coast India
// ============================================================

// --- Routes ---
export const mockRoutes = [
  {
    id: 'route_001',
    origin_port: 'Tanjung Bara',
    origin_country: 'Indonesia',
    origin_coords: { lat: -0.68, lng: 117.32 },
    destination_port: 'Paradip',
    destination_country: 'India',
    destination_coords: { lat: 20.26, lng: 86.70 },
    distance_nm: 3180,
    primary_cargo: 'Coal',
    vessel_classes: ['Capesize', 'Panamax', 'Supramax'],
    avg_transit_days: 12,
    current_rate: 14.50,
    rate_change_pct: 3.2,
  },
  {
    id: 'route_002',
    origin_port: 'Hay Point',
    origin_country: 'Australia',
    origin_coords: { lat: -21.27, lng: 149.30 },
    destination_port: 'Visakhapatnam',
    destination_country: 'India',
    destination_coords: { lat: 17.69, lng: 83.28 },
    distance_nm: 5420,
    primary_cargo: 'Coal',
    vessel_classes: ['Capesize', 'Panamax'],
    avg_transit_days: 19,
    current_rate: 19.80,
    rate_change_pct: 5.8,
  },
  {
    id: 'route_003',
    origin_port: 'Richards Bay',
    origin_country: 'South Africa',
    origin_coords: { lat: -28.80, lng: 32.09 },
    destination_port: 'Visakhapatnam',
    destination_country: 'India',
    destination_coords: { lat: 17.69, lng: 83.28 },
    distance_nm: 6750,
    primary_cargo: 'Coal',
    vessel_classes: ['Capesize', 'Panamax'],
    avg_transit_days: 24,
    current_rate: 22.50,
    rate_change_pct: 2.1,
  },
  {
    id: 'route_004',
    origin_port: 'Port Hedland',
    origin_country: 'Australia',
    origin_coords: { lat: -20.31, lng: 118.61 },
    destination_port: 'Haldia',
    destination_country: 'India',
    destination_coords: { lat: 22.08, lng: 88.10 },
    distance_nm: 5680,
    primary_cargo: 'Iron Ore',
    vessel_classes: ['Capesize', 'Panamax'],
    avg_transit_days: 20,
    current_rate: 21.00,
    rate_change_pct: -1.4,
  },
  {
    id: 'route_005',
    origin_port: 'Gove',
    origin_country: 'Australia',
    origin_coords: { lat: -12.18, lng: 136.78 },
    destination_port: 'Chennai',
    destination_country: 'India',
    destination_coords: { lat: 13.08, lng: 80.29 },
    distance_nm: 4920,
    primary_cargo: 'Bauxite',
    vessel_classes: ['Panamax', 'Supramax'],
    avg_transit_days: 17,
    current_rate: 17.20,
    rate_change_pct: 4.5,
  },
  {
    id: 'route_006',
    origin_port: 'Tanjung Bara',
    origin_country: 'Indonesia',
    origin_coords: { lat: -0.68, lng: 117.32 },
    destination_port: 'Dhamra',
    destination_country: 'India',
    destination_coords: { lat: 20.96, lng: 86.93 },
    distance_nm: 3120,
    primary_cargo: 'Coal',
    vessel_classes: ['Capesize', 'Panamax', 'Supramax'],
    avg_transit_days: 11,
    current_rate: 13.80,
    rate_change_pct: 6.2,
  },
  {
    id: 'route_007',
    origin_port: 'Richards Bay',
    origin_country: 'South Africa',
    origin_coords: { lat: -28.80, lng: 32.09 },
    destination_port: 'Chennai',
    destination_country: 'India',
    destination_coords: { lat: 13.08, lng: 80.29 },
    distance_nm: 6420,
    primary_cargo: 'Coal',
    vessel_classes: ['Capesize', 'Panamax'],
    avg_transit_days: 23,
    current_rate: 21.20,
    rate_change_pct: 1.8,
  },
  {
    id: 'route_008',
    origin_port: 'Hay Point',
    origin_country: 'Australia',
    origin_coords: { lat: -21.27, lng: 149.30 },
    destination_port: 'Paradip',
    destination_country: 'India',
    destination_coords: { lat: 20.26, lng: 86.70 },
    distance_nm: 5350,
    primary_cargo: 'Coal',
    vessel_classes: ['Capesize', 'Panamax'],
    avg_transit_days: 18,
    current_rate: 18.90,
    rate_change_pct: 3.7,
  },
];

// --- Vessel Classes ---
export const mockVesselClasses = [
  {
    id: 'vc_001',
    name: 'Capesize',
    dwt: 180000,
    loa_m: 295,
    beam_m: 45,
    draft_m: 18.0,
    typical_speed_knots: 14,
    daily_consumption_mt: 55,
    daily_hire_rate: 28000,
  },
  {
    id: 'vc_002',
    name: 'Panamax',
    dwt: 75000,
    loa_m: 225,
    beam_m: 32,
    draft_m: 13.5,
    typical_speed_knots: 14,
    daily_consumption_mt: 38,
    daily_hire_rate: 16500,
  },
  {
    id: 'vc_003',
    name: 'Supramax',
    dwt: 55000,
    loa_m: 200,
    beam_m: 28,
    draft_m: 11.5,
    typical_speed_knots: 13,
    daily_consumption_mt: 28,
    daily_hire_rate: 12000,
  },
];

// --- Generate historical weekly rate data (past 2 years) ---
// Deterministic per seed so each route keeps a stable, distinct shape
// across reloads instead of one reshuffled shared series.
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function generateHistoricalRates(baseRate, volatility = 0.08, seed = 1) {
  const data = [];
  const today = new Date();
  const weeks = 104; // 2 years
  const rand = seededRandom(seed);
  let rate = baseRate * 0.82;

  for (let i = weeks; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i * 7);

    // Seasonal component (higher during monsoon Jun-Sep and winter demand)
    const month = date.getMonth();
    const seasonalFactor = (month >= 5 && month <= 8) ? 1.12 : (month >= 9 && month <= 11) ? 1.06 : 0.96;

    // Random walk with mean reversion
    const noise = (rand() - 0.5) * 2 * volatility * baseRate;
    const meanReversion = (baseRate - rate) * 0.05;
    rate = rate + meanReversion + noise;
    rate = Math.max(rate, baseRate * 0.6);
    rate = rate * (0.98 + seasonalFactor * 0.04);

    data.push({
      date: date.toISOString().split('T')[0],
      rate: Math.round(rate * 100) / 100,
      base_freight: Math.round((rate * 0.72) * 100) / 100,
      baf: Math.round((rate * 0.28) * 100) / 100,
    });
  }
  return data;
}

// --- Generate 90-day Prophet-style forecast ---
function generateForecast(historicalData, baseRate, seed = 1) {
  const forecast = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  const lastRate = historicalData[historicalData.length - 1].rate;
  const rand = seededRandom(seed);

  // Trend projection with slight upward bias
  const trendSlope = 0.0015 * baseRate;

  for (let i = 1; i <= 13; i++) { // ~90 days, weekly
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i * 7);

    const projected = lastRate + trendSlope * i + (rand() - 0.45) * baseRate * 0.03;
    const uncertainty = baseRate * 0.04 * Math.sqrt(i); // widening cone

    const rounded = Math.round(projected * 100) / 100;
    forecast.push({
      date: date.toISOString().split('T')[0],
      forecast: rounded,
      // Mirror of `forecast` for components reading the live API shape
      // (live rows expose `predictedRate`; see freightService.getRates).
      predictedRate: rounded,
      upper_bound: Math.round((projected + uncertainty) * 100) / 100,
      lower_bound: Math.round((projected - uncertainty) * 100) / 100,
    });
  }
  return forecast;
}

// --- Build forecast data per route ---
export const mockForecast = {};
mockRoutes.forEach((route) => {
  const historical = generateHistoricalRates(route.current_rate, 0.08, hashString(route.id));
  const forecast = generateForecast(historical, route.current_rate, hashString(`${route.id}:forecast`));
  mockForecast[route.id] = {
    route_id: route.id,
    route_name: `${route.origin_port} → ${route.destination_port}`,
    historical: historical,
    forecast: forecast,
    combined: [
      ...historical.map((h) => ({ ...h, forecast: null, upper_bound: null, lower_bound: null })),
      ...forecast.map((f) => ({ ...f, rate: null, base_freight: null, baf: null })),
    ],
    trend_direction: route.rate_change_pct > 0 ? 'up' : 'down',
    projected_change_pct: route.rate_change_pct,
    confidence: 0.78 + Math.random() * 0.18,
  };
});

// Default fallback
mockForecast['default'] = mockForecast[mockRoutes[0].id];

// --- Market KPIs ---
// Defined after the BDI/VLSFO mocks (see below) so the Overview head values
// stay identical to the detail pages. (Declaration moved below mockVlsfo.)

// --- Market Ticker ---
export const mockMarketTicker = [
  { label: 'BDI', value: '1,842', change: '+2.6%', direction: 'up' },
  { label: 'BCI', value: '2,840', change: '+4.1%', direction: 'up' },
  { label: 'BPI', value: '1,620', change: '+1.2%', direction: 'up' },
  { label: 'BSI', value: '1,295', change: '-0.4%', direction: 'down' },
  { label: 'VLSFO SIN', value: '$612', change: '-1.3%', direction: 'down' },
  { label: 'VLSFO FUJ', value: '$598', change: '-0.8%', direction: 'down' },
  { label: 'Coal API2', value: '$118.50', change: '+0.9%', direction: 'up' },
  { label: 'Iron Ore 62%', value: '$132.40', change: '+1.8%', direction: 'up' },
];

// --- Active Inbound Voyages ---
export const mockVoyages = [
  {
    id: 'voy_001',
    vessel_name: 'MV Pacific Dawn',
    imo: '9456782',
    vessel_class: 'Capesize',
    dwt: 181200,
    route_id: 'route_001',
    route_name: 'Tanjung Bara → Paradip',
    cargo_type: 'Coal',
    cargo_volume_mt: 165000,
    departure_date: '2026-08-22',
    eta: '2026-09-03',
    progress_pct: 78,
    status: 'In Transit',
    speed_knots: 13.5,
    charterer: 'Tata Power Trading',
    charter_type: 'Voyage Charter',
    freight_rate: 14.20,
    total_freight_cost: 2343000,
  },
  {
    id: 'voy_002',
    vessel_name: 'MV Iron Trader',
    imo: '9321456',
    vessel_class: 'Capesize',
    dwt: 178500,
    route_id: 'route_004',
    route_name: 'Port Hedland → Haldia',
    cargo_type: 'Iron Ore',
    cargo_volume_mt: 170000,
    departure_date: '2026-08-18',
    eta: '2026-09-07',
    progress_pct: 62,
    status: 'In Transit',
    speed_knots: 14.0,
    charterer: 'JSW Steel',
    charter_type: 'Time Charter',
    freight_rate: 20.80,
    total_freight_cost: 3536000,
  },
  {
    id: 'voy_003',
    vessel_name: 'MV Bauxite Express',
    imo: '9567341',
    vessel_class: 'Panamax',
    dwt: 73800,
    route_id: 'route_005',
    route_name: 'Gove → Chennai',
    cargo_type: 'Bauxite',
    cargo_volume_mt: 68000,
    departure_date: '2026-08-25',
    eta: '2026-09-11',
    progress_pct: 35,
    status: 'In Transit',
    speed_knots: 13.8,
    charterer: 'Vedanta Aluminium',
    charter_type: 'Voyage Charter',
    freight_rate: 16.90,
    total_freight_cost: 1149200,
  },
  {
    id: 'voy_004',
    vessel_name: 'MV Cape Harmony',
    imo: '9412307',
    vessel_class: 'Capesize',
    dwt: 185000,
    route_id: 'route_003',
    route_name: 'Richards Bay → Visakhapatnam',
    cargo_type: 'Coal',
    cargo_volume_mt: 172000,
    departure_date: '2026-08-15',
    eta: '2026-09-08',
    progress_pct: 71,
    status: 'In Transit',
    speed_knots: 13.2,
    charterer: 'Adani Power',
    charter_type: 'COA',
    freight_rate: 22.10,
    total_freight_cost: 3801200,
  },
  {
    id: 'voy_005',
    vessel_name: 'MV Star Bulk',
    imo: '9387612',
    vessel_class: 'Supramax',
    dwt: 52100,
    route_id: 'route_006',
    route_name: 'Tanjung Bara → Dhamra',
    cargo_type: 'Coal',
    cargo_volume_mt: 48000,
    departure_date: '2026-08-28',
    eta: '2026-09-08',
    progress_pct: 18,
    status: 'Loading',
    speed_knots: 0,
    charterer: 'NTPC Limited',
    charter_type: 'Voyage Charter',
    freight_rate: 13.50,
    total_freight_cost: 648000,
  },
  {
    id: 'voy_006',
    vessel_name: 'MV Ocean Pioneer',
    imo: '9478231',
    vessel_class: 'Panamax',
    dwt: 76200,
    route_id: 'route_002',
    route_name: 'Hay Point → Visakhapatnam',
    cargo_type: 'Coal',
    cargo_volume_mt: 71000,
    departure_date: '2026-08-20',
    eta: '2026-09-08',
    progress_pct: 58,
    status: 'In Transit',
    speed_knots: 14.2,
    charterer: 'Tata Power Trading',
    charter_type: 'Time Charter',
    freight_rate: 19.40,
    total_freight_cost: 1377400,
  },
];

// --- Vessels ---
export const mockVessels = [
  {
    id: 'vessel_001',
    name: 'MV Pacific Dawn',
    imo: '9456782',
    vessel_class: 'Capesize',
    dwt: 181200,
    built_year: 2016,
    flag: 'Marshall Islands',
    owner: 'Pacific Bulk Shipping Ltd',
    status: 'In Transit',
    current_position: 'Bay of Bengal, approaching Paradip',
    next_available_date: '2026-09-20',
    daily_hire_rate: 27500,
  },
  {
    id: 'vessel_002',
    name: 'MV Iron Trader',
    imo: '9321456',
    vessel_class: 'Capesize',
    dwt: 178500,
    built_year: 2014,
    flag: 'Singapore',
    owner: 'Orient Bulk Carriers',
    status: 'In Transit',
    current_position: 'Indian Ocean, en route to Haldia',
    next_available_date: '2026-09-25',
    daily_hire_rate: 26000,
  },
  {
    id: 'vessel_003',
    name: 'MV Bauxite Express',
    imo: '9567341',
    vessel_class: 'Panamax',
    dwt: 73800,
    built_year: 2018,
    flag: 'Panama',
    owner: 'Express Maritime SA',
    status: 'In Transit',
    current_position: 'Bay of Bengal, approaching Chennai',
    next_available_date: '2026-09-22',
    daily_hire_rate: 15800,
  },
  {
    id: 'vessel_004',
    name: 'MV Cape Harmony',
    imo: '9412307',
    vessel_class: 'Capesize',
    dwt: 185000,
    built_year: 2015,
    flag: 'Liberia',
    owner: 'Harmony Shipping Pte Ltd',
    status: 'In Transit',
    current_position: 'Indian Ocean, en route to Visakhapatnam',
    next_available_date: '2026-09-28',
    daily_hire_rate: 28200,
  },
  {
    id: 'vessel_005',
    name: 'MV Star Bulk',
    imo: '9387612',
    vessel_class: 'Supramax',
    dwt: 52100,
    built_year: 2012,
    flag: 'Malta',
    owner: 'Star Bulk Carriers Corp',
    status: 'Loading',
    current_position: 'Tanjung Bara, Indonesia',
    next_available_date: '2026-09-18',
    daily_hire_rate: 11500,
  },
  {
    id: 'vessel_006',
    name: 'MV Ocean Pioneer',
    imo: '9478231',
    vessel_class: 'Panamax',
    dwt: 76200,
    built_year: 2017,
    flag: 'Hong Kong',
    owner: 'Pioneer Maritime Ltd',
    status: 'In Transit',
    current_position: 'Timor Sea, en route to Visakhapatnam',
    next_available_date: '2026-09-24',
    daily_hire_rate: 16200,
  },
  {
    id: 'vessel_007',
    name: 'MV Bulk Trader',
    imo: '9234517',
    vessel_class: 'Supramax',
    dwt: 56800,
    built_year: 2019,
    flag: 'Marshall Islands',
    owner: 'Bulk Trading SA',
    status: 'Available',
    current_position: 'Singapore anchorage',
    next_available_date: '2026-09-02',
    daily_hire_rate: 12800,
  },
  {
    id: 'vessel_008',
    name: 'MV Grand Pioneer',
    imo: '9167842',
    vessel_class: 'Capesize',
    dwt: 182000,
    built_year: 2013,
    flag: 'Panama',
    owner: 'Grand Shipping NV',
    status: 'Available',
    current_position: 'Fujairah anchorage, UAE',
    next_available_date: '2026-09-03',
    daily_hire_rate: 26800,
  },
];

// --- Charterers ---
export const mockCharterers = [
  {
    id: 'charterer_001',
    name: 'Tata Power Trading Company',
    country: 'India',
    type: 'Power Utility',
    contracts_active: 4,
    total_contracts: 28,
    trust_score: 92,
    trust_grade: 'A',
    on_time_delivery_rate: 94.3,
    demurrage_incidents: 2,
    total_demurrage_paid: 145000,
    dispute_count: 1,
    dispute_resolution_rate: 100,
    on_time_delivery_pct: 94.3,
    cargo_damage_incidents: 2,
    payment_reliability_pct: 96,
    years_in_operation: 22,
    total_voyages: 28,
    avg_payment_days: 21,
    credit_rating: 'AA',
    total_volume_mt: 4200000,
    default_risk: 'Low',
    notes: 'Consistent performer with strong payment record. Preferred charterer for long-term COAs.',
  },
  {
    id: 'charterer_002',
    name: 'JSW Steel Limited',
    country: 'India',
    type: 'Steel Manufacturer',
    contracts_active: 3,
    total_contracts: 19,
    trust_score: 88,
    trust_grade: 'A',
    on_time_delivery_rate: 89.1,
    demurrage_incidents: 4,
    total_demurrage_paid: 320000,
    dispute_count: 2,
    dispute_resolution_rate: 95,
    on_time_delivery_pct: 89.1,
    cargo_damage_incidents: 4,
    payment_reliability_pct: 90,
    years_in_operation: 18,
    total_voyages: 19,
    avg_payment_days: 28,
    credit_rating: 'A+',
    total_volume_mt: 3100000,
    default_risk: 'Low',
    notes: 'Large-volume iron ore importer. Occasional laycan adjustments but reliable payer.',
  },
  {
    id: 'charterer_003',
    name: 'Adani Power Limited',
    country: 'India',
    type: 'Power Utility',
    contracts_active: 5,
    total_contracts: 31,
    trust_score: 85,
    trust_grade: 'A',
    on_time_delivery_rate: 86.7,
    demurrage_incidents: 6,
    total_demurrage_paid: 510000,
    dispute_count: 3,
    dispute_resolution_rate: 88,
    on_time_delivery_pct: 86.7,
    cargo_damage_incidents: 6,
    payment_reliability_pct: 82,
    years_in_operation: 15,
    total_voyages: 31,
    avg_payment_days: 32,
    credit_rating: 'A',
    total_volume_mt: 5500000,
    default_risk: 'Low-Medium',
    notes: 'High-volume coal importer. Port congestion at Mundra occasionally causes delays.',
  },
  {
    id: 'charterer_004',
    name: 'Vedanta Aluminium Limited',
    country: 'India',
    type: 'Metals & Mining',
    contracts_active: 2,
    total_contracts: 12,
    trust_score: 81,
    trust_grade: 'B',
    on_time_delivery_rate: 83.5,
    demurrage_incidents: 3,
    total_demurrage_paid: 210000,
    dispute_count: 2,
    dispute_resolution_rate: 90,
    on_time_delivery_pct: 83.5,
    cargo_damage_incidents: 3,
    payment_reliability_pct: 85,
    years_in_operation: 12,
    total_voyages: 12,
    avg_payment_days: 30,
    credit_rating: 'A-',
    total_volume_mt: 1800000,
    default_risk: 'Low-Medium',
    notes: 'Bauxite importer. Growing volume trajectory. Payment cycle slightly longer than industry average.',
  },
  {
    id: 'charterer_005',
    name: 'NTPC Limited',
    country: 'India',
    type: 'Power Utility',
    contracts_active: 6,
    total_contracts: 42,
    trust_score: 90,
    trust_grade: 'A',
    on_time_delivery_rate: 91.2,
    demurrage_incidents: 5,
    total_demurrage_paid: 380000,
    dispute_count: 1,
    dispute_resolution_rate: 100,
    on_time_delivery_pct: 91.2,
    cargo_damage_incidents: 5,
    payment_reliability_pct: 92,
    years_in_operation: 25,
    total_voyages: 42,
    avg_payment_days: 25,
    credit_rating: 'AA-',
    total_volume_mt: 6800000,
    default_risk: 'Low',
    notes: 'Largest coal importer by volume. Government-owned with excellent payment discipline.',
  },
  {
    id: 'charterer_006',
    name: 'Jindal Steel & Power',
    country: 'India',
    type: 'Steel Manufacturer',
    contracts_active: 2,
    total_contracts: 15,
    trust_score: 76,
    trust_grade: 'B',
    on_time_delivery_rate: 78.4,
    demurrage_incidents: 7,
    total_demurrage_paid: 620000,
    dispute_count: 4,
    dispute_resolution_rate: 75,
    on_time_delivery_pct: 78.4,
    cargo_damage_incidents: 7,
    payment_reliability_pct: 70,
    years_in_operation: 14,
    total_voyages: 15,
    avg_payment_days: 38,
    credit_rating: 'BBB+',
    total_volume_mt: 2400000,
    default_risk: 'Medium',
    notes: 'Frequent laycan disputes. Recommend stricter laycan terms and demurrage caps.',
  },
  {
    id: 'charterer_007',
    name: 'Coastal Energen Private Limited',
    country: 'India',
    type: 'Power Utility',
    contracts_active: 1,
    total_contracts: 8,
    trust_score: 64,
    trust_grade: 'C',
    on_time_delivery_rate: 71.2,
    demurrage_incidents: 5,
    total_demurrage_paid: 440000,
    dispute_count: 3,
    dispute_resolution_rate: 60,
    on_time_delivery_pct: 71.2,
    cargo_damage_incidents: 5,
    payment_reliability_pct: 62,
    years_in_operation: 9,
    total_voyages: 8,
    avg_payment_days: 45,
    credit_rating: 'BB+',
    total_volume_mt: 950000,
    default_risk: 'Medium-High',
    notes: 'Payment delays exceeding 40 days. Demurrage incidents above industry average. Exercise caution.',
  },
  {
    id: 'charterer_008',
    name: 'KSK Energy Ventures',
    country: 'India',
    type: 'Power Utility',
    contracts_active: 1,
    total_contracts: 5,
    trust_score: 48,
    trust_grade: 'D',
    on_time_delivery_rate: 62.8,
    demurrage_incidents: 4,
    total_demurrage_paid: 380000,
    dispute_count: 3,
    dispute_resolution_rate: 50,
    on_time_delivery_pct: 62.8,
    cargo_damage_incidents: 4,
    payment_reliability_pct: 55,
    years_in_operation: 7,
    total_voyages: 5,
    avg_payment_days: 52,
    credit_rating: 'BB',
    total_volume_mt: 620000,
    default_risk: 'High',
    notes: 'Multiple unresolved disputes. Payment delays >50 days. Recommend advance payment or LC terms only.',
  },
];

// --- Recommendations ---
export const mockRecommendations = [
  {
    id: 'rec_001',
    route_id: 'route_001',
    route_name: 'Tanjung Bara → Paradip',
    cargo_type: 'Coal',
    action: 'CHARTER NOW',
    action_type: 'urgent',
    confidence_score: 87,
    rationale: 'Expected 12% rate surge over next 3 weeks due to monsoonal port congestion at Paradip and tightening Capesize availability. Current rates near 6-month low.',
    projected_rate_change: '+12.4%',
    projected_savings_per_mt: 1.80,
    projected_savings_total: 297000,
    time_horizon: '3 weeks',
    recommended_vessel_class: 'Capesize',
    recommended_charter_type: 'Voyage Charter',
    recommended_volume_mt: 165000,
    current_rate: 14.50,
    projected_rate_30d: 16.30,
    cost_benefit: {
      charter_now_cost: 2392500,
      wait_30d_cost: 2689500,
      savings: 297000,
      savings_pct: 11.0,
    },
    fuel_impact: {
      current_bunker_cost: 612,
      projected_bunker_cost_30d: 625,
      bunker_impact_pct: 2.1,
    },
    risk_factors: [
      'Monsoon congestion at Paradip (Sep-Oct)',
      'Tightening Capesize tonnage list',
      'Indonesian coal export quota uncertainty',
    ],
  },
  {
    id: 'rec_002',
    route_id: 'route_004',
    route_name: 'Port Hedland → Haldia',
    cargo_type: 'Iron Ore',
    action: 'WAIT / SPOT MARKET',
    action_type: 'hold',
    confidence_score: 72,
    rationale: 'Iron ore rates softening due to reduced Chinese demand. Spot market rates expected to dip 3-5% over next 4 weeks. Monitor for optimal entry point.',
    projected_rate_change: '-4.2%',
    projected_savings_per_mt: 0.88,
    projected_savings_total: 149600,
    time_horizon: '4 weeks',
    recommended_vessel_class: 'Capesize',
    recommended_charter_type: 'Spot Market',
    recommended_volume_mt: 170000,
    current_rate: 21.00,
    projected_rate_30d: 20.12,
    cost_benefit: {
      charter_now_cost: 3570000,
      wait_30d_cost: 3420400,
      savings: 149600,
      savings_pct: 4.2,
    },
    fuel_impact: {
      current_bunker_cost: 612,
      projected_bunker_cost_30d: 605,
      bunker_impact_pct: -1.1,
    },
    risk_factors: [
      'Chinese steel production cuts may further depress rates',
      'Australian cyclone season begins Nov (potential disruption)',
      'Haldia draft restrictions for Capesize vessels',
    ],
  },
  {
    id: 'rec_003',
    route_id: 'route_006',
    route_name: 'Tanjung Bara → Dhamra',
    cargo_type: 'Coal',
    action: 'SPLIT SHIPMENT',
    action_type: 'balanced',
    confidence_score: 79,
    rationale: 'Rate volatility expected due to seasonal demand spike. Split shipment hedges against timing risk — 60% now at current rates, 40% in 2 weeks to capture potential dip.',
    projected_rate_change: '+6.2%',
    projected_savings_per_mt: 0.52,
    projected_savings_total: 49920,
    time_horizon: '2 weeks',
    recommended_vessel_class: 'Supramax',
    recommended_charter_type: 'Voyage Charter (Split)',
    recommended_volume_mt: 96000,
    current_rate: 13.80,
    projected_rate_30d: 14.66,
    cost_benefit: {
      charter_now_cost: 1324800,
      split_strategy_cost: 1274880,
      savings: 49920,
      savings_pct: 3.8,
    },
    fuel_impact: {
      current_bunker_cost: 612,
      projected_bunker_cost_30d: 618,
      bunker_impact_pct: 1.0,
    },
    risk_factors: [
      'Dhamra port capacity constraints during peak season',
      'Indonesian rainfall affecting loading rates',
      'Supramax tonnage availability tightening',
    ],
  },
  {
    id: 'rec_004',
    route_id: 'route_003',
    route_name: 'Richards Bay → Visakhapatnam',
    cargo_type: 'Coal',
    action: 'CHARTER NOW',
    action_type: 'urgent',
    confidence_score: 83,
    rationale: 'South African coal exports tightening due to rail infrastructure constraints. Rates projected to rise 8% over next 2 weeks. Secure tonnage before further escalation.',
    projected_rate_change: '+8.1%',
    projected_savings_per_mt: 1.82,
    projected_savings_total: 312040,
    time_horizon: '2 weeks',
    recommended_vessel_class: 'Capesize',
    recommended_charter_type: 'Time Charter (6 months)',
    recommended_volume_mt: 172000,
    current_rate: 22.50,
    projected_rate_30d: 24.32,
    cost_benefit: {
      charter_now_cost: 3870000,
      wait_30d_cost: 4183040,
      savings: 313040,
      savings_pct: 8.1,
    },
    fuel_impact: {
      current_bunker_cost: 612,
      projected_bunker_cost_30d: 620,
      bunker_impact_pct: 1.3,
    },
    risk_factors: [
      'Transnet rail network disruptions at Richards Bay',
      'Growing Indian coal demand ahead of winter',
      'Capesize rates climbing on Brazil-China iron ore trade',
    ],
  },
  {
    id: 'rec_005',
    route_id: 'route_005',
    route_name: 'Gove → Chennai',
    cargo_type: 'Bauxite',
    action: 'WAIT / SPOT MARKET',
    action_type: 'hold',
    confidence_score: 68,
    rationale: 'Bauxite rates stable but Panamax availability improving as Australian grain season winds down. Spot rates may ease 2-3% by late September.',
    projected_rate_change: '-2.8%',
    projected_savings_per_mt: 0.48,
    projected_savings_total: 32640,
    time_horizon: '3 weeks',
    recommended_vessel_class: 'Panamax',
    recommended_charter_type: 'Spot Market',
    recommended_volume_mt: 68000,
    current_rate: 17.20,
    projected_rate_30d: 16.72,
    cost_benefit: {
      charter_now_cost: 1169600,
      wait_30d_cost: 1136960,
      savings: 32640,
      savings_pct: 2.8,
    },
    fuel_impact: {
      current_bunker_cost: 612,
      projected_bunker_cost_30d: 608,
      bunker_impact_pct: -0.7,
    },
    risk_factors: [
      'Australian bauxite production schedule shifts',
      'Chennai port congestion during monsoon tail',
      'Panamax tonnage repositioning from Atlantic',
    ],
  },
];

// --- Port Status ---
export const mockPortStatus = [
  { id: 'paradip', port: 'Paradip', country: 'India', status: 'Congested', ships_in_port: 9, vessels_waiting: 14, avg_wait_days: 3.5, berth_utilization: 92, expected_incoming: 6 },
  { id: 'visakhapatnam', port: 'Visakhapatnam', country: 'India', status: 'Moderate', ships_in_port: 5, vessels_waiting: 6, avg_wait_days: 1.8, berth_utilization: 74, expected_incoming: 4 },
  { id: 'haldia', port: 'Haldia', country: 'India', status: 'Congested', ships_in_port: 7, vessels_waiting: 11, avg_wait_days: 4.2, berth_utilization: 88, expected_incoming: 5 },
  { id: 'chennai', port: 'Chennai', country: 'India', status: 'Clear', ships_in_port: 4, vessels_waiting: 3, avg_wait_days: 0.8, berth_utilization: 56, expected_incoming: 3 },
  { id: 'dhamra', port: 'Dhamra', country: 'India', status: 'Moderate', ships_in_port: 4, vessels_waiting: 5, avg_wait_days: 1.5, berth_utilization: 68, expected_incoming: 3 },
];

// Mock port registry with physical limits (mirrors GET /ports/ shape for
// the detail view; live data comes from the backend Port records).
export const mockPorts = [
  { id: 'visakhapatnam', name: 'Visakhapatnam', country: 'India', port_type: 'destination', max_draft: 16.5, max_beam: 45.0, max_loa: 300.0, ships_currently_at_port: 5, expected_incoming_shipments: 4 },
  { id: 'paradip', name: 'Paradip', country: 'India', port_type: 'destination', max_draft: 14.5, max_beam: 40.0, max_loa: 260.0, ships_currently_at_port: 9, expected_incoming_shipments: 6 },
  { id: 'chennai', name: 'Chennai', country: 'India', port_type: 'destination', max_draft: 12.0, max_beam: 35.0, max_loa: 250.0, ships_currently_at_port: 4, expected_incoming_shipments: 3 },
  { id: 'haldia', name: 'Haldia', country: 'India', port_type: 'destination', max_draft: 7.5, max_beam: 30.0, max_loa: 200.0, ships_currently_at_port: 7, expected_incoming_shipments: 5 },
  { id: 'dhamra', name: 'Dhamra', country: 'India', port_type: 'destination', max_draft: 14.0, max_beam: 38.0, max_loa: 250.0, ships_currently_at_port: 4, expected_incoming_shipments: 3 },
];

// --- Simulated vessel schedules (per-port ship activity) ---
// Explicitly SIMULATED planning data: there is no live AIS feed on the
// backend, so getVesselSchedule() serves this in every mode and the UI must
// badge it as simulated. Statuses: arriving | in_port | waiting | departing.
export const MOCK_SCHEDULE_UPDATED = 'Simulated snapshot — illustrative planning data';

export const MOCK_VESSEL_SCHEDULE = {
  Paradip: [
    { id: 'v-pd-01', name: 'Pacific Pioneer', imo: 'IMO 9732014', vesselClass: 'Capesize', vesselType: 'Bulk carrier', cargo: 'Iron ore', volumeMt: 165000, arrival: '2026-09-06 06:30', departure: '2026-09-09 18:00', status: 'in_port', berth: 'Berth CB-2 (loading)', draft: 17.8, loa: 292, beam: 45, charterer: 'OceanBulk Carriers', delayHrs: 0 },
    { id: 'v-pd-02', name: 'Meridian Star', imo: 'IMO 9688117', vesselClass: 'Panamax', vesselType: 'Bulk carrier', cargo: 'Coking coal', volumeMt: 74000, arrival: '2026-09-07 11:00', departure: '2026-09-10 09:00', status: 'in_port', berth: 'Berth EQ-1 (discharging)', draft: 13.6, loa: 225, beam: 32.2, charterer: 'Eastern Charter Co.', delayHrs: 6 },
    { id: 'v-pd-03', name: 'Coral Endeavour', imo: 'IMO 9814452', vesselClass: 'Supramax', vesselType: 'Bulk carrier', cargo: 'Limestone', volumeMt: 52000, arrival: '2026-09-05 22:15', departure: 'TBC — awaiting berth', status: 'waiting', berth: 'Anchorage P-3', draft: 12.1, loa: 190, beam: 32.3, charterer: 'Harbourline Logistics', delayHrs: 58 },
    { id: 'v-pd-04', name: 'Atlantic Resolve', imo: 'IMO 9745090', vesselClass: 'Capesize', vesselType: 'Bulk carrier', cargo: 'Iron ore', volumeMt: 172000, arrival: 'ETA 2026-09-10 04:00', departure: 'TBC', status: 'arriving', berth: 'Berth TBD', draft: 18.1, loa: 295, beam: 45, charterer: 'OceanBulk Carriers', delayHrs: 0 },
    { id: 'v-pd-05', name: 'Sea Virtue', imo: 'IMO 9623371', vesselClass: 'Panamax', vesselType: 'Bulk carrier', cargo: 'Non-coking coal', volumeMt: 68000, arrival: '2026-09-03 14:45', departure: '2026-09-08 02:30', status: 'departing', berth: 'Sailed from EQ-3', draft: 12.9, loa: 222, beam: 32.2, charterer: 'Coastal Freight Ltd.', delayHrs: 11 },
  ],
  Visakhapatnam: [
    { id: 'v-vz-01', name: 'Vizag Venture', imo: 'IMO 9790126', vesselClass: 'Capesize', vesselType: 'Bulk carrier', cargo: 'Coking coal', volumeMt: 158000, arrival: '2026-09-06 19:20', departure: '2026-09-09 12:00', status: 'in_port', berth: 'Berth VQ-4 (discharging)', draft: 17.2, loa: 289, beam: 45, charterer: 'Deccan Steel Procurement', delayHrs: 0 },
    { id: 'v-vz-02', name: 'Northern Laurel', imo: 'IMO 9718843', vesselClass: 'Panamax', vesselType: 'Bulk carrier', cargo: 'Bauxite', volumeMt: 71000, arrival: 'ETA 2026-09-09 08:00', departure: 'TBC', status: 'arriving', berth: 'Berth TBD', draft: 13.2, loa: 224, beam: 32.2, charterer: 'Alumina Traders', delayHrs: 0 },
    { id: 'v-vz-03', name: 'Bay Crest', imo: 'IMO 9833118', vesselClass: 'Supramax', vesselType: 'Bulk carrier', cargo: 'Fertiliser', volumeMt: 48000, arrival: '2026-09-04 09:10', departure: 'TBC — awaiting berth', status: 'waiting', berth: 'Anchorage V-1', draft: 11.4, loa: 186, beam: 32.3, charterer: 'AgriBulk India', delayHrs: 31 },
    { id: 'v-vz-04', name: 'Golden Wake', imo: 'IMO 9655102', vesselClass: 'Panamax', vesselType: 'Bulk carrier', cargo: 'Iron ore', volumeMt: 73000, arrival: '2026-09-02 21:00', departure: '2026-09-07 23:40', status: 'departing', berth: 'Sailed from VQ-2', draft: 13.8, loa: 228, beam: 32.2, charterer: 'Eastern Charter Co.', delayHrs: 4 },
  ],
  Haldia: [
    { id: 'v-ha-01', name: 'Hooghly Trader', imo: 'IMO 9776455', vesselClass: 'Supramax', vesselType: 'Bulk carrier', cargo: 'Non-coking coal', volumeMt: 54000, arrival: '2026-09-06 03:50', departure: '2026-09-09 20:00', status: 'in_port', berth: 'Berth HDC-3 (discharging)', draft: 11.8, loa: 189, beam: 32.3, charterer: 'Bengal Power Fuels', delayHrs: 9 },
    { id: 'v-ha-02', name: 'River Pearl', imo: 'IMO 9699024', vesselClass: 'Supramax', vesselType: 'Bulk carrier', cargo: 'Limestone', volumeMt: 50000, arrival: '2026-09-05 16:30', departure: 'TBC — draft restriction', status: 'waiting', berth: 'Anchorage Sagar Roads', draft: 12.4, loa: 190, beam: 32.3, charterer: 'Harbourline Logistics', delayHrs: 74 },
    { id: 'v-ha-03', name: 'Delta Mariner', imo: 'IMO 9820771', vesselClass: 'Panamax', vesselType: 'Bulk carrier', cargo: 'Coking coal', volumeMt: 69000, arrival: 'ETA 2026-09-11 10:00', departure: 'TBC', status: 'arriving', berth: 'Berth TBD', draft: 12.6, loa: 220, beam: 32.2, charterer: 'Deccan Steel Procurement', delayHrs: 0 },
    { id: 'v-ha-04', name: 'Calm Horizon', imo: 'IMO 9611408', vesselClass: 'Supramax', vesselType: 'Bulk carrier', cargo: 'Fertiliser', volumeMt: 46000, arrival: '2026-09-01 07:25', departure: '2026-09-07 15:10', status: 'departing', berth: 'Sailed from HDC-1', draft: 10.9, loa: 183, beam: 32.3, charterer: 'AgriBulk India', delayHrs: 18 },
  ],
  Chennai: [
    { id: 'v-ch-01', name: 'Coromandel Light', imo: 'IMO 9802339', vesselClass: 'Panamax', vesselType: 'Bulk carrier', cargo: 'Coking coal', volumeMt: 72000, arrival: '2026-09-07 05:40', departure: '2026-09-09 14:00', status: 'in_port', berth: 'Berth CQ-2 (discharging)', draft: 13.4, loa: 226, beam: 32.2, charterer: 'Deccan Steel Procurement', delayHrs: 0 },
    { id: 'v-ch-02', name: 'Marina Breeze', imo: 'IMO 9756884', vesselClass: 'Supramax', vesselType: 'Bulk carrier', cargo: 'Gypsum', volumeMt: 47000, arrival: 'ETA 2026-09-09 21:00', departure: 'TBC', status: 'arriving', berth: 'Berth TBD', draft: 11.2, loa: 188, beam: 32.3, charterer: 'Coastal Freight Ltd.', delayHrs: 0 },
    { id: 'v-ch-03', name: 'Eastwind Glory', imo: 'IMO 9667120', vesselClass: 'Panamax', vesselType: 'Bulk carrier', cargo: 'Iron ore', volumeMt: 70000, arrival: '2026-09-03 12:05', departure: '2026-09-08 06:50', status: 'departing', berth: 'Sailed from CQ-1', draft: 13.1, loa: 223, beam: 32.2, charterer: 'OceanBulk Carriers', delayHrs: 2 },
  ],
  Dhamra: [
    { id: 'v-dh-01', name: 'Dhamra Spirit', imo: 'IMO 9785123', vesselClass: 'Capesize', vesselType: 'Bulk carrier', cargo: 'Iron ore', volumeMt: 160000, arrival: '2026-09-06 13:15', departure: '2026-09-09 22:00', status: 'in_port', berth: 'Berth D-1 (loading)', draft: 17.5, loa: 290, beam: 45, charterer: 'OceanBulk Carriers', delayHrs: 0 },
    { id: 'v-dh-02', name: 'Sandpiper Ace', imo: 'IMO 9724516', vesselClass: 'Supramax', vesselType: 'Bulk carrier', cargo: 'Non-coking coal', volumeMt: 51000, arrival: '2026-09-05 08:00', departure: 'TBC — awaiting berth', status: 'waiting', berth: 'Anchorage D-2', draft: 11.9, loa: 187, beam: 32.3, charterer: 'Bengal Power Fuels', delayHrs: 26 },
    { id: 'v-dh-03', name: 'Kalinga Dawn', imo: 'IMO 9840190', vesselClass: 'Panamax', vesselType: 'Bulk carrier', cargo: 'Limestone', volumeMt: 66000, arrival: 'ETA 2026-09-10 16:30', departure: 'TBC', status: 'arriving', berth: 'Berth TBD', draft: 12.8, loa: 221, beam: 32.2, charterer: 'Harbourline Logistics', delayHrs: 0 },
  ],
};

// --- Operational alerts per port (simulated, shown beside the schedule) ---
export const MOCK_PORT_ALERTS = {
  Paradip: [
    { severity: 'high', text: 'Anchorage backlog: 3 vessels waiting over 48h — consider diverting Supramax parcels to Dhamra.' },
    { severity: 'medium', text: 'Berth CB-2 crane maintenance window 10 Sep 02:00–06:00; loading rates may dip.' },
  ],
  Visakhapatnam: [
    { severity: 'medium', text: 'VQ-4 discharge running 6h behind schedule after swell delays on 06 Sep.' },
  ],
  Haldia: [
    { severity: 'high', text: 'Hooghly draft restriction 8.2m until spring tide 12 Sep — Panamax arrivals must short-load.' },
    { severity: 'medium', text: 'Sagar Roads anchorage congestion: pilot boarding delays averaging 18h.' },
  ],
  Chennai: [
    { severity: 'low', text: 'No active disruptions. Next planned maintenance: CQ-1 fenders, 15 Sep.' },
  ],
  Dhamra: [
    { severity: 'medium', text: 'Single Capesize berth occupied until 09 Sep — incoming Capesize parcels will queue at anchorage.' },
  ],
};

// --- Cargo Types ---
export const mockCargoTypes = [
  { id: 'cargo_001', name: 'Coking Coal', unit: 'MT', avg_density: 0.85, stowage_factor: 1.18 },
  { id: 'cargo_002', name: 'Non-Coking Coal', unit: 'MT', avg_density: 0.85, stowage_factor: 1.18 },
  { id: 'cargo_003', name: 'Iron Ore', unit: 'MT', avg_density: 2.10, stowage_factor: 0.48 },
  { id: 'cargo_004', name: 'Limestone', unit: 'MT', avg_density: 1.55, stowage_factor: 0.65 },
];

// --- BDI (Baltic Dry Index) ---
const mockBdiHistory = (() => {
  const points = [];
  let value = 1690;
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    value += Math.round((Math.random() - 0.45) * 60);
    points.push({
      date: d.toISOString().split('T')[0],
      value,
      source: 'synthetic',
    });
  }
  return points;
})();

export const mockBdi = {
  latest: {
    value: mockBdiHistory[mockBdiHistory.length - 1].value,
    change_pct: 2.6,
    date: mockBdiHistory[mockBdiHistory.length - 1].date,
    source: 'synthetic',
  },
  history: mockBdiHistory,
};

// --- VLSFO (VLSFO bunker fuel, USD/MT) ---
const mockVlsfoHistory = (() => {
  const points = [];
  let value = 640;
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    value += Math.round((Math.random() - 0.55) * 14);
    points.push({
      date: d.toISOString().split('T')[0],
      value,
      source: 'synthetic',
    });
  }
  return points;
})();

export const mockVlsfo = {
  latest: {
    value: mockVlsfoHistory[mockVlsfoHistory.length - 1].value,
    unit: '$/MT',
    currency: 'USD',
    change_pct: -1.3,
    date: mockVlsfoHistory[mockVlsfoHistory.length - 1].date,
    source: 'synthetic',
  },
  history: mockVlsfoHistory,
};

// --- Market KPIs ---
// Head values mirror mockBdi/mockVlsfo exactly so Pipeline Overview matches
// the BDI and VLSFO detail pages in mock mode (same sources, same periods).
export const mockMarketKPIs = {
  baltic_dry_index: {
    value: mockBdi.latest.value,
    unit: 'points',
    change_pct: mockBdi.latest.change_pct,
    trend: mockBdi.latest.change_pct >= 0 ? 'up' : 'down',
    date: mockBdi.latest.date,
    historical: mockBdi.history,
    components: {
      capesize: 2840,
      panamax: 1620,
      supramax: 1295,
    },
  },
  bunker_fuel: {
    vlsfo_singapore: {
      value: mockVlsfo.latest.value,
      unit: '$/MT',
      change_pct: mockVlsfo.latest.change_pct,
      date: mockVlsfo.latest.date,
      historical: mockVlsfo.history,
    },
    vlsfo_fujairah: {
      value: 598,
      unit: '$/MT',
      change: -5,
      change_pct: -0.8,
    },
    ifo380_singapore: {
      value: 545,
      unit: '$/MT',
      change: -12,
      change_pct: -2.2,
    },
  },
  active_shipments: 14,
  fleet_readiness: {
    available_vessels: 23,
    total_fleet: 31,
    readiness_pct: 74.2,
  },
  rate_projection_90d: {
    direction: 'up',
    magnitude_pct: 4.8,
  },
};

// --- Scenario Simulation ---
export function simulateScenario(volumeMt, laycanWeeks, routeId, charterType) {
  const route = mockRoutes.find((r) => r.id === routeId) || mockRoutes[0];
  const rec = mockRecommendations.find((r) => r.route_id === routeId);
  const baseRate = route.current_rate;
  const projectedRate = rec ? rec.projected_rate_30d : baseRate * 1.05;

  // Spot cost = current rate with volatility premium
  const spotRate = baseRate * 1.03;
  const spotCost = volumeMt * spotRate;

  // Pick vessel class based on volume (mirrors backend _recommend_vessel_for_volume)
  let vesselClass;
  if (volumeMt <= 65000) {
    vesselClass = mockVesselClasses.find((vc) => vc.name === 'Supramax');
  } else if (volumeMt <= 85000) {
    vesselClass = mockVesselClasses.find((vc) => vc.name === 'Panamax');
  } else {
    vesselClass = mockVesselClasses.find((vc) => vc.name === 'Capesize');
  }
  if (!vesselClass) vesselClass = mockVesselClasses[0];

  // Time charter cost = (hire + bunker + port) × number of voyages needed
  const transitDays = route.avg_transit_days + laycanWeeks * 7;
  const voyages = Math.max(1, Math.ceil(volumeMt / vesselClass.dwt));
  const hireCostPerVoyage = vesselClass.daily_hire_rate * transitDays;
  const bunkerCostPerVoyage = vesselClass.daily_consumption_mt * 612 * transitDays;
  const portChargesPerVoyage = 45000 * 2; // load + discharge
  const tcCost = (hireCostPerVoyage + bunkerCostPerVoyage + portChargesPerVoyage) * voyages;

  const savings = charterType === 'spot' ? spotCost - tcCost : tcCost - spotCost;
  const savingsPct = charterType === 'spot'
    ? ((spotCost - tcCost) / spotCost) * 100
    : ((tcCost - spotCost) / tcCost) * 100;

  return {
    spot: {
      rate: spotRate,
      total_cost: Math.round(spotCost),
      cost_per_mt: Math.round((spotCost / volumeMt) * 100) / 100,
    },
    time_charter: {
      hire_rate: vesselClass.daily_hire_rate,
      duration_days: transitDays,
      voyages,
      hire_cost: Math.round(hireCostPerVoyage * voyages),
      bunker_cost: Math.round(bunkerCostPerVoyage * voyages),
      port_charges: portChargesPerVoyage * voyages,
      total_cost: Math.round(tcCost),
      cost_per_mt: Math.round((tcCost / volumeMt) * 100) / 100,
    },
    savings: Math.round(Math.abs(savings)),
    savings_pct: Math.round(Math.abs(savingsPct) * 10) / 10,
    recommended: savings > 0 ? 'time_charter' : 'spot',
    projected_rate_30d: projectedRate,
  };
}
