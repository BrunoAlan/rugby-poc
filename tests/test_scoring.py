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
    """Test seeding default scoring weights."""
    service = ScoringService(db_session)
    config = service.seed_default_weights()

    assert config.name == "default"
    assert config.is_active is True
    assert len(config.weights) == 16


def test_calculate_score_forward(db_session):
    """Test score calculation for a forward player."""
    service = ScoringService(db_session)
    service.seed_default_weights()

    # Create test data
    player = Player(name="Test Forward")
    db_session.add(player)
    db_session.flush()

    match = Match(opponent_name="TEST", source_sheet="TEST")
    db_session.add(match)
    db_session.flush()

    stats = PlayerMatchStats(
        player_id=player.id,
        match_id=match.id,
        puesto=1,  # Forward
        tiempo_juego=80,
        tackles_positivos=5,
        tackles=10,
        try_=1,
    )
    db_session.add(stats)
    db_session.flush()

    # Calculate score
    score_abs, score_final = service.calculate_score(stats)

    # Forward weights: tackles_positivos=5.0, tackles=2.0, try_=10.0
    # Expected: 5*5.0 + 10*2.0 + 1*10.0 = 25 + 20 + 10 = 55
    assert score_abs == 55.0
    # Normalized: (55 / 80) * 80 = 55
    assert score_final == 55.0


def test_calculate_score_back(db_session):
    """Test score calculation for a back player."""
    service = ScoringService(db_session)
    service.seed_default_weights()

    # Create test data
    player = Player(name="Test Back")
    db_session.add(player)
    db_session.flush()

    match = Match(opponent_name="TEST", source_sheet="TEST")
    db_session.add(match)
    db_session.flush()

    stats = PlayerMatchStats(
        player_id=player.id,
        match_id=match.id,
        puesto=10,  # Back (fly-half)
        tiempo_juego=80,
        pases=20,
        quiebres=2,
        try_=1,
    )
    db_session.add(stats)
    db_session.flush()

    # Calculate score
    score_abs, score_final = service.calculate_score(stats)

    # Back weights: pases=1.2, quiebres=7.0, try_=12.0
    # Expected: 20*1.2 + 2*7.0 + 1*12.0 = 24 + 14 + 12 = 50
    assert score_abs == 50.0
    assert score_final == 50.0


def test_score_normalization(db_session):
    """Test score normalization for partial game time."""
    service = ScoringService(db_session)
    service.seed_default_weights()

    # Create test data
    player = Player(name="Test Player")
    db_session.add(player)
    db_session.flush()

    match = Match(opponent_name="TEST", source_sheet="TEST")
    db_session.add(match)
    db_session.flush()

    # Player only played 40 minutes
    stats = PlayerMatchStats(
        player_id=player.id,
        match_id=match.id,
        puesto=1,
        tiempo_juego=40,  # Half game
        tackles_positivos=5,  # 5 * 5.0 = 25 absolute
    )
    db_session.add(stats)
    db_session.flush()

    score_abs, score_final = service.calculate_score(stats)

    assert score_abs == 25.0
    # Normalized: (25 / 40) * 80 = 50
    assert score_final == 50.0


def test_player_summary(db_session):
    """Test getting player summary across matches."""
    service = ScoringService(db_session)
    service.seed_default_weights()

    # Create player
    player = Player(name="Multi Match Player")
    db_session.add(player)
    db_session.flush()

    # Create two matches
    match1 = Match(opponent_name="Opponent A", source_sheet="A")
    match2 = Match(opponent_name="Opponent B", source_sheet="B")
    db_session.add_all([match1, match2])
    db_session.flush()

    # Create stats for both matches
    stats1 = PlayerMatchStats(
        player_id=player.id,
        match_id=match1.id,
        puesto=1,
        tiempo_juego=80,
        tackles_positivos=10,
    )
    stats2 = PlayerMatchStats(
        player_id=player.id,
        match_id=match2.id,
        puesto=1,
        tiempo_juego=60,
        tackles_positivos=5,
    )
    db_session.add_all([stats1, stats2])
    db_session.flush()

    # Calculate scores
    service.recalculate_all_scores()

    # Get summary
    summary = service.get_player_summary("Multi Match Player")

    assert summary is not None
    assert summary["player_name"] == "Multi Match Player"
    assert summary["matches_played"] == 2
    assert summary["total_minutes"] == 140.0
    assert len(summary["matches"]) == 2
