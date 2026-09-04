"""
SIH26006 — Charterer Trust / Reliability Score Calculator

Computes a composite trust score (0–100) for each charterer based on
weighted performance metrics.

NOTE (Open Decision #2): The current implementation uses a weighted-average
approach over performance fields. This can be swapped to:
  - Randomly generated synthetic scores for demo
  - Simple rule-based scoring from manual input fields
Confirm the final method with the team before locking in the logic.

Usage:
    from app.trust_score import compute_trust_score, compute_all_trust_scores
    score, grade = compute_trust_score(charterer)
    compute_all_trust_scores()  # Batch update all charterers
"""

import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Scoring Weights — sum must equal 1.0
# ---------------------------------------------------------------------------
WEIGHTS = {
    'on_time_delivery': 0.35,       # Most critical — delivery reliability
    'payment_reliability': 0.25,    # Financial trustworthiness
    'cargo_damage': 0.20,           # Safety / cargo handling quality
    'experience': 0.10,             # Years in operation
    'volume': 0.10,                 # Total voyages completed
}

# Grade thresholds
GRADE_MAP = [
    (95, 'A+'),
    (85, 'A'),
    (70, 'B'),
    (55, 'C'),
    (40, 'D'),
    (0, 'F'),
]


def compute_trust_score(charterer):
    """
    Compute trust score for a single charterer instance.

    Args:
        charterer: app.models.Charterer instance

    Returns:
        tuple[float, str]: (score 0–100, letter grade)
    """
    # 1. On-time delivery score (already 0–100)
    on_time_score = charterer.on_time_delivery_pct

    # 2. Payment reliability score (already 0–100)
    payment_score = charterer.payment_reliability_pct

    # 3. Cargo damage score — fewer incidents = higher score
    #    0 incidents → 100, 1 → 90, 2 → 75, 3 → 60, 4 → 40, 5+ → 20
    damage_scores = {0: 100, 1: 90, 2: 75, 3: 60, 4: 40}
    cargo_score = damage_scores.get(
        charterer.cargo_damage_incidents,
        max(20, 100 - charterer.cargo_damage_incidents * 15),
    )

    # 4. Experience score — capped at 100 for 20+ years
    experience_score = min((charterer.years_in_operation / 20) * 100, 100)

    # 5. Volume score — capped at 100 for 500+ voyages
    volume_score = min((charterer.total_voyages / 500) * 100, 100)

    # Weighted composite
    composite = (
        WEIGHTS['on_time_delivery'] * on_time_score
        + WEIGHTS['payment_reliability'] * payment_score
        + WEIGHTS['cargo_damage'] * cargo_score
        + WEIGHTS['experience'] * experience_score
        + WEIGHTS['volume'] * volume_score
    )

    score = round(min(max(composite, 0), 100), 1)
    grade = _score_to_grade(score)

    return score, grade


def _score_to_grade(score):
    """Convert a numeric score (0–100) to a letter grade."""
    for threshold, grade in GRADE_MAP:
        if score >= threshold:
            return grade
    return 'F'


def compute_all_trust_scores():
    """
    Batch-compute and save trust scores for all charterers in the database.

    Returns:
        int: Number of charterers updated.
    """
    from app.models import Charterer

    charterers = Charterer.objects.all()
    updated = 0

    for charterer in charterers:
        score, grade = compute_trust_score(charterer)
        charterer.trust_score = score
        charterer.trust_grade = grade
        updated += 1

    Charterer.objects.bulk_update(charterers, ['trust_score', 'trust_grade'])
    logger.info("Updated trust scores for %d charterers.", updated)
    return updated
