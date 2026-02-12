"""Shared constants for rugby_stats."""

POSITION_NAMES: dict[int, str] = {
    1: "Pilar Izq.",
    2: "Hooker",
    3: "Pilar Der.",
    4: "2da Linea",
    5: "2da Linea",
    6: "Ala",
    7: "Ala",
    8: "N°8",
    9: "Medio Scrum",
    10: "Apertura",
    11: "Wing",
    12: "Centro",
    13: "Centro",
    14: "Wing",
    15: "Fullback",
}


def get_position_label(position: int) -> str:
    """Return a label like '9 - Medio Scrum' for a position number."""
    return f"{position} - {POSITION_NAMES.get(position, 'Desconocido')}"
