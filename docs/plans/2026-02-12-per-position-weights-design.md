# Per-Position Scoring Weights

## Context

The current scoring system uses two weight groups (forwards: positions 1-8, backs: positions 9-15). This treats all forwards identically and all backs identically. We want per-position weights so each of the 15 positions has its own weight for each of the 16 actions.

## Decisions

- **15 individual positions** (no grouping)
- **Pivot table schema** (one row per config/action/position)
- **Seed from forward/backs** (positions 1-8 inherit forwards values, 9-15 inherit backs values)
- **Definitive change** (no backward compatibility with the old two-column model)
- **Position names** as shared frontend constant, displayed as "N - Name" throughout the app

## Database Model

Replace `forwards_weight`/`backs_weight` columns with `position` + `weight`:

```python
class ScoringWeight(Base, TimestampMixin):
    __tablename__ = "scoring_weights"
    __table_args__ = (
        UniqueConstraint("config_id", "action_name", "position", name="uq_config_action_position"),
    )

    id: Mapped[int]
    config_id: Mapped[int]    # FK -> scoring_configurations
    action_name: Mapped[str]  # "tackles_positivos", etc.
    position: Mapped[int]     # 1-15
    weight: Mapped[float]
```

16 actions x 15 positions = 240 rows per configuration.

### Default Weights

```python
DEFAULT_SCORING_WEIGHTS = {
    "tackles_positivos": {1: 5.0, 2: 5.0, ..., 8: 5.0, 9: 3.0, ..., 15: 3.0},
    # ... (positions 1-8 inherit current forwards_weight, 9-15 inherit backs_weight)
}
```

## Scoring Service

Weight selection changes from binary forward/back check to direct position lookup:

```python
# Before
w = weight.forwards_weight if is_forward else weight.backs_weight

# After
position = stats.puesto
action_weights = weights.get(field, {})
w = action_weights.get(position, 0.0)
```

Weight loading returns `dict[str, dict[int, float]]` (action_name -> position -> weight).

Score normalization is unchanged: `puntuacion_final = (score_absoluto / max(tiempo, 40)) * 70`.

## API

### Modified endpoints

- **GET /api/scoring/configurations/active** — Returns weights grouped by position:
  ```json
  {
    "id": 1, "name": "default", "is_active": true,
    "weights_by_position": {
      "1": [{"id": 1, "action_name": "tackles_positivos", "position": 1, "weight": 5.0}, ...],
      "2": [...],
      ...
    }
  }
  ```

- **POST /api/scoring/seed-defaults** — Creates 240 records.

### New endpoint

- **PUT /api/scoring/weights/{weight_id}** — Update a single weight:
  ```json
  { "weight": 4.5 }
  ```

### Pydantic schemas

```python
class ScoringWeightResponse(BaseModel):
    id: int
    config_id: int
    action_name: str
    position: int
    weight: float

class WeightUpdate(BaseModel):
    weight: float

class ScoringConfigWithWeights(BaseModel):
    id: int
    name: str
    is_active: bool
    weights_by_position: dict[int, list[ScoringWeightResponse]]
```

## Frontend

### Position names constant (`frontend/src/constants/positions.ts`)

```typescript
export const POSITION_NAMES: Record<number, string> = {
  1: "Pilar Izq.", 2: "Hooker", 3: "Pilar Der.",
  4: "2da Linea", 5: "2da Linea", 6: "Ala",
  7: "Ala", 8: "N8", 9: "Medio Scrum",
  10: "Apertura", 11: "Wing", 12: "Centro",
  13: "Centro", 14: "Wing", 15: "Fullback"
};

export const getPositionLabel = (position: number): string =>
  `${position} - ${POSITION_NAMES[position] ?? "Desconocido"}`;
```

Used in: scoring config tabs, player detail, player list filters.

### ScoringConfig page

1. Config selector (unchanged)
2. **15 position tabs** — each labeled with `getPositionLabel(pos)`
3. Selecting a tab shows a table of 16 action rows with editable weight input
4. Save button per row (appears on change)
5. Recalculate button (unchanged)

### TypeScript types

```typescript
interface ScoringWeight {
  id: number;
  config_id: number;
  action_name: string;
  position: number;
  weight: number;
}

interface WeightUpdate {
  weight: number;
}

interface ScoringConfigWithWeights {
  id: number;
  name: string;
  is_active: boolean;
  weights_by_position: Record<number, ScoringWeight[]>;
}
```

## Migration

1. Alembic migration: create new table structure, expand each old row into 15 rows (pos 1-8 from `forwards_weight`, pos 9-15 from `backs_weight`), drop old columns
2. Run `uv run rugby recalculate-scores` after migration (scores should not change since weights are preserved)

## Testing

- Scoring service calculates correctly with per-position weights
- Different positions receive different weights
- Seed creates 240 records
- PUT endpoint updates a single weight
- Migration preserves existing weight values

## Scope exclusions

- No position grouping or fallback logic
- No bulk weight editing UI
- No import/export of weight configurations
