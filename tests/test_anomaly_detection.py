"""Tests for anomaly detection service."""

from datetime import date

from rugby_stats.models import Player, Match, PlayerMatchStats
from rugby_stats.services.anomaly_detection import AnomalyDetectionService


def _create_player_with_matches(db_session, stats_per_match: list[dict]) -> Player:
    """Helper: create a player with multiple matches and stats."""
    player = Player(name="Test Player")
    db_session.add(player)
    db_session.flush()

    for i, stats_data in enumerate(stats_per_match):
        match = Match(
            opponent_name=f"Opponent {i}",
            team="M18",
            source_sheet=f"Sheet{i}",
            match_date=date(2026, 1, 1 + i),
        )
        db_session.add(match)
        db_session.flush()

        pms = PlayerMatchStats(
            player_id=player.id,
            match_id=match.id,
            puesto=stats_data.get("puesto", 1),
            tiempo_juego=stats_data.get("tiempo_juego", 80),
            tackles_positivos=stats_data.get("tackles_positivos", 0),
            tackles=stats_data.get("tackles", 0),
            tackles_errados=stats_data.get("tackles_errados", 0),
            portador=stats_data.get("portador", 0),
            ruck_ofensivos=stats_data.get("ruck_ofensivos", 0),
            pases=stats_data.get("pases", 0),
            pases_malos=stats_data.get("pases_malos", 0),
            perdidas=stats_data.get("perdidas", 0),
            recuperaciones=stats_data.get("recuperaciones", 0),
            gana_contacto=stats_data.get("gana_contacto", 0),
            quiebres=stats_data.get("quiebres", 0),
            penales=stats_data.get("penales", 0),
            juego_pie=stats_data.get("juego_pie", 0),
            recepcion_aire_buena=stats_data.get("recepcion_aire_buena", 0),
            recepcion_aire_mala=stats_data.get("recepcion_aire_mala", 0),
            try_=stats_data.get("try_", 0),
        )
        db_session.add(pms)

    db_session.flush()
    return player


def test_no_anomaly_when_within_threshold(db_session):
    """Stats within threshold should not trigger alerts."""
    matches_data = [
        {"tackles_positivos": 10},
        {"tackles_positivos": 10},
        {"tackles_positivos": 10},
        {"tackles_positivos": 10},
        {"tackles_positivos": 11},  # 10% above median, under 25% threshold
    ]
    player = _create_player_with_matches(db_session, matches_data)

    service = AnomalyDetectionService(db_session)
    result = service.detect_anomalies(player.id)

    assert result["tackles_positivos"]["alert"] is None


def test_positive_alert_on_positive_stat(db_session):
    """Significant increase in a positive stat should trigger positive alert."""
    matches_data = [
        {"tackles_positivos": 10},
        {"tackles_positivos": 10},
        {"tackles_positivos": 10},
        {"tackles_positivos": 10},
        {"tackles_positivos": 15},  # 50% above median
    ]
    player = _create_player_with_matches(db_session, matches_data)

    service = AnomalyDetectionService(db_session)
    result = service.detect_anomalies(player.id)

    assert result["tackles_positivos"]["alert"] == "positive"
    assert result["tackles_positivos"]["deviation_pct"] == 50.0
    assert result["tackles_positivos"]["median_all"] == 10.0
    assert result["tackles_positivos"]["last_value"] == 15


def test_negative_alert_on_positive_stat_decrease(db_session):
    """Significant decrease in a positive stat should trigger negative alert."""
    matches_data = [
        {"tackles_positivos": 10},
        {"tackles_positivos": 10},
        {"tackles_positivos": 10},
        {"tackles_positivos": 10},
        {"tackles_positivos": 5},  # 50% below median
    ]
    player = _create_player_with_matches(db_session, matches_data)

    service = AnomalyDetectionService(db_session)
    result = service.detect_anomalies(player.id)

    assert result["tackles_positivos"]["alert"] == "negative"
    assert result["tackles_positivos"]["deviation_pct"] == -50.0


def test_negative_stat_inverted_logic(db_session):
    """For negative stats (pases_malos), increase = negative alert."""
    matches_data = [
        {"pases_malos": 4},
        {"pases_malos": 4},
        {"pases_malos": 4},
        {"pases_malos": 4},
        {"pases_malos": 8},  # 100% increase
    ]
    player = _create_player_with_matches(db_session, matches_data)

    service = AnomalyDetectionService(db_session)
    result = service.detect_anomalies(player.id)

    assert result["pases_malos"]["alert"] == "negative"


def test_negative_stat_decrease_is_positive_alert(db_session):
    """For negative stats, decrease = positive alert (fewer bad things)."""
    matches_data = [
        {"pases_malos": 10},
        {"pases_malos": 10},
        {"pases_malos": 10},
        {"pases_malos": 10},
        {"pases_malos": 5},  # 50% decrease
    ]
    player = _create_player_with_matches(db_session, matches_data)

    service = AnomalyDetectionService(db_session)
    result = service.detect_anomalies(player.id)

    assert result["pases_malos"]["alert"] == "positive"


def test_recent_mode_uses_last_5(db_session):
    """Recent mode should use median of last 5 matches (excluding the last)."""
    matches_data = [
        {"tackles": 20},
        {"tackles": 20},
        {"tackles": 20},
        {"tackles": 10},
        {"tackles": 10},
        {"tackles": 10},
        {"tackles": 10},
        {"tackles": 10},  # last match
    ]
    player = _create_player_with_matches(db_session, matches_data)

    service = AnomalyDetectionService(db_session)
    result_recent = service.detect_anomalies(player.id, mode="recent")

    # Recent: median of matches 3-7 (indices 3,4,5,6 = last 5 of history excl last) = 10
    # Last match = 10, deviation = 0% => no alert
    assert result_recent["tackles"]["alert"] is None


def test_volatile_stat_higher_threshold(db_session):
    """Volatile stats (tries) need 50% deviation to trigger alert."""
    matches_data = [
        {"try_": 2},
        {"try_": 2},
        {"try_": 2},
        {"try_": 2},
        {"try_": 3},  # 50% above
    ]
    player = _create_player_with_matches(db_session, matches_data)

    service = AnomalyDetectionService(db_session)
    result = service.detect_anomalies(player.id)

    assert result["try_"]["alert"] == "positive"
    assert result["try_"]["threshold"] == 50


def test_insufficient_matches_returns_empty(db_session):
    """Player with only 1 match should return empty dict."""
    player = _create_player_with_matches(db_session, [{"tackles_positivos": 10}])

    service = AnomalyDetectionService(db_session)
    result = service.detect_anomalies(player.id)

    assert result == {}


def test_zero_median_no_division_error(db_session):
    """Zero median should not cause division by zero."""
    matches_data = [
        {"try_": 0},
        {"try_": 0},
        {"try_": 0},
        {"try_": 0},
        {"try_": 2},
    ]
    player = _create_player_with_matches(db_session, matches_data)

    service = AnomalyDetectionService(db_session)
    result = service.detect_anomalies(player.id)

    assert result["try_"]["alert"] == "positive"


def test_all_16_stats_present(db_session):
    """Result should contain entries for all 16 stats."""
    matches_data = [
        {"tackles_positivos": 5, "tackles": 5},
        {"tackles_positivos": 5, "tackles": 5},
        {"tackles_positivos": 5, "tackles": 5},
    ]
    player = _create_player_with_matches(db_session, matches_data)

    service = AnomalyDetectionService(db_session)
    result = service.detect_anomalies(player.id)

    expected_stats = [
        "tackles_positivos", "tackles", "tackles_errados", "portador",
        "ruck_ofensivos", "pases", "pases_malos", "perdidas",
        "recuperaciones", "gana_contacto", "quiebres", "penales",
        "juego_pie", "recepcion_aire_buena", "recepcion_aire_mala", "try_",
    ]
    for stat in expected_stats:
        assert stat in result, f"Missing stat: {stat}"
