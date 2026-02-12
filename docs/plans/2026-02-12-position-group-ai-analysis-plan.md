# Position-Group AI Player Evolution Analysis — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the AI player evolution analysis position-specific by customizing the system prompt, output sections, and stat prioritization for 7 position groups.

**Architecture:** Add `POSITION_GROUPS` config to `constants.py` with role descriptions and output sections per group. Refactor `AIAnalysisService` to build dynamic system prompts and filter/prioritize stats based on active scoring weights. The background task passes active weights to the AI service.

**Tech Stack:** Python, FastAPI, SQLAlchemy (existing stack — no new dependencies)

---

### Task 1: Add POSITION_GROUPS to constants.py

**Files:**
- Modify: `src/rugby_stats/constants.py`
- Test: `tests/test_position_groups.py` (create)

**Step 1: Write the failing tests**

Create `tests/test_position_groups.py`:

```python
"""Tests for position group configuration."""

from rugby_stats.constants import POSITION_GROUPS, get_group_for_position


def test_position_groups_cover_all_15_positions():
    """Every position 1-15 must belong to exactly one group."""
    covered = set()
    for group in POSITION_GROUPS.values():
        for pos in group["positions"]:
            assert pos not in covered, f"Position {pos} in multiple groups"
            covered.add(pos)
    assert covered == set(range(1, 16))


def test_position_groups_have_required_keys():
    """Each group must have positions, label, role_description, output_sections."""
    required_keys = {"positions", "label", "role_description", "output_sections"}
    for name, group in POSITION_GROUPS.items():
        assert required_keys.issubset(group.keys()), f"Group '{name}' missing keys"
        assert len(group["positions"]) > 0
        assert len(group["output_sections"]) >= 2


def test_get_group_for_position_returns_correct_group():
    assert get_group_for_position(1)["label"] == "Pilares"
    assert get_group_for_position(2)["label"] == "Hooker"
    assert get_group_for_position(4)["label"] == "2da Línea"
    assert get_group_for_position(7)["label"] == "Tercera Línea"
    assert get_group_for_position(9)["label"] == "Medios"
    assert get_group_for_position(12)["label"] == "Centros"
    assert get_group_for_position(15)["label"] == "Back 3"


def test_get_group_for_position_returns_none_for_invalid():
    assert get_group_for_position(0) is None
    assert get_group_for_position(16) is None
```

**Step 2: Run tests to verify they fail**

Run: `uv run pytest tests/test_position_groups.py -v`
Expected: FAIL — `ImportError: cannot import name 'POSITION_GROUPS'`

**Step 3: Implement POSITION_GROUPS and get_group_for_position**

Add to `src/rugby_stats/constants.py` after the existing code:

```python
POSITION_GROUPS: dict[str, dict] = {
    "pilares": {
        "positions": [1, 3],
        "label": "Pilares",
        "role_description": (
            "Pilar del scrum. Responsable de la estabilidad en scrum fijo, "
            "trabajo físico en ruck y maul, presencia defensiva con tackles, "
            "y aporte en el juego suelto cercano al contacto."
        ),
        "output_sections": [
            ("Trabajo en Scrum y Ruck", "Evaluá portador, ruck_ofensivos y gana_contacto — son las acciones centrales de un pilar en el juego suelto."),
            ("Defensa", "Evaluá tackles_positivos, tackles y tackles_errados — un pilar debe ser sólido en defensa."),
            ("Disciplina y Aportes", "Evaluá penales, recuperaciones y perdidas — la disciplina es clave en el pack."),
        ],
    },
    "hooker": {
        "positions": [2],
        "label": "Hooker",
        "role_description": (
            "Hooker. Lanzador de line, pilar del scrum, y jugador de enlace entre "
            "forwards y backs. Combina trabajo físico con habilidades de distribución."
        ),
        "output_sections": [
            ("Trabajo en Set Pieces y Ruck", "Evaluá portador, ruck_ofensivos y gana_contacto — el hooker es protagonista en el contacto."),
            ("Defensa y Movilidad", "Evaluá tackles_positivos, tackles y recuperaciones — debe ser activo en defensa y breakdown."),
            ("Distribución y Disciplina", "Evaluá pases, pases_malos y penales — como enlace, la calidad de pase importa."),
        ],
    },
    "segunda_linea": {
        "positions": [4, 5],
        "label": "2da Línea",
        "role_description": (
            "Segunda línea. Motor del line-out y del maul, aporta metros en el "
            "carry, y es fundamental en la defensa aérea y el trabajo de ruck."
        ),
        "output_sections": [
            ("Ruck y Contacto", "Evaluá ruck_ofensivos, portador y gana_contacto — el segunda línea debe ganar metros y limpiar rucks."),
            ("Juego Aéreo", "Evaluá recepcion_aire_buena y recepcion_aire_mala — es la referencia en el juego aéreo."),
            ("Defensa", "Evaluá tackles_positivos, tackles y tackles_errados — presencia defensiva constante."),
        ],
    },
    "tercera_linea": {
        "positions": [6, 7, 8],
        "label": "Tercera Línea",
        "role_description": (
            "Tercera línea (alas y N°8). Los más dinámicos de los forwards: protagonistas "
            "en el breakdown, líderes en tackles, y capaces de aportar en ataque con carries y quiebres."
        ),
        "output_sections": [
            ("Breakdown y Contacto", "Evaluá ruck_ofensivos, recuperaciones, portador y gana_contacto — la tercera línea domina el breakdown."),
            ("Defensa", "Evaluá tackles_positivos, tackles y tackles_errados — deben liderar la estadística defensiva."),
            ("Aportes en Ataque", "Evaluá quiebres, pases y try_ — la tercera línea moderna también aporta en ataque."),
        ],
    },
    "medios": {
        "positions": [9, 10],
        "label": "Medios",
        "role_description": (
            "Medio scrum y apertura. Conductores del juego: responsables de la distribución, "
            "la toma de decisiones, el juego al pie táctico, y la organización ofensiva y defensiva."
        ),
        "output_sections": [
            ("Distribución", "Evaluá pases, pases_malos y perdidas — la calidad de distribución define a un medio."),
            ("Conducción de Juego", "Evaluá juego_pie, quiebres y try_ — deben manejar el juego táctico y generar oportunidades."),
            ("Defensa", "Evaluá tackles_positivos, tackles y tackles_errados — la defensa de los medios es vital en los canales internos."),
        ],
    },
    "centros": {
        "positions": [12, 13],
        "label": "Centros",
        "role_description": (
            "Centros (inside y outside). Jugadores de choque y enlace: deben ganar la línea de ventaja, "
            "distribuir con criterio, y ser sólidos en defensa uno a uno."
        ),
        "output_sections": [
            ("Ataque y Contacto", "Evaluá gana_contacto, quiebres, portador y try_ — el centro debe ganar la línea de ventaja."),
            ("Distribución", "Evaluá pases, pases_malos y perdidas — como enlace, la calidad de pase es fundamental."),
            ("Defensa", "Evaluá tackles_positivos, tackles y tackles_errados — los centros son la primera línea defensiva en los canales."),
        ],
    },
    "back_3": {
        "positions": [11, 14, 15],
        "label": "Back 3",
        "role_description": (
            "Wings y fullback. Jugadores de contraataque y definición: responsables de "
            "recibir en el aire, generar quiebres, definir tries, y cubrir en el fondo defensivo."
        ),
        "output_sections": [
            ("Ataque y Contraataque", "Evaluá quiebres, try_, portador y gana_contacto — el back 3 debe ser letal en ataque."),
            ("Juego Aéreo", "Evaluá recepcion_aire_buena, recepcion_aire_mala y juego_pie — deben dominar el juego aéreo y territorial."),
            ("Defensa", "Evaluá tackles_positivos, tackles y tackles_errados — última línea defensiva."),
        ],
    },
}


def get_group_for_position(position: int) -> dict | None:
    """Return the position group profile for a given position number, or None if invalid."""
    for group in POSITION_GROUPS.values():
        if position in group["positions"]:
            return group
    return None
```

**Step 4: Run tests to verify they pass**

Run: `uv run pytest tests/test_position_groups.py -v`
Expected: 4 tests PASS

**Step 5: Commit**

```bash
git add src/rugby_stats/constants.py tests/test_position_groups.py
git commit -m "feat: add POSITION_GROUPS config and get_group_for_position helper"
```

---

### Task 2: Add get_top_weights_for_group helper

This helper reads weights from a `ScoringConfiguration` (active config from DB) instead of the hardcoded `DEFAULT_SCORING_WEIGHTS`, and aggregates across all positions in a group.

**Files:**
- Modify: `src/rugby_stats/services/ai_analysis.py`
- Test: `tests/test_ai_prompt_builder.py` (create)

**Step 1: Write the failing test**

Create `tests/test_ai_prompt_builder.py`:

```python
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
```

**Step 2: Run tests to verify they fail**

Run: `uv run pytest tests/test_ai_prompt_builder.py -v`
Expected: FAIL — `AttributeError: type object 'AIAnalysisService' has no attribute 'get_top_weights_for_group'`

**Step 3: Implement get_top_weights_for_group**

Add this static method to `AIAnalysisService` in `src/rugby_stats/services/ai_analysis.py` (below the existing `_get_top_weights_for_position`):

```python
@staticmethod
def get_top_weights_for_group(
    config: ScoringConfiguration,
    group_positions: list[int],
    top_n: int = 5,
) -> list[tuple[str, float]]:
    """Return the top N positive-weighted actions for a position group from a scoring config.

    Averages each action's weight across the group's positions.
    """
    action_avgs: dict[str, float] = {}
    for w in config.weights:
        if w.position in group_positions and w.weight > 0:
            action_avgs.setdefault(w.action_name, []).append(w.weight)

    averaged = [
        (action, sum(vals) / len(vals))
        for action, vals in action_avgs.items()
    ]
    averaged.sort(key=lambda x: x[1], reverse=True)
    return averaged[:top_n]
```

Note: `action_avgs` collects lists, then we average. The type hint says `dict[str, float]` but the actual intermediate is `dict[str, list[float]]` — fix the annotation to match:

```python
    action_avgs: dict[str, list[float]] = {}
```

**Step 4: Run tests to verify they pass**

Run: `uv run pytest tests/test_ai_prompt_builder.py -v`
Expected: 2 tests PASS

**Step 5: Commit**

```bash
git add src/rugby_stats/services/ai_analysis.py tests/test_ai_prompt_builder.py
git commit -m "feat: add get_top_weights_for_group to read weights from active config"
```

---

### Task 3: Build dynamic system prompt

**Files:**
- Modify: `src/rugby_stats/services/ai_analysis.py`
- Test: `tests/test_ai_prompt_builder.py` (append)

**Step 1: Write the failing test**

Append to `tests/test_ai_prompt_builder.py`:

```python
from rugby_stats.constants import POSITION_GROUPS
from rugby_stats.services.ai_analysis import build_player_evolution_system_prompt


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
    # Use a minimal group to test
    group = POSITION_GROUPS["hooker"]
    # Without a config, should still have common sections
    prompt = build_player_evolution_system_prompt(group, config=None)

    assert "Progreso General" in prompt
    assert "Alertas del Último Partido" in prompt
    assert "Recomendaciones" in prompt
```

**Step 2: Run tests to verify they fail**

Run: `uv run pytest tests/test_ai_prompt_builder.py::test_build_system_prompt_includes_role_description -v`
Expected: FAIL — `ImportError: cannot import name 'build_player_evolution_system_prompt'`

**Step 3: Implement build_player_evolution_system_prompt**

Add this as a module-level function in `src/rugby_stats/services/ai_analysis.py` (below the existing `PLAYER_EVOLUTION_SYSTEM_PROMPT` constant):

```python
def build_player_evolution_system_prompt(
    group: dict,
    config: ScoringConfiguration | None = None,
) -> str:
    """Build a position-group-specific system prompt for player evolution analysis."""
    lines = [
        "Sos un analista experto de rugby argentino. Tu tarea es analizar la evolución de un jugador a lo largo de múltiples partidos.",
        "",
        "IMPORTANTE:",
        "- Escribí en español rioplatense (Argentina)",
        "- Usá vocabulario de rugby local",
        "- Sé conciso pero perspicaz",
        "- Basate estrictamente en los datos proporcionados",
        "",
        f"## Rol del jugador",
        f"{group['role_description']}",
        "",
    ]

    # Add top weighted stats from active config
    if config:
        top_weights = AIAnalysisService.get_top_weights_for_group(
            config, group["positions"]
        )
        if top_weights:
            lines.append("## Stats más valoradas para esta posición (config actual)")
            for i, (action, weight) in enumerate(top_weights, 1):
                lines.append(f"{i}. {action} (peso: {weight:.1f})")
            lines.append("")
            lines.append(
                "Usá esta información para contextualizar el rendimiento: "
                "priorizá el análisis de estas stats y evaluá si el jugador "
                "rinde bien en lo que más importa para su posición."
            )
            lines.append("")

    # Output sections
    lines.append("Generá tu análisis con las siguientes secciones usando markdown:")
    lines.append("")
    lines.append("## Progreso General")
    lines.append("Un párrafo evaluando la tendencia general del jugador (mejorando, estable, en baja).")
    lines.append("")

    for section_title, section_instructions in group["output_sections"]:
        lines.append(f"## {section_title}")
        lines.append(f"{section_instructions}")
        lines.append("")

    lines.append("## Alertas del Último Partido")
    lines.append("Comentario sobre las anomalías detectadas en el último partido (tanto positivas como negativas).")
    lines.append("")
    lines.append("## Recomendaciones")
    lines.append("2-3 sugerencias concretas para el jugador, enfocadas en su rol de posición.")

    return "\n".join(lines)
```

**Step 4: Run tests to verify they pass**

Run: `uv run pytest tests/test_ai_prompt_builder.py -v`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add src/rugby_stats/services/ai_analysis.py tests/test_ai_prompt_builder.py
git commit -m "feat: add build_player_evolution_system_prompt for group-specific prompts"
```

---

### Task 4: Refactor _build_player_evolution_prompt to prioritize stats by group

**Files:**
- Modify: `src/rugby_stats/services/ai_analysis.py`
- Test: `tests/test_ai_prompt_builder.py` (append)

**Step 1: Write the failing test**

Append to `tests/test_ai_prompt_builder.py`:

```python
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


def test_build_evolution_prompt_uses_group_label_in_comparison():
    """Position comparison header should use group label, not generic."""
    service = AIAnalysisService.__new__(AIAnalysisService)
    group = POSITION_GROUPS["medios"]

    prompt = service._build_player_evolution_prompt(
        player_name="Test",
        group=group,
        matches_data=[],
        anomalies={},
        position_comparison={"pases": {"player_avg": 5.0, "group_avg": 4.0, "difference_pct": 25.0}},
        config=None,
    )

    assert "Promedio de Medios" in prompt
```

**Step 2: Run tests to verify they fail**

Run: `uv run pytest tests/test_ai_prompt_builder.py::test_build_evolution_prompt_prioritizes_stats -v`
Expected: FAIL — `TypeError` because the method signature doesn't accept `group` and `config` yet

**Step 3: Refactor _build_player_evolution_prompt**

Replace the existing `_build_player_evolution_prompt` method in `AIAnalysisService` with this new signature and implementation:

```python
def _build_player_evolution_prompt(
    self,
    player_name: str,
    group: dict,
    matches_data: list[dict],
    anomalies: dict,
    position_comparison: dict,
    config: ScoringConfiguration | None = None,
) -> str:
    """Build prompt for player evolution analysis with position-group stat prioritization."""
    lines = [
        f"# Evolución de {player_name} ({group['label']})",
        f"- **Partidos jugados:** {len(matches_data)}",
        "",
    ]

    # Determine priority stats from config
    priority_stats: list[str] = []
    if config:
        top = self.get_top_weights_for_group(config, group["positions"])
        priority_stats = [action for action, _ in top]
        if priority_stats:
            top_str = ", ".join(f"{a} ({w:.1f})" for a, w in top)
            lines.append(f"- **Acciones más valoradas para esta posición:** {top_str}")
            lines.append("")

    all_stat_fields = [
        "tackles_positivos", "tackles", "tackles_errados", "portador",
        "ruck_ofensivos", "pases", "pases_malos", "perdidas",
        "recuperaciones", "gana_contacto", "quiebres", "penales",
        "juego_pie", "recepcion_aire_buena", "recepcion_aire_mala", "try_",
    ]
    secondary_stats = [s for s in all_stat_fields if s not in priority_stats]

    lines.extend(["## Historial de Partidos (orden cronológico)", ""])

    for m in matches_data:
        header = (
            f"**vs {m['opponent']}** ({m.get('match_date', 'N/A')}, "
            f"{m['tiempo_juego']:.0f} min, Score: {m['score']:.1f}):"
        )
        if priority_stats:
            pri_parts = [f"{s} {m.get(s, 0)}" for s in priority_stats]
            sec_parts = [f"{s} {m.get(s, 0)}" for s in secondary_stats]
            lines.append(f"{header}")
            lines.append(f"  Principales: {', '.join(pri_parts)}")
            lines.append(f"  Secundarias: {', '.join(sec_parts)}")
        else:
            all_parts = [f"{s} {m.get(s, 0)}" for s in all_stat_fields]
            lines.append(f"{header} {', '.join(all_parts)}")

    lines.extend(["", "## Anomalías Detectadas en el Último Partido", ""])

    alerts_found = False
    for stat_name, data in anomalies.items():
        if data.get("alert"):
            alert_type = "POSITIVA" if data["alert"] == "positive" else "NEGATIVA"
            lines.append(
                f"- **{stat_name}** ({alert_type}): valor={data['last_value']}, "
                f"mediana={data['median_all']}, desviación={data['deviation_pct']:+.1f}%"
            )
            alerts_found = True

    if not alerts_found:
        lines.append("- Sin anomalías significativas")

    lines.extend(["", f"## Comparativa con Promedio de {group['label']}", ""])

    for stat_name, comp in position_comparison.items():
        diff = comp["difference_pct"]
        if abs(diff) >= 15:
            direction = "por encima" if diff > 0 else "por debajo"
            lines.append(
                f"- **{stat_name}**: jugador={comp['player_avg']}, "
                f"grupo={comp['group_avg']} ({abs(diff):.0f}% {direction})"
            )

    lines.extend(["", "Analizá la evolución de este jugador y generá un informe completo."])

    return "\n".join(lines)
```

**Step 4: Run tests to verify they pass**

Run: `uv run pytest tests/test_ai_prompt_builder.py -v`
Expected: All 7 tests PASS

**Step 5: Commit**

```bash
git add src/rugby_stats/services/ai_analysis.py tests/test_ai_prompt_builder.py
git commit -m "feat: refactor _build_player_evolution_prompt to prioritize stats by group"
```

---

### Task 5: Wire up generate_player_evolution to use dynamic prompt and group

**Files:**
- Modify: `src/rugby_stats/services/ai_analysis.py` — update `generate_player_evolution` signature and logic

**Step 1: Update generate_player_evolution**

Replace the existing `generate_player_evolution` method:

```python
def generate_player_evolution(
    self,
    player_name: str,
    matches_data: list[dict],
    anomalies: dict,
    position_comparison: dict,
    position_number: int,
    config: ScoringConfiguration | None = None,
) -> str:
    """Generate AI analysis for a player's evolution using position-group-specific prompts."""
    if not self.settings.can_generate_ai_analysis:
        raise ValueError(
            "AI analysis is not configured. Set OPENROUTER_API_KEY in .env"
        )

    from rugby_stats.constants import get_group_for_position

    group = get_group_for_position(position_number)
    if not group:
        raise ValueError(f"No position group found for position {position_number}")

    system_prompt = build_player_evolution_system_prompt(group, config)
    user_prompt = self._build_player_evolution_prompt(
        player_name=player_name,
        group=group,
        matches_data=matches_data,
        anomalies=anomalies,
        position_comparison=position_comparison,
        config=config,
    )
    return self._call_openrouter_with_system(user_prompt, system_prompt)
```

Note: the old `position_group: str` parameter is removed (the group label is derived from `position_number`). The old `position_number: int | None` is now required `position_number: int`.

**Step 2: Run existing tests to check nothing broke**

Run: `uv run pytest -v`
Expected: All tests PASS (the old method is not directly tested with mocks, callers are updated in next task)

**Step 3: Commit**

```bash
git add src/rugby_stats/services/ai_analysis.py
git commit -m "feat: wire generate_player_evolution to use group-specific system prompt"
```

---

### Task 6: Update callers — background_tasks.py and players.py

**Files:**
- Modify: `src/rugby_stats/services/background_tasks.py`
- Modify: `src/rugby_stats/api/players.py` (no changes needed — it calls `generate_player_evolution_background` which we fix here)

**Step 1: Update background_tasks.py**

In `generate_player_evolution_background`, update the call to `ai_service.generate_player_evolution` to pass `config` and remove `position_group`:

Replace the block starting at the `ai_service.generate_player_evolution(` call (around line 132) with:

```python
            # Get active scoring config for weight-based stat prioritization
            from rugby_stats.models import ScoringConfiguration as ScoringConfigModel
            active_config = db.query(ScoringConfigModel).filter(
                ScoringConfigModel.is_active == True
            ).first()

            ai_service = AIAnalysisService(db)
            analysis = ai_service.generate_player_evolution(
                player_name=player.name,
                matches_data=summary["matches"],
                anomalies=anomalies,
                position_comparison=position_comparison,
                position_number=most_common_pos,
                config=active_config,
            )
```

Also remove the now-unused `position_group` variable (the `position_group = get_position_label(most_common_pos)` line) and the `get_position_label` import if no longer used.

**Step 2: Run full test suite**

Run: `uv run pytest -v`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/rugby_stats/services/background_tasks.py
git commit -m "feat: pass active scoring config to player evolution analysis"
```

---

### Task 7: Clean up old PLAYER_EVOLUTION_SYSTEM_PROMPT and _get_top_weights_for_position

**Files:**
- Modify: `src/rugby_stats/services/ai_analysis.py`

**Step 1: Remove dead code**

- Delete the `PLAYER_EVOLUTION_SYSTEM_PROMPT` constant (replaced by `build_player_evolution_system_prompt`)
- Delete `_get_top_weights_for_position` static method (replaced by `get_top_weights_for_group`)
- Remove the `DEFAULT_SCORING_WEIGHTS` import if no longer used elsewhere in the file (check `_build_analysis_prompt` — it still uses `_get_top_weights_for_position` for match analysis). If match analysis still needs per-position weights from defaults, keep `_get_top_weights_for_position` for now and only remove `PLAYER_EVOLUTION_SYSTEM_PROMPT`.

**Step 2: Run full test suite**

Run: `uv run pytest -v`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/rugby_stats/services/ai_analysis.py
git commit -m "refactor: remove old generic PLAYER_EVOLUTION_SYSTEM_PROMPT"
```

---

### Task 8: Update CLAUDE.md and README.md

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

**Step 1: Update CLAUDE.md**

In the "Player Evolution & Anomaly Detection" section, add a note about position groups:

After the "AI Evolution Analysis" bullet, add:
```
- **Position-Group Prompts**: Player evolution analysis uses 7 position groups (Pilares, Hooker, 2da Línea, Tercera Línea, Medios, Centros, Back 3) defined in `constants.py` (`POSITION_GROUPS`). Each group has a custom system prompt with role description, group-specific output sections, and stat prioritization derived from the active `ScoringConfiguration` weights.
```

**Step 2: Update README.md**

In the "AI Analysis" section, add a bullet about position-specific analysis:

```
- **Position-specific**: Player evolution uses 7 position groups with custom prompts — each group gets role-specific evaluation sections and stat prioritization based on active scoring weights
```

**Step 3: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: document position-group AI analysis in CLAUDE.md and README.md"
```

---

### Task 9: Manual verification

**Step 1: Start the backend**

Run: `uv run uvicorn rugby_stats.main:app --reload`

**Step 2: Trigger a player evolution analysis**

Pick a player with match data. Use the API:

```bash
curl -X POST http://localhost:8000/api/players/{player_id}/evolution-analysis
```

**Step 3: Poll for completion**

```bash
curl http://localhost:8000/api/players/{player_id}/evolution-analysis
```

**Step 4: Verify the output**

Check that:
- The analysis has position-specific sections (e.g., "Trabajo en Scrum y Ruck" for a pilar, not generic "Fortalezas Consistentes")
- Stats mentioned align with the position group's priorities
- The "Comparativa" section references the group label (e.g., "Pilares") not just the position number

**Step 5: Check the frontend**

Open `http://localhost:3000`, navigate to a player detail page, trigger the evolution analysis, and verify the markdown renders with the new sections.
