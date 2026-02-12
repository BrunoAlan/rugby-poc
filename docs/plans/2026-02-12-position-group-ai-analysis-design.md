# Position-Group AI Player Evolution Analysis

## Problem

The AI-generated player evolution analysis uses a generic system prompt for all positions. A prop receives the same analysis structure as a fly-half, making the output feel generic and missing position-specific insights.

## Decision

**Approach A: Position group profiles as prompt configuration** — each group defines its own system prompt context, output sections, and stat prioritization. Priority stats are derived from the active `ScoringConfiguration` weights (not hardcoded).

## Position Groups

| Group | Positions | Label |
|-------|-----------|-------|
| Pilares | 1, 3 | Pilares |
| Hooker | 2 | Hooker |
| 2da Linea | 4, 5 | 2da Linea |
| Tercera Linea | 6, 7, 8 | Tercera Linea |
| Medios | 9, 10 | Medios |
| Centros | 12, 13 | Centros |
| Back 3 | 11, 14, 15 | Back 3 |

## Data Structure

`POSITION_GROUPS` dictionary in `constants.py`. Each group defines:

- **`positions`**: list of position numbers
- **`label`**: display name
- **`role_description`**: rugby context for the system prompt (what the position does, what to expect)
- **`output_sections`**: list of `(section_title, evaluation_instructions)` tuples — position-specific sections for the AI output

## Three Layers of Customization

### 1. System Prompt (dynamic)

Function `build_player_evolution_system_prompt(group_profile, active_weights)` builds a prompt with:

1. **Common base**: "Sos un analista experto de rugby argentino..." + formatting rules
2. **Role block**: `role_description` from group profile
3. **Priority stats**: top N actions by weight from active `ScoringConfiguration` for the group's positions
4. **Output sections**: group-specific sections from profile + common sections (Progreso General, Alertas, Recomendaciones)

### 2. User Prompt Data (filtered and prioritized)

`_build_player_evolution_prompt` changes:

- Priority stats (highest weight) listed first with emphasis
- Secondary stats grouped in a summary line
- Stats with zero/negative weight for all group positions are omitted
- Position comparison uses **group-specific average** (pilares vs pilares, not pilares vs all forwards)

### 3. Output Sections (per group)

Common sections (all groups):
- Progreso General
- Alertas del Ultimo Partido
- Recomendaciones

Group-specific sections (examples):

| Group | Specific Sections |
|-------|-------------------|
| Pilares | Scrum/Ruck, Defensa, Disciplina |
| Hooker | Set Pieces/Ruck, Defensa/Movilidad, Distribucion |
| 2da Linea | Ruck/Contacto, Juego Aereo, Defensa |
| Tercera Linea | Breakdown/Contacto, Defensa, Aportes en Ataque |
| Medios | Distribucion, Conduccion de Juego, Defensa |
| Centros | Ataque/Contacto, Distribucion, Defensa |
| Back 3 | Ataque/Contraataque, Juego Aereo, Defensa |

## Changes Required

### Modified Files

1. **`src/rugby_stats/constants.py`** — add `POSITION_GROUPS` dict and `get_group_for_position()` helper
2. **`src/rugby_stats/services/ai_analysis.py`** — refactor `generate_player_evolution`, `_build_player_evolution_prompt`, add `build_player_evolution_system_prompt`
3. **`src/rugby_stats/services/background_tasks.py`** — pass active scoring config weights to AI service
4. **`src/rugby_stats/api/players.py`** — pass active scoring config weights when triggering evolution analysis
5. **`CLAUDE.md`** — document position group profiles
6. **`README.md`** — update AI Analysis section

### No Changes

- **Frontend**: renders markdown, sections change automatically
- **Database**: analysis stored as text in same Player fields
- **Scoring**: weights read-only, not modified
