"""Tests for AI analysis prompt building helpers."""

from rugby_stats.models import ScoringConfiguration, ScoringWeight
from rugby_stats.services.ai_analysis import AIAnalysisService


def _create_config_with_weights(db_session, weights_dict: dict[str, dict[int, float]]):
    """Helper: create a ScoringConfiguration with given weights."""
    config = ScoringConfiguration(name="test", is_active=True)
    db_session.add(config)
    db_session.flush()
    for action, positions in weights_dict.items():
        for pos, weight in positions.items():
            db_session.add(ScoringWeight(
                config_id=config.id, action_name=action, position=pos, weight=weight
            ))
    db_session.commit()
    return config


def test_get_top_weights_for_group_uses_active_config(db_session):
    """Top weights should come from the provided config, not DEFAULT_SCORING_WEIGHTS."""
    config = _create_config_with_weights(db_session, {
        "tackles_positivos": {1: 10.0, 3: 8.0},
        "ruck_ofensivos": {1: 5.0, 3: 6.0},
        "pases": {1: 0.5, 3: 0.3},
    })
    group_positions = [1, 3]

    result = AIAnalysisService.get_top_weights_for_group(config, group_positions, top_n=2)

    # tackles_positivos avg = 9.0, ruck_ofensivos avg = 5.5, pases avg = 0.4
    assert len(result) == 2
    assert result[0][0] == "tackles_positivos"
    assert result[1][0] == "ruck_ofensivos"


def test_get_top_weights_for_group_excludes_negative(db_session):
    """Negative-weight actions should not appear in top weights."""
    config = _create_config_with_weights(db_session, {
        "tackles_positivos": {1: 5.0},
        "tackles_errados": {1: -3.0},
    })

    result = AIAnalysisService.get_top_weights_for_group(config, [1], top_n=5)

    action_names = [r[0] for r in result]
    assert "tackles_positivos" in action_names
    assert "tackles_errados" not in action_names
