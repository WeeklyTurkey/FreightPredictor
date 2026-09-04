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
function generateHistoricalRates(baseRate, volatility = 0.08) {
  const data = [];
  const today = new Date();
  const weeks = 104; // 2 years
  let rate = baseRate * 0.82;

  for (let i = weeks; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i * 7);

    // Seasonal component (higher during monsoon Jun-Sep and winter demand)
    const month = date.getMonth();
    const seasonalFactor = (month >= 5 && month <= 8) ? 1.12 : (month >= 9 && month <= 11) ? 1.06 : 0.96;

    // Random walk with mean reversion
    const noise = (Math.random() - 0.5) * 2 * volatility * baseRate;
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
function generateForecast(historicalData, baseRate) {
  const forecast = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  const lastRate = historicalData[historicalData.length - 1].rate;

  // Trend projection with slight upward bias
  const trendSlope = 0.0015 * baseRate;

  for (let i = 1; i <= 13; i++) { // ~90 days, weekly
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i * 7);

    const projected = lastRate + trendSlope * i + (Math.random() - 0.45) * baseRate * 0.03;
    const uncertainty = baseRate * 0.04 * Math.sqrt(i); // widening cone

    forecast.push({
      date: date.toISOString().split('T')[0],
      forecast: Math.round(projected * 100) / 100,
      upper_bound: Math.round((projected + uncertainty) * 100) / 100,
      lower_bound: Math.round((projected - uncertainty) * 100) / 100,
    });
  }
  return forecast;
}

// --- Build forecast data per route ---
export const mockForecast = {};
mockRoutes.forEach((route) => {
  const historical = generateHistoricalRates(route.current_rate);
  const forecast = generateForecast(historical, route.current_rate);
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
export const mockMarketKPIs = {
  baltic_dry_index: {
    value: 1842,
    unit: '$/day',
    change: 47,
    change_pct: 2.6,
    trend: 'up',
    components: {
      capesize: 2840,
      panamax: 1620,
      supramax: 1295,
    },
  },
  bunker_fuel: {
    vlsfo_singapore: {
      value: 612,
      unit: '$/MT',
      change: -8,
      change_pct: -1.3,
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
  rate_projection_30d: {
    direction: 'up',
    magnitude_pct: 4.8,
  },
};

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
    on_time_delivery_rate: 94.3,
    demurrage_incidents: 2,
    total_demurrage_paid: 145000,
    dispute_count: 1,
    dispute_resolution_rate: 100,
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
    on_time_delivery_rate: 89.1,
    demurrage_incidents: 4,
    total_demurrage_paid: 320000,
    dispute_count: 2,
    dispute_resolution_rate: 95,
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
    on_time_delivery_rate: 86.7,
    demurrage_incidents: 6,
    total_demurrage_paid: 510000,
    dispute_count: 3,
    dispute_resolution_rate: 88,
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
    on_time_delivery_rate: 83.5,
    demurrage_incidents: 3,
    total_demurrage_paid: 210000,
    dispute_count: 2,
    dispute_resolution_rate: 90,
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
    on_time_delivery_rate: 91.2,
    demurrage_incidents: 5,
    total_demurrage_paid: 380000,
    dispute_count: 1,
    dispute_resolution_rate: 100,
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
    on_time_delivery_rate: 78.4,
    demurrage_incidents: 7,
    total_demurrage_paid: 620000,
    dispute_count: 4,
    dispute_resolution_rate: 75,
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
    on_time_delivery_rate: 71.2,
    demurrage_incidents: 5,
    total_demurrage_paid: 440000,
    dispute_count: 3,
    dispute_resolution_rate: 60,
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
    on_time_delivery_rate: 62.8,
    demurrage_incidents: 4,
    total_demurrage_paid: 380000,
    dispute_count: 3,
    dispute_resolution_rate: 50,
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
  { port: 'Paradip', status: 'Congested', vessels_waiting: 14, avg_wait_days: 3.5, berth_utilization: 92 },
  { port: 'Visakhapatnam', status: 'Moderate', vessels_waiting: 6, avg_wait_days: 1.8, berth_utilization: 74 },
  { port: 'Haldia', status: 'Congested', vessels_waiting: 11, avg_wait_days: 4.2, berth_utilization: 88 },
  { port: 'Chennai', status: 'Clear', vessels_waiting: 3, avg_wait_days: 0.8, berth_utilization: 56 },
  { port: 'Dhamra', status: 'Moderate', vessels_waiting: 5, avg_wait_days: 1.5, berth_utilization: 68 },
];

// --- Cargo Types ---
export const mockCargoTypes = [
  { id: 'cargo_001', name: 'Coking Coal', unit: 'MT', avg_density: 0.85, stowage_factor: 1.18 },
  { id: 'cargo_002', name: 'Non-Coking Coal', unit: 'MT', avg_density: 0.85, stowage_factor: 1.18 },
  { id: 'cargo_003', name: 'Iron Ore', unit: 'MT', avg_density: 2.10, stowage_factor: 0.48 },
  { id: 'cargo_004', name: 'Limestone', unit: 'MT', avg_density: 1.55, stowage_factor: 0.65 },
];

// --- Scenario Simulation ---
export function simulateScenario(volumeMt, laycanWeeks, routeId, charterType) {
  const route = mockRoutes.find((r) => r.id === routeId) || mockRoutes[0];
  const rec = mockRecommendations.find((r) => r.route_id === routeId);
  const baseRate = route.current_rate;
  const projectedRate = rec ? rec.projected_rate_30d : baseRate * 1.05;

  // Spot cost = current rate with volatility premium
  const spotRate = baseRate * 1.03;
  const spotCost = volumeMt * spotRate;

  // Time charter cost = hire rate * duration + bunker + port charges
  const vesselClass = mockVesselClasses.find((vc) => vc.name === 'Capesize');
  const transitDays = route.avg_transit_days + laycanWeeks * 7;
  const hireCost = vesselClass.daily_hire_rate * transitDays;
  const bunkerCost = vesselClass.daily_consumption_mt * 612 * transitDays;
  const portCharges = 45000 * 2; // load + discharge
  const tcCost = hireCost + bunkerCost + portCharges;

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
      hire_cost: Math.round(hireCost),
      bunker_cost: Math.round(bunkerCost),
      port_charges: portCharges,
      total_cost: Math.round(tcCost),
      cost_per_mt: Math.round((tcCost / volumeMt) * 100) / 100,
    },
    savings: Math.round(Math.abs(savings)),
    savings_pct: Math.round(Math.abs(savingsPct) * 10) / 10,
    recommended: savings > 0 ? 'time_charter' : 'spot',
    projected_rate_30d: projectedRate,
  };
}
