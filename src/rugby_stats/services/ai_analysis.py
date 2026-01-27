"""AI Analysis service for generating match analysis using OpenRouter."""

from datetime import datetime

import httpx
from sqlalchemy.orm import Session

from rugby_stats.config import get_settings
from rugby_stats.models import Match, PlayerMatchStats, ScoringConfiguration


SYSTEM_PROMPT = """Sos un analista experto de rugby argentino. Tu tarea es analizar partidos y rendimientos de jugadores usando datos estadísticos.

IMPORTANTE:
- Escribí en español rioplatense (Argentina)
- Usá vocabulario de rugby local: tries, tackles, line, scrum, forwards, backs
- Sé conciso pero perspicaz
- Destacá tanto lo positivo como lo que se puede mejorar

Generá tu análisis con las siguientes secciones usando markdown:

## Resumen General
Un párrafo corto sobre el resultado y la impresión general del partido.

## Puntos Fuertes
Lista con lo que hizo bien el equipo (2-4 puntos).

## Áreas a Mejorar
Lista con lo que se debe trabajar (2-4 puntos).

## Jugadores Destacados
Mencioná 2-3 jugadores que brillaron y explicá brevemente por qué.

## Recomendaciones
1-2 sugerencias concretas para el próximo partido."""


class AIAnalysisService:
    """Service for generating AI-powered match analysis."""

    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
    TIMEOUT = 60.0  # 60 seconds timeout

    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()

    def generate_match_analysis(
        self,
        match: Match,
        player_stats: list[PlayerMatchStats],
        scoring_config: ScoringConfiguration | None = None,
    ) -> str:
        """
        Generate AI analysis for a match.

        Args:
            match: The match to analyze
            player_stats: List of player statistics for the match
            scoring_config: Optional scoring configuration for context

        Returns:
            The generated analysis text

        Raises:
            ValueError: If AI analysis is not configured
            httpx.HTTPError: If the API call fails
        """
        if not self.settings.can_generate_ai_analysis:
            raise ValueError("AI analysis is not configured. Set OPENROUTER_API_KEY in .env")

        prompt = self._build_analysis_prompt(match, player_stats, scoring_config)
        return self._call_openrouter(prompt)

    def _call_openrouter(self, user_prompt: str) -> str:
        """
        Call OpenRouter API to generate analysis.

        Args:
            user_prompt: The user prompt with match data

        Returns:
            The generated analysis text

        Raises:
            httpx.HTTPError: If the API call fails
        """
        headers = {
            "Authorization": f"Bearer {self.settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://rugby-stats.local",
            "X-Title": "Rugby Stats Analyzer",
        }

        payload = {
            "model": self.settings.openrouter_model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.7,
            "max_tokens": 1500,
        }

        with httpx.Client(timeout=self.TIMEOUT) as client:
            response = client.post(self.OPENROUTER_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        # Extract the generated text
        choices = data.get("choices", [])
        if not choices:
            raise ValueError("No response from AI model")

        return choices[0]["message"]["content"]

    def _build_analysis_prompt(
        self,
        match: Match,
        player_stats: list[PlayerMatchStats],
        scoring_config: ScoringConfiguration | None = None,
    ) -> str:
        """
        Build the analysis prompt with match and player data.

        Args:
            match: The match to analyze
            player_stats: List of player statistics for the match
            scoring_config: Optional scoring configuration for context

        Returns:
            The formatted prompt string
        """
        # Match info
        match_date = match.match_date.strftime("%d/%m/%Y") if match.match_date else "Fecha desconocida"
        location = match.location or "Desconocido"
        result = match.result or "Desconocido"
        score = f"{match.our_score} - {match.opponent_score}" if match.our_score is not None else "Sin marcador"

        prompt_lines = [
            "# Datos del Partido",
            f"- **Rival:** {match.opponent_name}",
            f"- **Fecha:** {match_date}",
            f"- **Ubicación:** {location}",
            f"- **Resultado:** {result}",
            f"- **Marcador:** {score}",
            "",
        ]

        # Separate forwards and backs
        forwards = [s for s in player_stats if s.puesto and 1 <= s.puesto <= 8]
        backs = [s for s in player_stats if s.puesto and 9 <= s.puesto <= 15]

        # Forwards stats
        if forwards:
            prompt_lines.append("## Estadísticas de Forwards (1-8)")
            prompt_lines.append("")
            for stat in sorted(forwards, key=lambda x: x.puesto or 0):
                prompt_lines.append(self._format_player_stats(stat))
            prompt_lines.append("")

        # Backs stats
        if backs:
            prompt_lines.append("## Estadísticas de Backs (9-15)")
            prompt_lines.append("")
            for stat in sorted(backs, key=lambda x: x.puesto or 0):
                prompt_lines.append(self._format_player_stats(stat))
            prompt_lines.append("")

        # Team totals
        if player_stats:
            prompt_lines.append("## Totales del Equipo")
            prompt_lines.append(self._format_team_totals(player_stats))
            prompt_lines.append("")

        prompt_lines.append("Analizá estos datos y generá un informe completo del partido.")

        return "\n".join(prompt_lines)

    def _format_player_stats(self, stat: PlayerMatchStats) -> str:
        """Format a player's statistics as a string."""
        player_name = stat.player.name if stat.player else "Desconocido"
        score = f"{stat.puntuacion_final:.1f}" if stat.puntuacion_final else "N/A"

        return (
            f"**{player_name}** (#{stat.puesto}, {stat.tiempo_juego:.0f} min, Score: {score}): "
            f"Tackles+ {stat.tackles_positivos}, Tackles {stat.tackles}, Tackles err {stat.tackles_errados}, "
            f"Portador {stat.portador}, Rucks {stat.ruck_ofensivos}, Pases {stat.pases}, "
            f"Pases malos {stat.pases_malos}, Perdidas {stat.perdidas}, Recup {stat.recuperaciones}, "
            f"Gana contacto {stat.gana_contacto}, Quiebres {stat.quiebres}, Penales {stat.penales}, "
            f"Juego pie {stat.juego_pie}, Aire buena {stat.recepcion_aire_buena}, "
            f"Aire mala {stat.recepcion_aire_mala}, Tries {stat.try_}"
        )

    def _format_team_totals(self, player_stats: list[PlayerMatchStats]) -> str:
        """Calculate and format team totals."""
        totals = {
            "tackles_positivos": 0,
            "tackles": 0,
            "tackles_errados": 0,
            "portador": 0,
            "ruck_ofensivos": 0,
            "pases": 0,
            "pases_malos": 0,
            "perdidas": 0,
            "recuperaciones": 0,
            "gana_contacto": 0,
            "quiebres": 0,
            "penales": 0,
            "juego_pie": 0,
            "recepcion_aire_buena": 0,
            "recepcion_aire_mala": 0,
            "try_": 0,
        }

        for stat in player_stats:
            for field in totals:
                totals[field] += getattr(stat, field, 0) or 0

        return (
            f"Tackles+ {totals['tackles_positivos']}, Tackles {totals['tackles']}, "
            f"Tackles err {totals['tackles_errados']}, Portador {totals['portador']}, "
            f"Rucks {totals['ruck_ofensivos']}, Pases {totals['pases']}, "
            f"Pases malos {totals['pases_malos']}, Perdidas {totals['perdidas']}, "
            f"Recup {totals['recuperaciones']}, Gana contacto {totals['gana_contacto']}, "
            f"Quiebres {totals['quiebres']}, Penales {totals['penales']}, "
            f"Juego pie {totals['juego_pie']}, Aire buena {totals['recepcion_aire_buena']}, "
            f"Aire mala {totals['recepcion_aire_mala']}, Tries {totals['try_']}"
        )

    def analyze_and_save(self, match: Match) -> None:
        """
        Generate and save AI analysis for a match.

        Args:
            match: The match to analyze. Player stats must be already loaded.

        This method handles errors gracefully, storing the error in the match record
        rather than raising exceptions.
        """
        try:
            if not self.settings.can_generate_ai_analysis:
                return

            player_stats = match.player_stats
            if not player_stats:
                match.ai_analysis_error = "No player stats available for analysis"
                match.ai_analysis_generated_at = datetime.utcnow()
                return

            analysis = self.generate_match_analysis(match, player_stats)
            match.ai_analysis = analysis
            match.ai_analysis_generated_at = datetime.utcnow()
            match.ai_analysis_error = None

        except httpx.HTTPStatusError as e:
            match.ai_analysis_error = f"API error: {e.response.status_code}"
            match.ai_analysis_generated_at = datetime.utcnow()
        except httpx.TimeoutException:
            match.ai_analysis_error = "API timeout (>60s)"
            match.ai_analysis_generated_at = datetime.utcnow()
        except Exception as e:
            error_msg = str(e)[:500] if str(e) else "Unknown error"
            match.ai_analysis_error = error_msg
            match.ai_analysis_generated_at = datetime.utcnow()
