"""Shared constants for app."""

# Position range constants
FORWARD_POSITION_MIN = 1
FORWARD_POSITION_MAX = 8
BACK_POSITION_MIN = 9
BACK_POSITION_MAX = 15

# The 16 tracked statistics for each player match
STAT_FIELDS: list[str] = [
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

# Human-readable labels for stat fields
STAT_LABELS: dict[str, str] = {
    "tackles_positivos": "Tackles Positivos",
    "tackles": "Tackles Totales",
    "tackles_errados": "Tackles Errados",
    "portador": "Portador",
    "ruck_ofensivos": "Ruck Ofensivos",
    "pases": "Pases",
    "pases_malos": "Pases Malos",
    "perdidas": "Pérdidas",
    "recuperaciones": "Recuperaciones",
    "gana_contacto": "Gana Contacto",
    "quiebres": "Quiebres",
    "penales": "Penales",
    "juego_pie": "Juego Pie",
    "recepcion_aire_buena": "Recep. Aire (B)",
    "recepcion_aire_mala": "Recep. Aire (M)",
    "try_": "Tries",
}

# Default scoring weights per position (1-15).
# Each action maps to {position: weight}.
# Positions: 1=Loosehead Prop, 2=Hooker, 3=Tighthead Prop, 4/5=Locks,
# 6=Blindside Flanker, 7=Openside Flanker, 8=Number 8,
# 9=Scrum-half, 10=Fly-half, 11=Left Wing, 12=Inside Centre,
# 13=Outside Centre, 14=Right Wing, 15=Fullback
DEFAULT_SCORING_WEIGHTS: dict[str, dict[int, float]] = {
    "tackles_positivos": {
        1: 4.5, 2: 4.5, 3: 4.5, 4: 5.0, 5: 5.0,
        6: 5.5, 7: 6.5, 8: 5.0, 9: 3.5, 10: 3.0,
        11: 2.5, 12: 4.0, 13: 3.5, 14: 2.5, 15: 3.0,
    },
    "tackles": {
        1: 2.0, 2: 2.0, 3: 2.0, 4: 2.0, 5: 2.0,
        6: 2.5, 7: 3.0, 8: 2.5, 9: 1.5, 10: 1.5,
        11: 1.0, 12: 2.0, 13: 1.8, 14: 1.0, 15: 1.5,
    },
    "tackles_errados": {
        1: -3.5, 2: -3.5, 3: -3.5, 4: -4.0, 5: -4.0,
        6: -4.5, 7: -5.0, 8: -4.0, 9: -3.0, 10: -3.0,
        11: -2.5, 12: -3.5, 13: -3.0, 14: -2.5, 15: -3.0,
    },
    "portador": {
        1: 1.5, 2: 1.5, 3: 1.5, 4: 1.5, 5: 1.5,
        6: 2.0, 7: 2.0, 8: 2.5, 9: 1.0, 10: 1.5,
        11: 2.0, 12: 2.0, 13: 2.0, 14: 2.0, 15: 1.5,
    },
    "ruck_ofensivos": {
        1: 3.0, 2: 2.5, 3: 3.0, 4: 3.0, 5: 3.0,
        6: 2.5, 7: 2.5, 8: 2.5, 9: 0.5, 10: 0.5,
        11: 0.5, 12: 1.0, 13: 0.5, 14: 0.5, 15: 0.5,
    },
    "pases": {
        1: 0.3, 2: 0.5, 3: 0.3, 4: 0.3, 5: 0.3,
        6: 0.5, 7: 0.5, 8: 0.8, 9: 2.0, 10: 1.8,
        11: 1.0, 12: 1.2, 13: 1.2, 14: 1.0, 15: 1.0,
    },
    "pases_malos": {
        1: -1.5, 2: -2.0, 3: -1.5, 4: -1.5, 5: -1.5,
        6: -2.0, 7: -2.0, 8: -2.5, 9: -5.0, 10: -4.5,
        11: -3.5, 12: -4.0, 13: -4.0, 14: -3.5, 15: -3.5,
    },
    "perdidas": {
        1: -3.5, 2: -3.5, 3: -3.5, 4: -4.0, 5: -4.0,
        6: -4.0, 7: -4.0, 8: -4.5, 9: -4.5, 10: -5.0,
        11: -5.0, 12: -5.0, 13: -5.0, 14: -5.0, 15: -4.5,
    },
    "recuperaciones": {
        1: 4.5, 2: 5.0, 3: 4.5, 4: 5.0, 5: 5.0,
        6: 5.5, 7: 6.5, 8: 5.5, 9: 4.0, 10: 3.5,
        11: 3.5, 12: 4.0, 13: 4.0, 14: 3.5, 15: 4.0,
    },
    "gana_contacto": {
        1: 3.0, 2: 3.0, 3: 3.0, 4: 3.0, 5: 3.0,
        6: 3.5, 7: 3.5, 8: 4.0, 9: 3.0, 10: 3.5,
        11: 4.0, 12: 4.5, 13: 4.5, 14: 4.0, 15: 3.5,
    },
    "quiebres": {
        1: 3.0, 2: 3.5, 3: 3.0, 4: 3.5, 5: 3.5,
        6: 4.5, 7: 4.5, 8: 5.0, 9: 5.5, 10: 6.0,
        11: 7.5, 12: 6.5, 13: 7.0, 14: 7.5, 15: 6.0,
    },
    "penales": {
        1: -5.5, 2: -5.0, 3: -5.5, 4: -5.0, 5: -5.0,
        6: -5.0, 7: -6.0, 8: -5.0, 9: -4.0, 10: -4.0,
        11: -3.5, 12: -4.0, 13: -4.0, 14: -3.5, 15: -4.0,
    },
    "juego_pie": {
        1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5,
        6: 0.8, 7: 0.8, 8: 1.5, 9: 2.5, 10: 4.0,
        11: 2.0, 12: 2.0, 13: 2.0, 14: 2.0, 15: 3.5,
    },
    "recepcion_aire_buena": {
        1: 2.0, 2: 2.5, 3: 2.0, 4: 4.0, 5: 4.0,
        6: 3.0, 7: 3.0, 8: 3.5, 9: 3.0, 10: 4.0,
        11: 4.5, 12: 3.5, 13: 3.5, 14: 4.5, 15: 5.5,
    },
    "recepcion_aire_mala": {
        1: -2.0, 2: -2.5, 3: -2.0, 4: -3.5, 5: -3.5,
        6: -3.0, 7: -3.0, 8: -3.0, 9: -3.0, 10: -3.5,
        11: -4.0, 12: -3.5, 13: -3.5, 14: -4.0, 15: -5.0,
    },
    "try_": {
        1: 8.0, 2: 8.5, 3: 8.0, 4: 9.0, 5: 9.0,
        6: 9.5, 7: 10.0, 8: 10.0, 9: 10.0, 10: 10.5,
        11: 12.0, 12: 11.0, 13: 11.0, 14: 12.0, 15: 10.5,
    },
}

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
