"""Tests for AI analysis prompt building helpers."""

from rugby_stats.constants import POSITION_GROUPS
from rugby_stats.models import ScoringConfiguration, ScoringWeight
from rugby_stats.services.ai_analysis import AIAnalysisService, build_player_evolution_system_prompt


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


def test_build_system_prompt_includes_role_description(db_session):
    config = _create_config_with_weights(db_session, {
        "tackles_positivos": {1: 5.0, 3: 4.0},
    })
    group = POSITION_GROUPS["pilares"]

    prompt = build_player_evolution_system_prompt(group, config)

    assert "Pilar del scrum" in prompt
    assert "Trabajo en Scrum y Ruck" in prompt
    assert "Defensa" in prompt
    assert "Disciplina y Aportes" in prompt


def test_build_system_prompt_includes_weighted_stats(db_session):
    config = _create_config_with_weights(db_session, {
        "tackles_positivos": {9: 3.5, 10: 3.0},
        "pases": {9: 2.0, 10: 1.8},
        "juego_pie": {9: 2.5, 10: 4.0},
    })
    group = POSITION_GROUPS["medios"]

    prompt = build_player_evolution_system_prompt(group, config)

    assert "tackles_positivos" in prompt
    assert "juego_pie" in prompt
    assert "Distribución" in prompt
    assert "Conducción de Juego" in prompt


def test_build_system_prompt_has_common_sections():
    """Common sections should always be present regardless of group."""
    group = POSITION_GROUPS["hooker"]
    # Without a config, should still have common sections
    prompt = build_player_evolution_system_prompt(group, config=None)

    assert "Progreso General" in prompt
    assert "Alertas del Último Partido" in prompt
    assert "Recomendaciones" in prompt


def test_build_evolution_prompt_prioritizes_stats(db_session):
    """Priority stats should appear first in match data, secondary stats after."""
    config = _create_config_with_weights(db_session, {
        "tackles_positivos": {1: 5.0, 3: 5.0},
        "ruck_ofensivos": {1: 3.0, 3: 3.0},
        "portador": {1: 1.5, 3: 1.5},
        "pases": {1: 0.3, 3: 0.3},
        "quiebres": {1: 0.0, 3: 0.0},
    })
    group = POSITION_GROUPS["pilares"]

    service = AIAnalysisService(db_session)
    prompt = service._build_player_evolution_prompt(
        player_name="Test Player",
        group=group,
        matches_data=[{
            "opponent": "RIVAL", "match_date": "01/01/2025",
            "tiempo_juego": 70, "score": 45.0,
            "tackles_positivos": 8, "tackles": 5, "tackles_errados": 1,
            "portador": 6, "ruck_ofensivos": 10, "pases": 2,
            "pases_malos": 0, "perdidas": 1, "recuperaciones": 3,
            "gana_contacto": 4, "quiebres": 0, "penales": 1,
            "juego_pie": 0, "recepcion_aire_buena": 1,
            "recepcion_aire_mala": 0, "try_": 0,
        }],
        anomalies={},
        position_comparison={},
        config=config,
    )

    # "Principales:" should appear before "Secundarias:"
    assert "Principales:" in prompt
    assert "Secundarias:" in prompt
    assert prompt.index("Principales:") < prompt.index("Secundarias:")


def test_build_evolution_prompt_uses_group_label_in_comparison(db_session):
    """Position comparison header should use group label, not generic."""
    group = POSITION_GROUPS["medios"]

    service = AIAnalysisService(db_session)
    prompt = service._build_player_evolution_prompt(
        player_name="Test",
        group=group,
        matches_data=[],
        anomalies={},
        position_comparison={"pases": {"player_avg": 5.0, "group_avg": 4.0, "difference_pct": 25.0}},
        config=None,
    )

    assert "Promedio de Medios" in prompt
