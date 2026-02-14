"""Anomaly detection service for player statistics."""

from statistics import median

from sqlalchemy.orm import Session

from app.models import Match, Player, PlayerMatchStats

# Stats grouped by volatility category with their thresholds
STAT_THRESHOLDS: dict[str, int] = {
    # Consistent stats — 25% threshold
    "tackles": 25,
    "tackles_positivos": 25,
    "tackles_errados": 25,
    "ruck_ofensivos": 25,
    "pases": 25,
    # Moderate stats — 30% threshold
    "portador": 30,
    "gana_contacto": 30,
    "recuperaciones": 30,
    "perdidas": 30,
    "pases_malos": 30,
    # Volatile stats — 50% threshold
    "try_": 50,
    "quiebres": 50,
    "penales": 50,
    "juego_pie": 50,
    "recepcion_aire_buena": 50,
    "recepcion_aire_mala": 50,
}

# Stats where an increase is bad (inverted alert logic)
NEGATIVE_STATS = {
    "tackles_errados",
    "pases_malos",
    "perdidas",
    "penales",
    "recepcion_aire_mala",
}

# Number of recent matches to use for "recent" mode
RECENT_WINDOW = 5


class AnomalyDetectionService:
    """Detects anomalies in player stats by comparing the last match to historical medians."""

    def __init__(self, db: Session):
        self.db = db

    def detect_anomalies(self, player_id: int, mode: str = "all") -> dict[str, dict]:
        """
        Detect stat anomalies for a player's last match.

        Args:
            player_id: The player's database ID
            mode: "all" for full history median, "recent" for last N matches

        Returns:
            Dict keyed by stat name, each containing:
                median_all, median_recent, last_value, deviation_pct, alert, threshold
            Empty dict if player not found or has fewer than 2 matches.
        """
        player = self.db.query(Player).filter(Player.id == player_id).first()
        if not player:
            return {}

        # Get all match stats ordered by match date
        all_stats = (
            self.db.query(PlayerMatchStats)
            .filter(PlayerMatchStats.player_id == player_id)
            .join(Match, PlayerMatchStats.match_id == Match.id)
            .order_by(Match.match_date.asc())
            .all()
        )

        if len(all_stats) < 2:
            return {}

        last_stat = all_stats[-1]
        history = all_stats[:-1]  # everything except last match

        result = {}
        for stat_name, threshold in STAT_THRESHOLDS.items():
            history_values = [getattr(s, stat_name, 0) or 0 for s in history]
            last_value = getattr(last_stat, stat_name, 0) or 0

            # Calculate median for all history
            median_all = median(history_values) if history_values else 0.0

            # Calculate median for recent matches (last N of history)
            recent_history = (
                history[-RECENT_WINDOW:] if len(history) >= RECENT_WINDOW else history
            )
            recent_values = [getattr(s, stat_name, 0) or 0 for s in recent_history]
            median_recent = median(recent_values) if recent_values else 0.0

            # Pick which median to compare against based on mode
            comparison_median = median_recent if mode == "recent" else median_all

            # Calculate deviation percentage
            if comparison_median == 0:
                if last_value > 0:
                    deviation_pct = 100.0
                else:
                    deviation_pct = 0.0
            else:
                deviation_pct = (
                    (last_value - comparison_median) / comparison_median
                ) * 100

            # Determine alert
            alert = None
            abs_deviation = abs(deviation_pct)
            if abs_deviation >= threshold:
                if stat_name in NEGATIVE_STATS:
                    alert = "negative" if deviation_pct > 0 else "positive"
                else:
                    alert = "positive" if deviation_pct > 0 else "negative"

            result[stat_name] = {
                "median_all": median_all,
                "median_recent": median_recent,
                "last_value": last_value,
                "deviation_pct": round(deviation_pct, 1),
                "alert": alert,
                "threshold": threshold,
            }

        return result
