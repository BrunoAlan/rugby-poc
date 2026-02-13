"""Tests for position group configuration."""

from app.constants import POSITION_GROUPS, get_group_for_position


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
