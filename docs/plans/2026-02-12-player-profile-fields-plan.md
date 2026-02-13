# Player Profile Fields Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add weight_kg and height_cm fields to the Player entity and enable inline editing of name, weight, and height in the PlayerDetail page.

**Architecture:** Add two nullable Float columns to the players table via Alembic migration. Add a `PUT /api/players/{id}` endpoint with a `PlayerUpdate` partial-update schema. Modify the `PlayerSummary` component to toggle between read/edit modes with inline inputs.

**Tech Stack:** SQLAlchemy, Alembic, FastAPI, Pydantic, React, TypeScript, TailwindCSS, React Query, Lucide React

---

### Task 1: Alembic Migration — Add weight_kg and height_cm columns

**Files:**
- Create: `alembic/versions/d4e5f6a7b8c9_add_player_weight_height.py`

**Step 1: Generate the migration file**

Create `alembic/versions/d4e5f6a7b8c9_add_player_weight_height.py`:

```python
"""Add player weight and height fields

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-02-12 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('players', sa.Column('weight_kg', sa.Float(), nullable=True))
    op.add_column('players', sa.Column('height_cm', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('players', 'height_cm')
    op.drop_column('players', 'weight_kg')
```

**Step 2: Apply the migration**

Run: `uv run alembic upgrade head`
Expected: Migration applies successfully, no errors.

**Step 3: Commit**

```bash
git add alembic/versions/d4e5f6a7b8c9_add_player_weight_height.py
git commit -m "feat: add weight_kg and height_cm columns to players table"
```

---

### Task 2: Update Player Model

**Files:**
- Modify: `src/rugby_stats/models/player.py:20-21` (add fields after `name`)

**Step 1: Add the two fields to the Player model**

After line 21 (`name` field), add:

```python
weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
```

Also add `Float` to the `sqlalchemy` import on line 6:

```python
from sqlalchemy import DateTime, Float, Integer, String, Text
```

**Step 2: Verify model loads**

Run: `uv run python -c "from rugby_stats.models import Player; print('OK')"`
Expected: `OK`

**Step 3: Commit**

```bash
git add src/rugby_stats/models/player.py
git commit -m "feat: add weight_kg and height_cm to Player model"
```

---

### Task 3: Update Pydantic Schemas

**Files:**
- Modify: `src/rugby_stats/schemas/player.py`

**Step 1: Add PlayerUpdate schema**

After the `PlayerCreate` class (line 17), add:

```python
class PlayerUpdate(BaseModel):
    """Schema for updating a player (partial update)."""

    name: str | None = None
    weight_kg: float | None = None
    height_cm: float | None = None
```

**Step 2: Add weight_kg and height_cm to Player response schema**

In the `Player` class (line 20-27), add after `updated_at`:

```python
weight_kg: float | None = None
height_cm: float | None = None
```

**Step 3: Add weight_kg and height_cm to PlayerSummary schema**

In the `PlayerSummary` class (line 66-74), add after `avg_puntuacion_final`:

```python
weight_kg: float | None = None
height_cm: float | None = None
```

**Step 4: Add PlayerUpdate to `src/rugby_stats/schemas/__init__.py`**

Add `PlayerUpdate` to the exports in `src/rugby_stats/schemas/__init__.py`.

**Step 5: Commit**

```bash
git add src/rugby_stats/schemas/player.py src/rugby_stats/schemas/__init__.py
git commit -m "feat: add PlayerUpdate schema and weight/height to response schemas"
```

---

### Task 4: Write test for PUT /api/players/{id} endpoint

**Files:**
- Create: `tests/test_player_update.py`

**Step 1: Write the failing test**

Create `tests/test_player_update.py`:

```python
"""Tests for the player update endpoint."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from rugby_stats.database import get_db
from rugby_stats.main import app
from rugby_stats.models import Base
from rugby_stats.models.player import Player


@pytest.fixture
def test_db():
    """Create an in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(test_db):
    """Create a test client with overridden DB dependency."""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def sample_player(test_db):
    """Create a sample player in the test database."""
    player = Player(name="Test Player")
    test_db.add(player)
    test_db.commit()
    test_db.refresh(player)
    return player


def test_update_player_name(client, sample_player):
    """Test updating just the player name."""
    response = client.put(
        f"/api/players/{sample_player.id}",
        json={"name": "Updated Name"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"


def test_update_player_weight_height(client, sample_player):
    """Test updating weight and height."""
    response = client.put(
        f"/api/players/{sample_player.id}",
        json={"weight_kg": 92.5, "height_cm": 185.0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["weight_kg"] == 92.5
    assert data["height_cm"] == 185.0


def test_update_player_partial(client, sample_player):
    """Test partial update — only weight, name stays the same."""
    response = client.put(
        f"/api/players/{sample_player.id}",
        json={"weight_kg": 100.0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Player"
    assert data["weight_kg"] == 100.0


def test_update_player_not_found(client):
    """Test updating a non-existent player returns 404."""
    response = client.put(
        "/api/players/999",
        json={"name": "Ghost"},
    )
    assert response.status_code == 404


def test_update_player_duplicate_name(client, test_db, sample_player):
    """Test updating to a name that already exists returns 409."""
    other = Player(name="Other Player")
    test_db.add(other)
    test_db.commit()

    response = client.put(
        f"/api/players/{sample_player.id}",
        json={"name": "Other Player"},
    )
    assert response.status_code == 409


def test_update_player_same_name_allowed(client, sample_player):
    """Test updating with the same name (no change) is allowed."""
    response = client.put(
        f"/api/players/{sample_player.id}",
        json={"name": "Test Player", "weight_kg": 90.0},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Test Player"
```

**Step 2: Run tests to verify they fail**

Run: `uv run pytest tests/test_player_update.py -v`
Expected: FAIL — endpoint does not exist yet (405 Method Not Allowed or 404).

**Step 3: Commit**

```bash
git add tests/test_player_update.py
git commit -m "test: add tests for player update endpoint"
```

---

### Task 5: Implement PUT /api/players/{id} endpoint

**Files:**
- Modify: `src/rugby_stats/api/players.py`

**Step 1: Add the import for PlayerUpdate**

In the imports at line 12-22, add `PlayerUpdate` to the schemas import:

```python
from rugby_stats.schemas import (
    Player,
    PlayerAnomalies,
    PlayerCreate,
    PlayerEvolutionAnalysis,
    PlayerList,
    PlayerSummary,
    PlayerUpdate,
    PlayerWithStats,
    PlayerWithStatsList,
    PositionComparison,
)
```

**Step 2: Add the PUT endpoint**

Add before the `create_player` endpoint (before line 232):

```python
@router.put("/{player_id}", response_model=Player)
def update_player(player_id: int, player_data: PlayerUpdate, db: Session = Depends(get_db)):
    """Update a player's profile fields."""
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    update_dict = player_data.model_dump(exclude_unset=True)

    if "name" in update_dict and update_dict["name"] != player.name:
        existing = db.query(PlayerModel).filter(
            PlayerModel.name == update_dict["name"],
            PlayerModel.id != player_id,
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="A player with this name already exists")

    for key, value in update_dict.items():
        setattr(player, key, value)

    db.commit()
    db.refresh(player)
    return player
```

**Step 3: Run the tests**

Run: `uv run pytest tests/test_player_update.py -v`
Expected: All 6 tests PASS.

**Step 4: Run all tests to verify no regressions**

Run: `uv run pytest -v`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/rugby_stats/api/players.py
git commit -m "feat: add PUT /api/players/{id} endpoint for profile updates"
```

---

### Task 6: Update PlayerSummary API to include weight/height

**Files:**
- Modify: `src/rugby_stats/services/scoring.py` (the `get_player_summary` method)

**Step 1: Find the get_player_summary method and add weight_kg, height_cm to the returned dict**

The `get_player_summary` method builds a dict that becomes `PlayerSummary`. Add `weight_kg` and `height_cm` from the player object to this dict.

Look for where `player_id`, `player_name`, `matches_played`, etc. are set, and add:

```python
"weight_kg": player.weight_kg,
"height_cm": player.height_cm,
```

**Step 2: Verify via API**

Run: `uv run uvicorn rugby_stats.main:app --reload` and check `GET /api/players/name/{name}/summary` returns weight_kg and height_cm fields.

**Step 3: Commit**

```bash
git add src/rugby_stats/services/scoring.py
git commit -m "feat: include weight_kg and height_cm in player summary response"
```

---

### Task 7: Update Frontend TypeScript Types

**Files:**
- Modify: `frontend/src/types/index.ts`

**Step 1: Add weight_kg and height_cm to Player interface**

In the `Player` interface (line 30-35), add:

```typescript
weight_kg: number | null;
height_cm: number | null;
```

**Step 2: Add weight_kg and height_cm to PlayerSummary interface**

In the `PlayerSummary` interface (line 48-55), add:

```typescript
weight_kg: number | null;
height_cm: number | null;
```

**Step 3: Add PlayerUpdate interface**

After the `PlayerCreate` interface (line 44-46), add:

```typescript
export interface PlayerUpdate {
  name?: string;
  weight_kg?: number | null;
  height_cm?: number | null;
}
```

**Step 4: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: add weight/height fields and PlayerUpdate type to frontend types"
```

---

### Task 8: Update Frontend API Client and Hook

**Files:**
- Modify: `frontend/src/api/players.ts`
- Modify: `frontend/src/hooks/usePlayers.ts`

**Step 1: Update the playersApi.update method signature**

In `frontend/src/api/players.ts`, update the import to include `PlayerUpdate` and change the `update` method:

```typescript
import type { Player, PlayerCreate, PlayerUpdate, PlayerSummary, PlayerWithStats, PlayerAnomalies, PlayerEvolutionAnalysis, PositionComparison } from '../types'
```

```typescript
update: async (id: number, data: PlayerUpdate): Promise<Player> => {
    const response = await apiClient.put(`/players/${id}`, data)
    return response.data
},
```

**Step 2: Update useUpdatePlayer hook**

In `frontend/src/hooks/usePlayers.ts`, update the import and mutation type:

```typescript
import type { PlayerCreate, PlayerUpdate } from '../types'
```

```typescript
export const useUpdatePlayer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PlayerUpdate }) =>
      playersApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
      queryClient.invalidateQueries({ queryKey: ['player', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['player', 'summary'] })
    },
  })
}
```

Note: also invalidate `['player', 'summary']` so the PlayerDetail page refetches after update.

**Step 3: Verify frontend builds**

Run: `cd frontend && pnpm build`
Expected: No TypeScript errors.

**Step 4: Commit**

```bash
git add frontend/src/api/players.ts frontend/src/hooks/usePlayers.ts
git commit -m "feat: update frontend API client and hook for player updates"
```

---

### Task 9: Add Inline Editing to PlayerSummary Component

**Files:**
- Modify: `frontend/src/components/players/PlayerSummary.tsx`

**Step 1: Implement inline editing**

Replace the contents of `PlayerSummary.tsx` with the version that supports toggling between read and edit modes. Key changes:

1. Add `useState` for `isEditing` (boolean), `editName` (string), `editWeight` (string), `editHeight` (string), and `error` (string | null).
2. Accept a new prop `playerId: number` needed for the update mutation.
3. Import `useUpdatePlayer` hook.
4. Import `Pencil`, `Check`, `X`, `Weight`, `Ruler` from lucide-react.
5. In read mode: show name as text, show weight/height below position badge (or "Sin datos" if null), show a pencil icon button.
6. In edit mode: show name as text input, weight as number input with "kg" suffix, height as number input with "cm" suffix, show check (save) and X (cancel) buttons.
7. On save: call `updatePlayer.mutateAsync({ id: playerId, data })`. On 409 error, set error message. On success, exit edit mode.
8. On cancel: reset form values to current data, clear error, exit edit mode.

The stat cards (Partidos Jugados, Minutos Totales, Promedio) remain unchanged.

**Step 2: Update PlayerDetail.tsx to pass playerId prop**

In `frontend/src/pages/PlayerDetail.tsx`, update the `PlayerSummaryComponent` usage to pass `playerId`:

```tsx
<PlayerSummaryComponent summary={summary} playerId={summary.player_id} />
```

**Step 3: Verify frontend builds**

Run: `cd frontend && pnpm build`
Expected: No TypeScript errors.

**Step 4: Verify in browser**

Run: `cd frontend && pnpm dev`
- Navigate to a player's detail page
- Verify weight/height display (should show "Sin datos" initially)
- Click pencil icon, verify edit mode appears
- Enter weight and height, save
- Verify values persist after page refresh
- Try changing name to an existing player's name, verify error message appears

**Step 5: Commit**

```bash
git add frontend/src/components/players/PlayerSummary.tsx frontend/src/pages/PlayerDetail.tsx
git commit -m "feat: add inline editing for player name, weight, and height"
```

---

### Task 10: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update the Key Models section**

In the Player bullet under "Key Models", add the new fields:

```
- **Player**: name (unique), weight_kg, height_cm, AI evolution analysis fields (cached)
```

**Step 2: Update the API Endpoints section**

In the Players endpoints table, add the PUT endpoint:

```
- `PUT /{id}` - Update player profile (name, weight_kg, height_cm) — 409 on duplicate name
```

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with player profile fields and PUT endpoint"
```
