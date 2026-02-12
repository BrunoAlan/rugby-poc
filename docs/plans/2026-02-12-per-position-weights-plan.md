# Per-Position Scoring Weights — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the binary forwards/backs weight system with per-position (1-15) weights for all 16 scoring actions.

**Architecture:** Pivot the `scoring_weights` table from `(config_id, action_name, forwards_weight, backs_weight)` to `(config_id, action_name, position, weight)` — one row per config/action/position combination (240 rows per config). Update scoring service to look up weight by exact position. Rebuild frontend WeightsTable with position tabs.

**Tech Stack:** FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL, React 18, TypeScript, TailwindCSS, React Query

---

### Task 1: Alembic Migration — Pivot scoring_weights Table

**Files:**
- Create: `alembic/versions/d4e5f6a7b8c9_per_position_weights.py`

**Step 1: Create the migration file**

```bash
uv run alembic revision --autogenerate -m "per_position_weights"
```

Then replace the generated content with:

```python
"""Per-position scoring weights

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-02-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create new table
    op.create_table(
        'scoring_weights_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('config_id', sa.Integer(), nullable=False),
        sa.Column('action_name', sa.String(length=50), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['config_id'], ['scoring_configurations.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('config_id', 'action_name', 'position', name='uq_config_action_position'),
    )

    # 2. Migrate data: expand each old row into 15 rows
    conn = op.get_bind()
    old_rows = conn.execute(sa.text(
        "SELECT id, config_id, action_name, forwards_weight, backs_weight, created_at, updated_at "
        "FROM scoring_weights"
    )).fetchall()

    for row in old_rows:
        config_id = row[1]
        action_name = row[2]
        forwards_weight = row[3]
        backs_weight = row[4]
        created_at = row[5]
        updated_at = row[6]

        for position in range(1, 16):
            weight = forwards_weight if position <= 8 else backs_weight
            conn.execute(sa.text(
                "INSERT INTO scoring_weights_new (config_id, action_name, position, weight, created_at, updated_at) "
                "VALUES (:config_id, :action_name, :position, :weight, :created_at, :updated_at)"
            ), {
                "config_id": config_id,
                "action_name": action_name,
                "position": position,
                "weight": weight,
                "created_at": created_at,
                "updated_at": updated_at,
            })

    # 3. Drop old table, rename new
    op.drop_table('scoring_weights')
    op.rename_table('scoring_weights_new', 'scoring_weights')


def downgrade() -> None:
    # Create old-format table
    op.create_table(
        'scoring_weights_old',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('config_id', sa.Integer(), nullable=False),
        sa.Column('action_name', sa.String(length=50), nullable=False),
        sa.Column('forwards_weight', sa.Float(), nullable=False),
        sa.Column('backs_weight', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['config_id'], ['scoring_configurations.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('config_id', 'action_name', name='uq_config_action'),
    )

    # Collapse: take position=1 as forwards_weight, position=9 as backs_weight
    conn = op.get_bind()
    action_names = conn.execute(sa.text(
        "SELECT DISTINCT config_id, action_name FROM scoring_weights"
    )).fetchall()

    for config_id, action_name in action_names:
        fwd = conn.execute(sa.text(
            "SELECT weight FROM scoring_weights WHERE config_id=:cid AND action_name=:an AND position=1"
        ), {"cid": config_id, "an": action_name}).scalar() or 0.0
        back = conn.execute(sa.text(
            "SELECT weight FROM scoring_weights WHERE config_id=:cid AND action_name=:an AND position=9"
        ), {"cid": config_id, "an": action_name}).scalar() or 0.0
        conn.execute(sa.text(
            "INSERT INTO scoring_weights_old (config_id, action_name, forwards_weight, backs_weight, created_at, updated_at) "
            "VALUES (:cid, :an, :fwd, :back, now(), now())"
        ), {"cid": config_id, "an": action_name, "fwd": fwd, "back": back})

    op.drop_table('scoring_weights')
    op.rename_table('scoring_weights_old', 'scoring_weights')
```

**Step 2: Update the SQLAlchemy model**

Modify `src/rugby_stats/models/scoring_config.py`:

Replace the `ScoringWeight` class (lines 33-55) with:

```python
class ScoringWeight(Base, TimestampMixin):
    """Weight for a specific action and position in a scoring configuration."""

    __tablename__ = "scoring_weights"
    __table_args__ = (
        UniqueConstraint("config_id", "action_name", "position", name="uq_config_action_position"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    config_id: Mapped[int] = mapped_column(
        ForeignKey("scoring_configurations.id"), nullable=False
    )
    action_name: Mapped[str] = mapped_column(String(50), nullable=False)
    position: Mapped[int] = mapped_column(nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    configuration: Mapped["ScoringConfiguration"] = relationship(
        "ScoringConfiguration", back_populates="weights"
    )

    def __repr__(self) -> str:
        return f"<ScoringWeight(action='{self.action_name}', position={self.position}, weight={self.weight})>"
```

Also replace `DEFAULT_SCORING_WEIGHTS` (lines 58-76) with the expanded format:

```python
# Default weights: {action_name: (forwards_value, backs_value)}
# Positions 1-8 get forwards_value, 9-15 get backs_value
_DEFAULT_WEIGHT_PAIRS = {
    "tackles_positivos": (5.0, 3.0),
    "tackles": (2.0, 1.5),
    "tackles_errados": (-4.0, -3.0),
    "portador": (1.5, 1.2),
    "ruck_ofensivos": (2.5, 0.5),
    "pases": (0.5, 1.2),
    "pases_malos": (-2.0, -4.0),
    "perdidas": (-4.0, -5.0),
    "recuperaciones": (5.0, 4.0),
    "gana_contacto": (3.0, 4.0),
    "quiebres": (4.0, 7.0),
    "penales": (-5.0, -4.0),
    "juego_pie": (1.0, 3.0),
    "recepcion_aire_buena": (3.0, 5.0),
    "recepcion_aire_mala": (-3.0, -4.0),
    "try_": (10.0, 12.0),
}

DEFAULT_SCORING_WEIGHTS: dict[str, dict[int, float]] = {
    action: {
        pos: fwd if pos <= 8 else back
        for pos in range(1, 16)
    }
    for action, (fwd, back) in _DEFAULT_WEIGHT_PAIRS.items()
}
```

Also add the `Integer` import at the top of the file (line 5):

```python
from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, UniqueConstraint
```

**Step 3: Run the migration**

```bash
uv run alembic upgrade head
```

Expected: Migration applies successfully, `scoring_weights` table now has `(id, config_id, action_name, position, weight, created_at, updated_at)` columns.

**Step 4: Commit**

```bash
git add alembic/versions/ src/rugby_stats/models/scoring_config.py
git commit -m "feat: migrate scoring_weights to per-position schema"
```

---

### Task 2: Update Scoring Service

**Files:**
- Modify: `src/rugby_stats/services/scoring.py`
- Test: `tests/test_scoring.py`

**Step 1: Write the failing tests**

Replace all content in `tests/test_scoring.py` with:

```python
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

    match = Match(opponent_name="TEST", source_sheet="TEST")
    db_session.add(match)
    db_session.flush()

    # Same stats, position 1
    stats_fwd = PlayerMatchStats(
        player_id=player.id,
        match_id=match.id,
        puesto=1,
        tiempo_juego=70,
        tackles_positivos=5,
        pases=10,
    )
    db_session.add(stats_fwd)
    db_session.flush()

    score_fwd, _ = service.calculate_score(stats_fwd)

    # Same stats, position 10
    stats_back = PlayerMatchStats(
        player_id=player.id,
        match_id=match.id,
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

    match = Match(opponent_name="TEST", source_sheet="TEST")
    db_session.add(match)
    db_session.flush()

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
    # Normalized: (25 / 40) * 70 = 43.75
    assert score_final == pytest.approx(43.75)


def test_recalculate_all_scores(db_session):
    """Test recalculating all scores."""
    service = ScoringService(db_session)
    service.seed_default_weights()

    player = Player(name="Multi Match Player")
    db_session.add(player)
    db_session.flush()

    match1 = Match(opponent_name="Opponent A", source_sheet="A")
    match2 = Match(opponent_name="Opponent B", source_sheet="B")
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

    # Verify scores were set
    assert stats1.score_absoluto == 50.0  # 10 * 5.0
    assert stats2.score_absoluto == 25.0  # 5 * 5.0
```

**Step 2: Run the tests to verify they fail**

```bash
uv run pytest tests/test_scoring.py -v
```

Expected: Multiple failures (model has changed but service still uses old `forwards_weight`/`backs_weight`).

**Step 3: Update `seed_default_weights` in scoring service**

In `src/rugby_stats/services/scoring.py`, replace the `seed_default_weights` method (lines 21-52):

```python
    def seed_default_weights(self) -> ScoringConfiguration:
        """Create default scoring configuration with predefined weights."""
        existing = (
            self.db.query(ScoringConfiguration)
            .filter(ScoringConfiguration.name == "default")
            .first()
        )
        if existing:
            return existing

        config = ScoringConfiguration(
            name="default",
            description="Default scoring weights per position (1-15)",
            is_active=True,
        )
        self.db.add(config)
        self.db.flush()

        for action_name, weights_by_pos in DEFAULT_SCORING_WEIGHTS.items():
            for position, weight_value in weights_by_pos.items():
                weight = ScoringWeight(
                    config_id=config.id,
                    action_name=action_name,
                    position=position,
                    weight=weight_value,
                )
                self.db.add(weight)

        self.db.commit()
        return config
```

**Step 4: Update `calculate_score` method**

In `src/rugby_stats/services/scoring.py`, replace the `calculate_score` method (lines 62-126):

```python
    def calculate_score(
        self, stats: PlayerMatchStats, config: ScoringConfiguration | None = None
    ) -> tuple[float, float]:
        """
        Calculate score for a player's match statistics.

        Args:
            stats: Player match statistics
            config: Scoring configuration to use (defaults to active config)

        Returns:
            Tuple of (score_absoluto, puntuacion_final)
        """
        if config is None:
            config = self.get_active_config()

        if config is None:
            raise ValueError("No active scoring configuration found")

        # Build weights dictionary: {action_name: {position: weight}}
        weights: dict[str, dict[int, float]] = {}
        for w in config.weights:
            weights.setdefault(w.action_name, {})[w.position] = w.weight

        position = stats.puesto

        # Calculate absolute score
        score_absoluto = 0.0

        stat_fields = [
            "tackles_positivos",
            "tackles",
            "tackles_errados",
            "portador",
            "ruck_ofensivos",
            "pases",
            "pases_malos",
            "perdidas",
            "recuperaciones",
            "gana_contacto",
            "quiebres",
            "penales",
            "juego_pie",
            "recepcion_aire_buena",
            "recepcion_aire_mala",
            "try_",
        ]

        for field in stat_fields:
            stat_value = getattr(stats, field, 0) or 0
            action_weights = weights.get(field, {})
            w = action_weights.get(position, 0.0)
            score_absoluto += stat_value * w

        # Normalize to standard match duration with floor
        tiempo_juego = stats.tiempo_juego or STANDARD_MATCH_DURATION
        tiempo_for_calc = max(tiempo_juego, MIN_MINUTES_FOR_NORMALIZATION)
        if tiempo_for_calc > 0:
            puntuacion_final = (score_absoluto / tiempo_for_calc) * STANDARD_MATCH_DURATION
        else:
            puntuacion_final = 0.0

        return score_absoluto, puntuacion_final
```

**Step 5: Run the tests to verify they pass**

```bash
uv run pytest tests/test_scoring.py -v
```

Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/rugby_stats/services/scoring.py tests/test_scoring.py
git commit -m "feat: update scoring service for per-position weights"
```

---

### Task 3: Update Pydantic Schemas

**Files:**
- Modify: `src/rugby_stats/schemas/scoring.py`

**Step 1: Replace schemas**

Replace the full content of `src/rugby_stats/schemas/scoring.py`:

```python
"""Scoring configuration schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ScoringWeightBase(BaseModel):
    """Base scoring weight schema."""

    action_name: str
    position: int
    weight: float


class ScoringWeightCreate(ScoringWeightBase):
    """Schema for creating a scoring weight."""

    pass


class ScoringWeight(ScoringWeightBase):
    """Scoring weight response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    config_id: int
    created_at: datetime
    updated_at: datetime


class WeightUpdate(BaseModel):
    """Schema for updating a single weight."""

    weight: float


class ScoringConfigurationBase(BaseModel):
    """Base scoring configuration schema."""

    name: str
    description: str | None = None
    is_active: bool = False


class ScoringConfigurationCreate(ScoringConfigurationBase):
    """Schema for creating a scoring configuration."""

    weights: list[ScoringWeightCreate] | None = None


class ScoringConfiguration(ScoringConfigurationBase):
    """Scoring configuration response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class ScoringConfigurationWithWeights(ScoringConfiguration):
    """Scoring configuration with weights grouped by position."""

    weights: list[ScoringWeight] = []
```

**Step 2: Commit**

```bash
git add src/rugby_stats/schemas/scoring.py
git commit -m "feat: update Pydantic schemas for per-position weights"
```

---

### Task 4: Add PUT Weight Endpoint to API

**Files:**
- Modify: `src/rugby_stats/api/scoring.py`

**Step 1: Add the import for WeightUpdate and ScoringWeight model**

At the top of `src/rugby_stats/api/scoring.py`, update the imports (lines 8-12):

```python
from rugby_stats.models import ScoringConfiguration as ConfigModel
from rugby_stats.models import ScoringWeight as WeightModel
from rugby_stats.schemas.scoring import (
    ScoringConfiguration,
    ScoringConfigurationCreate,
    ScoringConfigurationWithWeights,
    WeightUpdate,
    ScoringWeight as WeightSchema,
)
from rugby_stats.services.scoring import ScoringService
```

**Step 2: Add the PUT endpoint**

Add at the end of `src/rugby_stats/api/scoring.py` (before the recalculate endpoint):

```python
@router.put("/weights/{weight_id}", response_model=WeightSchema)
def update_weight(weight_id: int, data: WeightUpdate, db: Session = Depends(get_db)):
    """Update a single scoring weight value."""
    weight = db.query(WeightModel).filter(WeightModel.id == weight_id).first()
    if weight is None:
        raise HTTPException(status_code=404, detail="Weight not found")
    weight.weight = data.weight
    db.commit()
    db.refresh(weight)
    return weight
```

**Step 3: Verify the server starts**

```bash
uv run uvicorn rugby_stats.main:app --reload &
sleep 3
curl -s http://localhost:8000/api/scoring/configurations/active | python3 -m json.tool | head -20
kill %1
```

Expected: Server starts, active config endpoint returns weights with `position` and `weight` fields.

**Step 4: Commit**

```bash
git add src/rugby_stats/api/scoring.py
git commit -m "feat: add PUT endpoint for updating individual weights"
```

---

### Task 5: Frontend — Position Constants

**Files:**
- Create: `frontend/src/constants/positions.ts`

**Step 1: Create the position constants file**

```typescript
export const POSITION_NAMES: Record<number, string> = {
  1: 'Pilar Izq.',
  2: 'Hooker',
  3: 'Pilar Der.',
  4: '2da Línea',
  5: '2da Línea',
  6: 'Ala',
  7: 'Ala',
  8: 'N°8',
  9: 'Medio Scrum',
  10: 'Apertura',
  11: 'Wing',
  12: 'Centro',
  13: 'Centro',
  14: 'Wing',
  15: 'Fullback',
}

export const getPositionLabel = (position: number): string =>
  `${position} - ${POSITION_NAMES[position] ?? 'Desconocido'}`

export const ALL_POSITIONS = Array.from({ length: 15 }, (_, i) => i + 1)
```

**Step 2: Commit**

```bash
git add frontend/src/constants/positions.ts
git commit -m "feat: add shared position name constants"
```

---

### Task 6: Frontend — Update TypeScript Types

**Files:**
- Modify: `frontend/src/types/index.ts` (lines 164-190)

**Step 1: Update the scoring types**

Replace lines 164-190 in `frontend/src/types/index.ts`:

```typescript
// Scoring types
export interface ScoringConfig {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  weights?: ScoringWeight[];
}

export interface ScoringWeight {
  id: number;
  config_id: number;
  action_name: string;
  position: number;
  weight: number;
}

export interface ScoringConfigCreate {
  name: string;
  description?: string;
}

export interface WeightUpdate {
  weight: number;
}
```

**Step 2: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: update TypeScript types for per-position weights"
```

---

### Task 7: Frontend — Update API Client and Hooks

**Files:**
- Modify: `frontend/src/api/scoring.ts`
- Modify: `frontend/src/hooks/useScoringConfig.ts`

**Step 1: Update API client**

Replace `frontend/src/api/scoring.ts`:

```typescript
import apiClient from './client'
import type { ScoringConfig, ScoringConfigCreate, ScoringWeight, WeightUpdate } from '../types'

export const scoringApi = {
  getConfigurations: async (): Promise<ScoringConfig[]> => {
    const response = await apiClient.get('/scoring/configurations')
    return response.data
  },

  getActiveConfig: async (): Promise<ScoringConfig> => {
    const response = await apiClient.get('/scoring/configurations/active')
    return response.data
  },

  getConfigById: async (id: number): Promise<ScoringConfig> => {
    const response = await apiClient.get(`/scoring/configurations/${id}`)
    return response.data
  },

  createConfig: async (data: ScoringConfigCreate): Promise<ScoringConfig> => {
    const response = await apiClient.post('/scoring/configurations', data)
    return response.data
  },

  activateConfig: async (id: number): Promise<ScoringConfig> => {
    const response = await apiClient.post(`/scoring/configurations/${id}/activate`)
    return response.data
  },

  updateWeight: async (weightId: number, data: WeightUpdate): Promise<ScoringWeight> => {
    const response = await apiClient.put(`/scoring/weights/${weightId}`, data)
    return response.data
  },

  recalculateScores: async (): Promise<{ message: string; stats_updated: number }> => {
    const response = await apiClient.post('/scoring/recalculate')
    return response.data
  },
}
```

**Step 2: Update hooks**

Replace `frontend/src/hooks/useScoringConfig.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scoringApi } from '../api/scoring'
import type { ScoringConfigCreate, WeightUpdate } from '../types'

export const useScoringConfigs = () => {
  return useQuery({
    queryKey: ['scoring', 'configs'],
    queryFn: () => scoringApi.getConfigurations(),
  })
}

export const useActiveConfig = () => {
  return useQuery({
    queryKey: ['scoring', 'active'],
    queryFn: () => scoringApi.getActiveConfig(),
  })
}

export const useScoringConfig = (id: number) => {
  return useQuery({
    queryKey: ['scoring', 'config', id],
    queryFn: () => scoringApi.getConfigById(id),
    enabled: !!id,
  })
}

export const useCreateConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ScoringConfigCreate) => scoringApi.createConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring'] })
    },
  })
}

export const useActivateConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => scoringApi.activateConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring'] })
      queryClient.invalidateQueries({ queryKey: ['rankings'] })
    },
  })
}

export const useUpdateWeight = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ weightId, data }: { weightId: number; data: WeightUpdate }) =>
      scoringApi.updateWeight(weightId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring'] })
    },
  })
}

export const useRecalculateScores = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => scoringApi.recalculateScores(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankings'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['player'] })
    },
  })
}
```

**Step 3: Commit**

```bash
git add frontend/src/api/scoring.ts frontend/src/hooks/useScoringConfig.ts
git commit -m "feat: update API client and hooks for per-position weights"
```

---

### Task 8: Frontend — Rebuild WeightsTable with Position Tabs

**Files:**
- Modify: `frontend/src/components/scoring/WeightsTable.tsx`
- Modify: `frontend/src/pages/ScoringConfig.tsx`

**Step 1: Rewrite WeightsTable component**

Replace `frontend/src/components/scoring/WeightsTable.tsx`:

```tsx
import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
import type { ScoringWeight, WeightUpdate } from '../../types'
import { ALL_POSITIONS, getPositionLabel } from '../../constants/positions'
import WeightInput from './WeightInput'

interface WeightsTableProps {
  weights: ScoringWeight[]
  onUpdateWeight: (weightId: number, data: WeightUpdate) => Promise<void>
  isUpdating?: boolean
}

const ACTION_LABELS: Record<string, string> = {
  tackles_positivos: 'Tackles Positivos',
  tackles: 'Tackles',
  tackles_errados: 'Tackles Errados',
  portador: 'Portador',
  ruck_ofensivos: 'Ruck Ofensivos',
  pases: 'Pases',
  pases_malos: 'Pases Malos',
  perdidas: 'Pérdidas',
  recuperaciones: 'Recuperaciones',
  gana_contacto: 'Gana Contacto',
  quiebres: 'Quiebres',
  penales: 'Penales',
  juego_pie: 'Juego al Pie',
  recepcion_aire_buena: 'Recepción Aérea Buena',
  recepcion_aire_mala: 'Recepción Aérea Mala',
  try_: 'Try',
}

export default function WeightsTable({ weights, onUpdateWeight, isUpdating }: WeightsTableProps) {
  const [selectedPosition, setSelectedPosition] = useState(1)
  const [pendingChanges, setPendingChanges] = useState<Record<number, number>>({})
  const [savingId, setSavingId] = useState<number | null>(null)

  // Filter weights for selected position
  const positionWeights = weights.filter((w) => w.position === selectedPosition)

  const handleWeightChange = (weightId: number, value: number) => {
    setPendingChanges((prev) => ({ ...prev, [weightId]: value }))
  }

  const handleSave = async (weightId: number) => {
    const newWeight = pendingChanges[weightId]
    if (newWeight === undefined) return

    setSavingId(weightId)
    try {
      await onUpdateWeight(weightId, { weight: newWeight })
      setPendingChanges((prev) => {
        const next = { ...prev }
        delete next[weightId]
        return next
      })
    } finally {
      setSavingId(null)
    }
  }

  const hasChanges = (weightId: number) => pendingChanges[weightId] !== undefined

  return (
    <div className="space-y-4">
      {/* Position Tabs */}
      <div className="flex flex-wrap gap-1">
        {ALL_POSITIONS.map((pos) => (
          <button
            key={pos}
            type="button"
            onClick={() => setSelectedPosition(pos)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedPosition === pos
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700/50 text-dark-300 hover:bg-dark-700 hover:text-white'
            }`}
          >
            {getPositionLabel(pos)}
          </button>
        ))}
      </div>

      {/* Weights Table */}
      <div className="overflow-hidden rounded-lg border border-dark-700/50">
        <table className="min-w-full divide-y divide-dark-700/50">
          <thead>
            <tr>
              <th className="table-header px-4 py-3">Acción</th>
              <th className="table-header px-4 py-3 text-center">Peso</th>
              <th className="table-header px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/30">
            {positionWeights.map((weight) => {
              const currentValue = pendingChanges[weight.id] ?? weight.weight

              return (
                <tr key={weight.id} className="hover:bg-dark-700/30">
                  <td className="table-cell font-medium text-gray-200">
                    {ACTION_LABELS[weight.action_name] || weight.action_name}
                  </td>
                  <td className="table-cell text-center">
                    <WeightInput
                      value={currentValue}
                      onChange={(value) => handleWeightChange(weight.id, value)}
                      disabled={isUpdating || savingId === weight.id}
                    />
                  </td>
                  <td className="table-cell text-center">
                    {hasChanges(weight.id) && (
                      <button
                        type="button"
                        onClick={() => handleSave(weight.id)}
                        disabled={savingId === weight.id}
                        className="btn-primary py-1 px-2 text-xs"
                      >
                        {savingId === weight.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

**Step 2: Update ScoringConfig page handler**

In `frontend/src/pages/ScoringConfig.tsx`, update the `handleUpdateWeight` function (line 42-44):

```typescript
  const handleUpdateWeight = async (weightId: number, data: { weight: number }) => {
    await updateWeightMutation.mutateAsync({ weightId, data })
  }
```

**Step 3: Verify frontend compiles**

```bash
cd frontend && pnpm build
```

Expected: Build succeeds with no TypeScript errors.

**Step 4: Commit**

```bash
git add frontend/src/components/scoring/WeightsTable.tsx frontend/src/pages/ScoringConfig.tsx
git commit -m "feat: rebuild WeightsTable with position tabs UI"
```

---

### Task 9: Frontend — Show Position Names in Player Detail

**Files:**
- Modify: `frontend/src/pages/PlayerDetail.tsx` (line 109)
- Modify: `frontend/src/components/players/PlayerSummary.tsx` (lines 12-14, 33)

**Step 1: Update PlayerDetail match row**

In `frontend/src/pages/PlayerDetail.tsx`, add import at top:

```typescript
import { getPositionLabel } from '../constants/positions'
```

Then update line 109 from:

```tsx
<td className="table-cell px-4 py-3 text-center tabular-nums">#{match.puesto}</td>
```

To:

```tsx
<td className="table-cell px-4 py-3 text-center tabular-nums text-sm">{getPositionLabel(match.puesto)}</td>
```

**Step 2: Update PlayerSummary component**

In `frontend/src/components/players/PlayerSummary.tsx`, add import:

```typescript
import { getPositionLabel } from '../../constants/positions'
```

Replace lines 12-14 (the `isForward` logic) and line 33 (the badge display):

```typescript
  // Get most common position
  const primaryPosition = matches && matches.length > 0
    ? matches.reduce((acc, m) => {
        acc[m.puesto] = (acc[m.puesto] || 0) + 1
        return acc
      }, {} as Record<number, number>)
    : null

  const mostCommonPosition = primaryPosition
    ? Number(Object.entries(primaryPosition).sort(([, a], [, b]) => b - a)[0][0])
    : null

  const isForward = mostCommonPosition !== null && mostCommonPosition <= 8
```

Replace the badge span (lines 26-34) with:

```tsx
            {mostCommonPosition !== null && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                  isForward
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}
              >
                {getPositionLabel(mostCommonPosition)}
              </span>
            )}
```

**Step 3: Verify frontend compiles**

```bash
cd frontend && pnpm build
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add frontend/src/pages/PlayerDetail.tsx frontend/src/components/players/PlayerSummary.tsx
git commit -m "feat: display position names in player detail and summary"
```

---

### Task 10: Re-seed Data and Verify

**Step 1: Delete the old default config and re-seed**

The existing "default" config still has old-format data in the DB. The migration should have expanded it, but we need to verify. If the migration was applied before updating the model, the data is already migrated. Just run recalculate to verify.

```bash
uv run rugby recalculate-scores
```

Expected: "Recalculated scores for N player stats" — scores should remain unchanged since the weights are preserved from the migration.

**Step 2: Run all tests**

```bash
uv run pytest -v
```

Expected: All tests pass.

**Step 3: Verify frontend builds**

```bash
cd frontend && pnpm build
```

Expected: No errors.

**Step 4: Manual smoke test**

Start both servers:
```bash
uv run uvicorn rugby_stats.main:app --reload &
cd frontend && pnpm dev &
```

Verify:
- Open http://localhost:3000/scoring — position tabs appear, selecting different tabs shows different weights
- Open a player detail page — position shows as "N - Name" format
- Edit a weight and save — no errors
- Recalculate scores — completes successfully

**Step 5: Commit any remaining changes**

```bash
git add -A && git status
```

If there are unstaged documentation changes:
```bash
git commit -m "chore: update documentation for per-position weights"
```

---

### Task 11: Update SCORING.md Documentation

**Files:**
- Modify: `docs/SCORING.md`

**Step 1: Update the documentation**

Update the scoring documentation to reflect that weights are now per-position (1-15) instead of forwards/backs. Key changes:
- Weight structure: each action has 15 individual weights (one per position)
- Score formula uses position-specific weight lookup
- Default weights: positions 1-8 start with forwards defaults, 9-15 with backs defaults
- The `seed-weights` CLI creates 240 weight records per configuration

**Step 2: Commit**

```bash
git add docs/SCORING.md
git commit -m "docs: update scoring docs for per-position weights"
```
