"""Tests for PUT /api/players/{id} endpoint."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from rugby_stats.database import get_db
from rugby_stats.main import app
from rugby_stats.models import Base, Player


@pytest.fixture
def test_db():
    """Create an in-memory SQLite database for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(test_db):
    """Create a FastAPI TestClient with DB dependency override."""

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
    player = Player(name="Juan Perez")
    test_db.add(player)
    test_db.commit()
    test_db.refresh(player)
    return player


def test_update_player_name(client, sample_player):
    """Update just the name, verify 200 and correct name."""
    response = client.put(
        f"/api/players/{sample_player.id}",
        json={"name": "Carlos Lopez"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Carlos Lopez"
    assert data["id"] == sample_player.id


def test_update_player_weight_height(client, sample_player):
    """Update weight and height, verify values returned."""
    response = client.put(
        f"/api/players/{sample_player.id}",
        json={"weight_kg": 95.5, "height_cm": 185.0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["weight_kg"] == 95.5
    assert data["height_cm"] == 185.0
    assert data["name"] == "Juan Perez"


def test_update_player_partial(client, sample_player):
    """Only send weight_kg, verify name stays unchanged and weight updates."""
    response = client.put(
        f"/api/players/{sample_player.id}",
        json={"weight_kg": 100.0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["weight_kg"] == 100.0
    assert data["name"] == "Juan Perez"
    assert data["height_cm"] is None


def test_update_player_not_found(client):
    """Update non-existent player, verify 404."""
    response = client.put(
        "/api/players/9999",
        json={"name": "Nobody"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Player not found"


def test_update_player_duplicate_name(client, test_db):
    """Create two players, try to rename one to the other's name, verify 409."""
    player1 = Player(name="Player One")
    player2 = Player(name="Player Two")
    test_db.add_all([player1, player2])
    test_db.commit()
    test_db.refresh(player1)
    test_db.refresh(player2)

    response = client.put(
        f"/api/players/{player2.id}",
        json={"name": "Player One"},
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_update_player_same_name_allowed(client, sample_player):
    """Update player with its own current name + new weight, verify 200."""
    response = client.put(
        f"/api/players/{sample_player.id}",
        json={"name": "Juan Perez", "weight_kg": 88.0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Juan Perez"
    assert data["weight_kg"] == 88.0
