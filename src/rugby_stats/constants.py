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
