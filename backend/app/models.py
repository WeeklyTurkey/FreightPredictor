"""
SIH26006 Freight Forecasting Platform — All Models

Contains every model for the platform in a single file:
- Port (Indian destination ports with physical constraints)
- Vessel (ship classes: Capesize, Panamax, Supramax)
- Route (origin → destination port routes)
- FreightRateHistory (historical daily rate records)
- Forecast (predicted future rates from Prophet / moving-average)
- Charterer (shipping companies with trust/reliability scores)
- MarketIndex (BDI, BCI, BPI, BSI daily values)
- MacroFactor (fuel prices, congestion, weather impact)
- PortTraffic (ships at port & expected incoming shipments)
- CostBreakdown (itemised landed-cost calculations)
- Recommendation (buy/wait/delay decision records)
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


# ===========================================================================
# SECTION A — Route & Forecasting Models (Person A owns)
# ===========================================================================


class Port(models.Model):
    """
    Ports involved in the freight route.
    Destination ports are limited to 4 East Coast Indian ports.
    Origin ports are global loading ports.
    """

    PORT_TYPE_CHOICES = [
        ('origin', 'Origin (Loading Port)'),
        ('destination', 'Destination (Indian Port)'),
    ]

    name = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    port_type = models.CharField(max_length=20, choices=PORT_TYPE_CHOICES)

    # Physical constraints (metres)
    max_draft = models.FloatField(
        help_text="Maximum allowable vessel draft in metres",
        default=20.0,
    )
    max_beam = models.FloatField(
        help_text="Maximum allowable vessel beam in metres",
        default=50.0,
    )
    max_loa = models.FloatField(
        help_text="Maximum Length Overall in metres",
        default=300.0,
    )

    # Port traffic / business indicator (Feature F)
    ships_currently_at_port = models.PositiveIntegerField(default=0)
    expected_incoming_shipments = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['name']
        unique_together = ['name', 'country']

    def __str__(self):
        return f"{self.name}, {self.country}"


class Vessel(models.Model):
    """
    Vessel classes supported by the platform.
    Only 3 classes: Capesize, Panamax, Supramax.
    """

    SIZE_CLASS_CHOICES = [
        ('supramax', 'Supramax'),
        ('panamax', 'Panamax'),
        ('capesize', 'Capesize'),
    ]

    size_class = models.CharField(
        max_length=20,
        choices=SIZE_CLASS_CHOICES,
        unique=True,
    )
    min_dwt = models.PositiveIntegerField(help_text="Minimum Dead Weight Tonnage")
    max_dwt = models.PositiveIntegerField(help_text="Maximum Dead Weight Tonnage")
    typical_draft = models.FloatField(help_text="Typical loaded draft in metres")
    typical_beam = models.FloatField(help_text="Typical beam in metres")
    typical_loa = models.FloatField(help_text="Typical Length Overall in metres")

    class Meta:
        ordering = ['min_dwt']

    def __str__(self):
        return f"{self.get_size_class_display()} ({self.min_dwt:,}–{self.max_dwt:,} DWT)"


class Route(models.Model):
    """
    A shipping route from an origin port to an Indian destination port.
    """

    origin_port = models.ForeignKey(
        Port,
        on_delete=models.CASCADE,
        related_name='routes_from',
        limit_choices_to={'port_type': 'origin'},
    )
    destination_port = models.ForeignKey(
        Port,
        on_delete=models.CASCADE,
        related_name='routes_to',
        limit_choices_to={'port_type': 'destination'},
    )
    distance_nautical_miles = models.PositiveIntegerField(
        help_text="Approximate route distance in nautical miles",
        default=0,
    )
    typical_transit_days = models.PositiveIntegerField(
        help_text="Typical voyage duration in days",
        default=0,
    )

    class Meta:
        unique_together = ['origin_port', 'destination_port']
        ordering = ['origin_port__name', 'destination_port__name']

    def __str__(self):
        return f"{self.origin_port.name} → {self.destination_port.name}"


class FreightRateHistory(models.Model):
    """
    Historical daily freight rates for a specific route and vessel class.
    Values in USD per Metric Ton.
    """

    COMMODITY_CHOICES = [
        ('coking_coal', 'Coking Coal'),
        ('non_coking_coal', 'Non-Coking Coal'),
        ('iron_ore', 'Iron Ore'),
        ('limestone', 'Limestone'),
    ]

    route = models.ForeignKey(
        Route,
        on_delete=models.CASCADE,
        related_name='rate_history',
    )
    vessel_class = models.ForeignKey(
        Vessel,
        on_delete=models.CASCADE,
        related_name='rate_history',
    )
    commodity = models.CharField(max_length=30, choices=COMMODITY_CHOICES)
    date = models.DateField()
    rate_usd_per_ton = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Freight rate in USD per Metric Ton",
    )

    class Meta:
        ordering = ['-date']
        unique_together = ['route', 'vessel_class', 'commodity', 'date']
        indexes = [
            models.Index(fields=['route', 'vessel_class', 'commodity', 'date']),
        ]

    def __str__(self):
        return f"{self.route} | {self.vessel_class.size_class} | {self.commodity} | {self.date}: ${self.rate_usd_per_ton}"


class Forecast(models.Model):
    """
    Forecasted freight rates produced by Prophet / moving-average models.
    Each row is a single predicted daily rate for a route+vessel+commodity.
    """

    HORIZON_CHOICES = [
        (30, '30-day'),
        (60, '60-day'),
        (90, '90-day'),
    ]

    route = models.ForeignKey(
        Route,
        on_delete=models.CASCADE,
        related_name='forecasts',
    )
    vessel_class = models.ForeignKey(
        Vessel,
        on_delete=models.CASCADE,
        related_name='forecasts',
    )
    commodity = models.CharField(max_length=30, choices=FreightRateHistory.COMMODITY_CHOICES)
    forecast_date = models.DateField(help_text="The date being predicted")
    predicted_rate = models.DecimalField(max_digits=10, decimal_places=2)
    lower_bound = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Lower confidence interval bound",
    )
    upper_bound = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Upper confidence interval bound",
    )
    horizon_days = models.PositiveIntegerField(
        choices=HORIZON_CHOICES,
        help_text="Forecast horizon this prediction belongs to",
    )
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['forecast_date']
        indexes = [
            models.Index(fields=['route', 'vessel_class', 'commodity', 'forecast_date']),
        ]

    def __str__(self):
        return f"Forecast {self.route} | {self.forecast_date}: ${self.predicted_rate}"


# ===========================================================================
# SECTION B — Market & Business Models (Person B owns)
# ===========================================================================


class Charterer(models.Model):
    """
    Shipping charterers with trust/reliability scores.
    Trust score is computed by trust_score.py module.
    """

    name = models.CharField(max_length=200, unique=True)
    country = models.CharField(max_length=100)
    contact_email = models.EmailField(blank=True)

    # Performance metrics (inputs to trust score calculation)
    on_time_delivery_pct = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage of deliveries completed on time",
        default=0,
    )
    cargo_damage_incidents = models.PositiveIntegerField(
        help_text="Number of cargo damage claims in last 12 months",
        default=0,
    )
    payment_reliability_pct = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage of payments made within agreed terms",
        default=0,
    )
    total_voyages = models.PositiveIntegerField(
        help_text="Total number of completed voyages",
        default=0,
    )
    years_in_operation = models.PositiveIntegerField(default=0)

    # Computed trust score (0–100, updated by trust_score.py)
    trust_score = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Computed reliability score (0–100)",
        default=0,
    )
    trust_grade = models.CharField(
        max_length=2,
        blank=True,
        help_text="Letter grade: A+, A, B, C, D, F",
    )

    class Meta:
        ordering = ['-trust_score']

    def __str__(self):
        return f"{self.name} (Trust: {self.trust_score:.1f})"


class MarketIndex(models.Model):
    """
    Daily values for Baltic Dry Index and sub-indices.
    Feature A — BDI Live Metrics Card.
    """

    INDEX_TYPE_CHOICES = [
        ('BDI', 'Baltic Dry Index'),
        ('BCI', 'Baltic Capesize Index'),
        ('BPI', 'Baltic Panamax Index'),
        ('BSI', 'Baltic Supramax Index'),
    ]

    index_type = models.CharField(max_length=5, choices=INDEX_TYPE_CHOICES)
    date = models.DateField()
    value = models.DecimalField(max_digits=10, decimal_places=2)
    change_pct_24h = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="24-hour percentage change",
        default=0,
    )

    class Meta:
        ordering = ['-date']
        unique_together = ['index_type', 'date']

    def __str__(self):
        return f"{self.index_type} {self.date}: {self.value}"


class MacroFactor(models.Model):
    """
    Macro-economic factors affecting freight forecasts.
    Feature A — Macro Factor Breakdown Card.
    """

    date = models.DateField(unique=True)
    bunker_fuel_price_usd = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Crude/Bunker fuel price in USD per ton",
    )
    port_congestion_index = models.DecimalField(
        max_digits=5, decimal_places=2,
        help_text="Global port congestion index (0–100 scale)",
    )
    seasonal_weather_impact = models.DecimalField(
        max_digits=5, decimal_places=2,
        help_text="Seasonal weather impact score (0–10 scale)",
    )

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"MacroFactors {self.date}"


class CostBreakdown(models.Model):
    """
    Itemised landed-cost calculation triggered by user.
    Feature D — Cost Breakdown.
    """

    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='cost_breakdowns')
    vessel_class = models.ForeignKey(Vessel, on_delete=models.CASCADE)
    commodity = models.CharField(max_length=30, choices=FreightRateHistory.COMMODITY_CHOICES)
    volume_mt = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Cargo volume in Metric Tons",
    )

    # Itemised costs (all in USD)
    base_freight_cost = models.DecimalField(max_digits=14, decimal_places=2)
    bunker_adjustment_factor = models.DecimalField(max_digits=14, decimal_places=2)
    port_handling_charges = models.DecimalField(max_digits=14, decimal_places=2)
    demurrage_buffer = models.DecimalField(max_digits=14, decimal_places=2)
    total_landed_cost_usd = models.DecimalField(max_digits=14, decimal_places=2)
    total_landed_cost_inr = models.DecimalField(max_digits=16, decimal_places=2)

    # Exchange rate used
    usd_to_inr_rate = models.DecimalField(
        max_digits=8, decimal_places=2,
        default=83.00,
        help_text="USD to INR exchange rate used for conversion",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Cost: {self.route} | {self.volume_mt} MT = ${self.total_landed_cost_usd}"


class Recommendation(models.Model):
    """
    Buy/Wait/Delay charter-timing recommendation.
    Feature B — Strategic Buying Alert Banner.
    """

    SIGNAL_CHOICES = [
        ('BUY_NOW', '🟢 BUY NOW'),
        ('WAIT', '🟠 WAIT / STAGGER'),
        ('DELAY', '🔴 DELAY BOOKING'),
    ]

    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='recommendations')
    vessel_class = models.ForeignKey(Vessel, on_delete=models.CASCADE)
    commodity = models.CharField(max_length=30, choices=FreightRateHistory.COMMODITY_CHOICES)

    signal = models.CharField(max_length=20, choices=SIGNAL_CHOICES)
    rationale = models.TextField(help_text="Human-readable explanation of the recommendation")
    financial_impact_usd = models.DecimalField(
        max_digits=14, decimal_places=2,
        help_text="Estimated savings/loss in USD",
        null=True, blank=True,
    )
    financial_impact_inr = models.DecimalField(
        max_digits=16, decimal_places=2,
        help_text="Estimated savings/loss in INR",
        null=True, blank=True,
    )

    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.signal} — {self.route} ({self.generated_at.date()})"
