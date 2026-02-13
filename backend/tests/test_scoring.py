"""Tests for scoring service."""

import pytest

from app.models import (
    Player,
    Match,
    PlayerMatchStats,
    ScoringConfiguration,
    ScoringWeight,
)
from app.services.scoring import ScoringService


def test_seed_default_weights(db_session):
    """Test seeding default scoring weights creates 240 records (16 actions x 15 positions)."""
    service = ScoringService(db_session)
    config = service.seed_default_weights()

    assert config.name == "default"
    assert config.is_active is True
    assert len(config.weights) == 240  # 16 actions * 15 positions


def test_seed_default_weights_position_values(db_session):
    """Test that seeded weights have correct per-position values."""
    service = ScoringService(db_session)
    config = service.seed_default_weights()

    weights_by = {(w.action_name, w.position): w.weight for w in config.weights}

    # Openside flanker (7): highest tackles
    assert weights_by[("tackles_positivos", 7)] == 6.5
    # Scrum-half (9): highest passing
    assert weights_by[("pases", 9)] == 2.0
    # Fly-half (10): highest kicking
    assert weights_by[("juego_pie", 10)] == 4.0
    # Fullback (15): highest aerial
    assert weights_by[("recepcion_aire_buena", 15)] == 5.5
    # Wings (11/14): highest tries and breaks
    assert weights_by[("try_", 11)] == 12.0
    assert weights_by[("quiebres", 14)] == 7.5
    # Props (1/3): harsh scrum penalties
    assert weights_by[("penales", 1)] == -5.5


def test_calculate_score_forward(db_session):
    """Test score calculation for a forward player (position 1)."""
    service = ScoringService(db_session)
    service.seed_default_weights()

    player = Player(name="Test Forward")
    db_session.add(player)
    db_session.flush()

    match = Match(opponent_name="TEST", team="TEST", source_sheet="TEST")
    db_session.add(match)
    db_session.flush()

    stats = PlayerMatchStats(
        player_id=player.id,
        match_id=match.id,
        puesto=1,
        tiempo_juego=80,
        tackles_positivos=5,
        tackles=10,
        try_=1,
    )
    db_session.add(stats)
    db_session.flush()

    score_abs, score_final = service.calculate_score(stats)

    # Position 1 weights: tackles_positivos=4.5, tackles=2.0, try_=8.0
    # Expected: 5*4.5 + 10*2.0 + 1*8.0 = 22.5 + 20 + 8 = 50.5
    assert score_abs == 50.5
    # Normalized: (50.5 / 80) * 70 = 44.1875
    assert score_final == pytest.approx(44.1875)


def test_calculate_score_back(db_session):
    """Test score calculation for a back player (position 10)."""
    service = ScoringService(db_session)
    service.seed_default_weights()

    player = Player(name="Test Back")
    db_session.add(player)
    db_session.flush()

    match = Match(opponent_name="TEST", team="TEST", source_sheet="TEST")
    db_session.add(match)
    db_session.flush()

    stats = PlayerMatchStats(
        player_id=player.id,
        match_id=match.id,
        puesto=10,
        tiempo_juego=80,
        pases=20,
        quiebres=2,
        try_=1,
    )
    db_session.add(stats)
    db_session.flush()

    score_abs, score_final = service.calculate_score(stats)

    # Position 10 weights: pases=1.8, quiebres=6.0, try_=10.5
    # Expected: 20*1.8 + 2*6.0 + 1*10.5 = 36 + 12 + 10.5 = 58.5
    assert score_abs == 58.5
    # Normalized: (58.5 / 80) * 70 = 51.1875
    assert score_final == pytest.approx(51.1875)


def test_different_positions_get_different_weights(db_session):
    """Test that position 1 and position 10 produce different scores for same stats."""
    service = ScoringService(db_session)
    service.seed_default_weights()

    player = Player(name="Test Player")
    db_session.add(player)
    db_session.flush()

    match1 = Match(opponent_name="TEST", team="TEST", source_sheet="TEST")
    match2 = Match(opponent_name="TEST2", team="TEST", source_sheet="TEST2")
    db_session.add_all([match1, match2])
    db_session.flush()

    stats_fwd = PlayerMatchStats(
        player_id=player.id,
        match_id=match1.id,
        puesto=1,
        tiempo_juego=70,
        tackles_positivos=5,
        pases=10,
    )
    db_session.add(stats_fwd)
    db_session.flush()

    score_fwd, _ = service.calculate_score(stats_fwd)

    stats_back = PlayerMatchStats(
        player_id=player.id,
        match_id=match2.id,
        puesto=10,
        tiempo_juego=70,
        tackles_positivos=5,
        pases=10,
    )
    db_session.add(stats_back)
    db_session.flush()

    score_back, _ = service.calculate_score(stats_back)

    # Position 1: 5*4.5 + 10*0.3 = 25.5
    assert score_fwd == 25.5
    # Position 10: 5*3.0 + 10*1.8 = 33.0
    assert score_back == 33.0
    assert score_fwd != score_back


def test_score_normalization(db_session):
    """Test score normalization for partial game time."""
    service = ScoringService(db_session)
    service.seed_default_weights()

    player = Player(name="Test Player")
    db_session.add(player)
    db_session.flush()

    match = Match(opponent_name="TEST", team="TEST", source_sheet="TEST")
    db_session.add(match)
    db_session.flush()

    stats = PlayerMatchStats(
        player_id=player.id,
        match_id=match.id,
        puesto=1,
        tiempo_juego=40,
        tackles_positivos=5,
    )
    db_session.add(stats)
    db_session.flush()

    score_abs, score_final = service.calculate_score(stats)

    # Position 1: 5*4.5 = 22.5
    assert score_abs == 22.5
    # Normalized: (22.5 / 40) * 70 = 39.375
    assert score_final == pytest.approx(39.375)


def test_recalculate_all_scores(db_session):
    """Test recalculating all scores."""
    service = ScoringService(db_session)
    service.seed_default_weights()

    player = Player(name="Multi Match Player")
    db_session.add(player)
    db_session.flush()

    match1 = Match(opponent_name="Opponent A", team="TEST", source_sheet="A")
    match2 = Match(opponent_name="Opponent B", team="TEST", source_sheet="B")
    db_session.add_all([match1, match2])
    db_session.flush()

    stats1 = PlayerMatchStats(
        player_id=player.id, match_id=match1.id,
        puesto=1, tiempo_juego=80, tackles_positivos=10,
    )
    stats2 = PlayerMatchStats(
        player_id=player.id, match_id=match2.id,
        puesto=1, tiempo_juego=60, tackles_positivos=5,
    )
    db_session.add_all([stats1, stats2])
    db_session.flush()

    count = service.recalculate_all_scores()
    assert count == 2

    assert stats1.score_absoluto == 45.0  # 10 * 4.5
    assert stats2.score_absoluto == 22.5  # 5 * 4.5
