"""SIH26006 — OilPriceAPI live market-price ingestion service.

Fetches daily BDI and VLSFO prices and stores them via the Django ORM
into the existing MarketIndex (BDI) and BunkerFuelPrice (VLSFO) models —
the same models the Prophet engine in forecasting.py reads as regressors.

Only stdlib (urllib/json) is used: no new dependency. Run via:
    python manage.py fetch_market_prices      # once per day

Credentials: OILPRICEAPI_TOKEN env var only. The token is never logged,
never stored, and never returned by any API response.
"""

import json
import logging
import urllib.error
import urllib.request
from datetime import date
from decimal import Decimal, InvalidOperation

from django.conf import settings

logger = logging.getLogger(__name__)

SOURCE_LIVE = 'oilpriceapi'

# instrument code -> (model lookup description, human label)
INSTRUMENTS = {
    'BALTIC_DRY_INDEX': {'label': 'BDI'},
    'VLSFO_USD': {'label': 'VLSFO'},
}


class IngestionError(Exception):
    """Raised when a price cannot be fetched or normalized."""


def _http_get_json(url, token, timeout):
    """GET JSON with bearer auth. Raises IngestionError without leaking token."""
    request = urllib.request.Request(
        url, headers={'Authorization': f'Bearer {token}'}
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as exc:
        # 401/403 = bad token, 429 = rate-limited; body may echo request
        # details, so log only the status code, never the payload/headers.
        raise IngestionError(
            f"OilPriceAPI HTTP {exc.code} for {describe_url(url)}"
        ) from exc
    except urllib.error.URLError as exc:
        raise IngestionError(
            f"OilPriceAPI request failed for {describe_url(url)}: "
            f"{exc.reason}"
        ) from exc
    except (ValueError, TimeoutError) as exc:
        raise IngestionError(
            f"OilPriceAPI bad response for {describe_url(url)}: {exc}"
        ) from exc


def describe_url(url):
    """URL without query credentials (codes are safe; tokens never in URL)."""
    return url.split('?')[0]


def _first_present(mapping, *keys):
    for key in keys:
        if isinstance(mapping, dict) and mapping.get(key) is not None:
            return mapping[key]
    return None


def normalize_price(payload, code):
    """
    Extract (price Decimal, observed date, currency) from an API payload.

    Tolerates envelope variations: top-level or nested under 'data'.
    Currency must be USD (or absent); anything else raises IngestionError.
    Falls back to today when no parseable timestamp is present.
    """
    if not isinstance(payload, dict):
        raise IngestionError(f"Malformed {code} response: not an object")

    node = payload.get('data') if isinstance(payload.get('data'), dict) else payload
    raw_price = _first_present(
        node, 'price', 'current_price', 'value', 'rate', 'close',
    )
    try:
        price = Decimal(str(raw_price))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise IngestionError(
            f"Incomplete {code} response: no numeric price"
        ) from exc
    if price <= 0:
        raise IngestionError(f"Incomplete {code} response: non-positive price")

    currency = _first_present(node, 'currency', 'curr', 'unit')
    if currency is not None and str(currency).upper() not in ('USD', 'USD/MT', '$'):
        raise IngestionError(
            f"Unexpected {code} currency: {currency!r} (expected USD)"
        )

    observed = date.today()
    raw_ts = _first_present(
        node, 'created_at', 'timestamp', 'date', 'observed_at', 'updated_at',
    )
    if raw_ts is not None:
        try:
            observed = date.fromisoformat(str(raw_ts)[:10])
        except ValueError:
            logger.warning(
                "Unparseable %s timestamp; using today", code
            )

    return price, observed


def fetch_price(code):
    """Fetch + normalize one instrument. Raises IngestionError on any failure."""
    if not getattr(settings, 'OILPRICEAPI_ENABLED', True):
        raise IngestionError("OilPriceAPI ingestion is disabled")
    token = getattr(settings, 'OILPRICEAPI_TOKEN', '')
    if not token:
        raise IngestionError("OILPRICEAPI_TOKEN is not set; using stored data")
    base = getattr(
        settings, 'OILPRICEAPI_BASE_URL', 'https://api.oilpriceapi.com'
    ).rstrip('/')
    timeout = getattr(settings, 'OILPRICEAPI_TIMEOUT_SECONDS', 10)
    url = f"{base}/v1/prices/latest?by_code={code}"
    payload = _http_get_json(url, token, timeout)
    return normalize_price(payload, code)


def store_bdi(price, observed):
    """Idempotent BDI upsert into MarketIndex. Returns (obj, created)."""
    from app.models import MarketIndex

    previous = MarketIndex.objects.filter(
        index_type='BDI', date__lt=observed,
    ).order_by('-date').first()
    change_pct = Decimal('0')
    if previous and previous.value:
        change_pct = round(
            (price - previous.value) / previous.value * 100, 2
        )
    return MarketIndex.objects.update_or_create(
        index_type='BDI',
        date=observed,
        defaults={
            'value': price,
            'change_pct_24h': change_pct,
            'source': SOURCE_LIVE,
        },
    )


def store_vlsfo(price, observed):
    """Idempotent VLSFO upsert into BunkerFuelPrice. Returns (obj, created)."""
    from app.models import BunkerFuelPrice

    return BunkerFuelPrice.objects.update_or_create(
        date=observed,
        defaults={'marine_gas_oil_usd': price, 'source': SOURCE_LIVE},
    )


def ingest_market_prices():
    """
    Fetch BDI + VLSFO and persist them. Per-instrument errors are logged
    and skipped so one bad feed never blocks the other.

    Returns:
        dict: {'BDI': 'stored'|'skipped', 'VLSFO': 'stored'|'skipped'}
    """
    from app.models import BunkerFuelPrice, MarketIndex  # noqa: F401

    results = {}
    for code, meta in INSTRUMENTS.items():
        try:
            price, observed = fetch_price(code)
        except IngestionError as exc:
            logger.warning("%s ingestion skipped: %s", meta['label'], exc)
            results[meta['label']] = 'skipped'
            continue
        if code == 'BALTIC_DRY_INDEX':
            store_bdi(price, observed)
        else:
            store_vlsfo(price, observed)
        logger.info("%s stored for %s", meta['label'], observed)
        results[meta['label']] = 'stored'
    return results
