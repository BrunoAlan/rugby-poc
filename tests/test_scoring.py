"""Tests for scoring service."""

import pytest

from rugby_stats.models import (
    Player,
    Match,
    PlayerMatchStats,
    ScoringConfiguration,
    ScoringWeight,
)
from rugby_stats.services.scoring import ScoringService


def test_seed_default_weights(db_session):
    """Test seeding default scoring weights creates 240 records (16 actions x 15 positions)."""
    service = ScoringService(db_session)
    config = service.seed_default_weights()

    assert config.name == "default"
    assert config.is_active is True
    assert len(config.weights) == 240  # 16 actions * 15 positions


def test_seed_default_weights_position_values(db_session):
    """Test that seeded weights have correct values per position."""
    service = ScoringService(db_session)
    config = service.seed_default_weights()

    # Find tackles_positivos weights
    tp_weights = [w for w in config.weights if w.action_name == "tackles_positivos"]
    assert len(tp_weights) == 15

    # Forwards (1-8) should get 5.0, backs (9-15) should get 3.0
    for w in tp_weights:
        if w.position <= 8:
            assert w.weight == 5.0, f"Position {w.position} should be 5.0"
        else:
            assert w.weight == 3.0, f"Position {w.position} should be 3.0"


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

    # Position 1 weights: tackles_positivos=5.0, tackles=2.0, try_=10.0
    # Expected: 5*5.0 + 10*2.0 + 1*10.0 = 25 + 20 + 10 = 55
    assert score_abs == 55.0
    # Normalized: (55 / 80) * 70 = 48.125
    assert score_final == pytest.approx(48.125)


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

    # Position 10 weights: pases=1.2, quiebres=7.0, try_=12.0
    # Expected: 20*1.2 + 2*7.0 + 1*12.0 = 24 + 14 + 12 = 50
    assert score_abs == 50.0
    # Normalized: (50 / 80) * 70 = 43.75
    assert score_final == pytest.approx(43.75)


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

    # Position 1: 5*5.0 + 10*0.5 = 30.0
    assert score_fwd == 30.0
    # Position 10: 5*3.0 + 10*1.2 = 27.0
    assert score_back == 27.0
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

    assert score_abs == 25.0
    # Normalized: (25 / 40) * 70 = 43.75
    assert score_final == pytest.approx(43.75)


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

    assert stats1.score_absoluto == 50.0  # 10 * 5.0
    assert stats2.score_absoluto == 25.0  # 5 * 5.0
