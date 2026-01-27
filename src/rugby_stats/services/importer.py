"""Excel data importer service."""

from datetime import date, datetime
from pathlib import Path
from uuid import uuid4

import pandas as pd
from sqlalchemy.orm import Session

from rugby_stats.models import Match, Player, PlayerMatchStats
from rugby_stats.services.ai_analysis import AIAnalysisService


# Column mapping from Excel to model fields
COLUMN_MAPPING = {
    "Puesto": "puesto",
    "Jugador": "jugador",
    "Tiempo de Juego": "tiempo_juego",
    "Tackles Positivos": "tackles_positivos",
    "Tackles": "tackles",
    "Tackles Errados": "tackles_errados",
    "Portador": "portador",
    "Ruck Ofensivos": "ruck_ofensivos",
    "Pases": "pases",
    "Pases Malos": "pases_malos",
    "Perdidas": "perdidas",
    "Recuperaciones": "recuperaciones",
    "Gana Contacto": "gana_contacto",
    "Quiebres": "quiebres",
    "Penales": "penales",
    "Juego con el pie": "juego_pie",
    "Recepción Aire Buena": "recepcion_aire_buena",
    "Recepcion Aire Mala": "recepcion_aire_mala",
    "Try": "try_",
}


class ExcelImporter:
    """Service for importing rugby data from Excel files."""

    def __init__(self, db: Session):
        self.db = db
        self.import_batch_id = uuid4()
        self._created_matches: list[Match] = []

    def import_file(
        self,
        file_path: str | Path,
        generate_ai_analysis: bool = False,
        queue_ai_analysis: bool = False,
    ) -> dict:
        """
        Import all sheets from an Excel file.

        Each sheet represents one match against an opponent.
        Sheet name = opponent name (BARC, Alumni, Newman, CUBA, San Martin).

        Args:
            file_path: Path to the Excel file
            generate_ai_analysis: Whether to generate AI analysis for each match (synchronous)
            queue_ai_analysis: Whether to queue AI analysis for background generation

        Returns:
            Dictionary with import statistics
        """
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Reset created matches list
        self._created_matches = []

        # Read all sheets
        excel_file = pd.ExcelFile(file_path)
        sheet_names = excel_file.sheet_names

        stats = {
            "players_created": 0,
            "matches_created": 0,
            "stats_created": 0,
            "sheets_processed": [],
            "ai_analysis_generated": 0,
            "ai_analysis_errors": 0,
            "ai_analysis_queued": 0,
        }

        for sheet_name in sheet_names:
            sheet_stats = self._import_sheet(excel_file, sheet_name)
            stats["players_created"] += sheet_stats["players_created"]
            stats["matches_created"] += sheet_stats["matches_created"]
            stats["stats_created"] += sheet_stats["stats_created"]
            stats["sheets_processed"].append(sheet_name)

        self.db.commit()

        # Generate AI analysis if requested (synchronous)
        if generate_ai_analysis:
            ai_stats = self._generate_ai_analysis_for_matches()
            stats["ai_analysis_generated"] = ai_stats["generated"]
            stats["ai_analysis_errors"] = ai_stats["errors"]
        # Queue AI analysis for background generation
        elif queue_ai_analysis:
            for match in self._created_matches:
                match.ai_analysis_status = "pending"
            self.db.commit()
            stats["ai_analysis_queued"] = len(self._created_matches)

        return stats

    def get_created_match_ids(self) -> list[int]:
        """Return IDs of matches created during import."""
        return [match.id for match in self._created_matches]

    def _generate_ai_analysis_for_matches(self) -> dict:
        """Generate AI analysis for all created matches."""
        ai_service = AIAnalysisService(self.db)
        generated = 0
        errors = 0

        for match in self._created_matches:
            # Refresh the match to get player_stats relationship
            self.db.refresh(match)
            ai_service.analyze_and_save(match)

            if match.ai_analysis:
                generated += 1
            elif match.ai_analysis_error:
                errors += 1

        self.db.commit()
        return {"generated": generated, "errors": errors}

    def _import_sheet(self, excel_file: pd.ExcelFile, sheet_name: str) -> dict:
        """Import a single sheet as one match against an opponent."""
        df = pd.read_excel(excel_file, sheet_name=sheet_name)

        # Rename columns using mapping
        df = df.rename(columns=COLUMN_MAPPING)

        stats = {
            "players_created": 0,
            "matches_created": 0,
            "stats_created": 0,
        }

        # Extract match metadata from special rows
        metadata = self._extract_match_metadata(df)

        # Validate team is present
        team = metadata.get("team")
        if not team:
            raise ValueError(f"Hoja '{sheet_name}' no tiene fila 'Equipo' definida")

        # Create match for this sheet (sheet_name = opponent)
        match = Match(
            opponent_name=sheet_name,
            team=team,
            source_sheet=sheet_name,
            import_batch_id=self.import_batch_id,
            match_date=metadata.get("match_date"),
            location=metadata.get("location"),
            result=metadata.get("result"),
            our_score=metadata.get("our_score"),
            opponent_score=metadata.get("opponent_score"),
        )
        self.db.add(match)
        self.db.flush()
        stats["matches_created"] = 1
        self._created_matches.append(match)

        # Import each row as player stats
        for _, row in df.iterrows():
            jugador = row.get("jugador")
            puesto = row.get("puesto")

            # Skip rows without a valid player name (must be a non-empty string)
            if pd.isna(jugador):
                continue
            if not isinstance(jugador, str):
                continue
            jugador = jugador.strip()
            if not jugador:
                continue

            # Skip rows where puesto is not a valid player position (1-15)
            # This filters out metadata rows where puesto contains labels like "Fecha", "Cancha", etc.
            puesto_int = self._safe_int(puesto)
            if puesto_int < 1 or puesto_int > 15:
                continue

            # Get or create player (unique by name across all matches)
            player = self._get_or_create_player(jugador)
            if player.id is None:
                self.db.flush()
                stats["players_created"] += 1

            # Create player match stats
            player_stats = self._create_player_stats(player.id, match.id, row)
            self.db.add(player_stats)
            stats["stats_created"] += 1

        return stats

    def _get_or_create_player(self, name: str) -> Player:
        """Get existing player or create new one."""
        player = self.db.query(Player).filter(Player.name == name).first()
        if player is None:
            player = Player(name=name)
            self.db.add(player)
        return player

    def _create_player_stats(
        self, player_id: int, match_id: int, row: pd.Series
    ) -> PlayerMatchStats:
        """Create player match statistics from Excel row."""
        return PlayerMatchStats(
            player_id=player_id,
            match_id=match_id,
            puesto=self._safe_int(row.get("puesto")),
            tiempo_juego=float(row.get("tiempo_juego", 80.0))
            if pd.notna(row.get("tiempo_juego"))
            else 80.0,
            tackles_positivos=self._safe_int(row.get("tackles_positivos")),
            tackles=self._safe_int(row.get("tackles")),
            tackles_errados=self._safe_int(row.get("tackles_errados")),
            portador=self._safe_int(row.get("portador")),
            ruck_ofensivos=self._safe_int(row.get("ruck_ofensivos")),
            pases=self._safe_int(row.get("pases")),
            pases_malos=self._safe_int(row.get("pases_malos")),
            perdidas=self._safe_int(row.get("perdidas")),
            recuperaciones=self._safe_int(row.get("recuperaciones")),
            gana_contacto=self._safe_int(row.get("gana_contacto")),
            quiebres=self._safe_int(row.get("quiebres")),
            penales=self._safe_int(row.get("penales")),
            juego_pie=self._safe_int(row.get("juego_pie")),
            recepcion_aire_buena=self._safe_int(row.get("recepcion_aire_buena")),
            recepcion_aire_mala=self._safe_int(row.get("recepcion_aire_mala")),
            try_=self._safe_int(row.get("try_")),
        )

    @staticmethod
    def _safe_int(value) -> int:
        """Safely convert value to int, defaulting to 0."""
        if pd.isna(value):
            return 0
        try:
            return int(value)
        except (ValueError, TypeError):
            return 0

    def _extract_match_metadata(self, df: pd.DataFrame) -> dict:
        """Extract match metadata from special rows where puesto contains labels."""
        metadata: dict = {}

        for _, row in df.iterrows():
            puesto_val = row.get("puesto")
            jugador_val = row.get("jugador")

            if not isinstance(puesto_val, str):
                continue

            puesto_lower = puesto_val.strip().lower()

            if puesto_lower == "fecha":
                metadata["match_date"] = self._parse_date(jugador_val)
            elif puesto_lower == "cancha":
                metadata["location"] = (
                    str(jugador_val).strip() if pd.notna(jugador_val) else None
                )
            elif puesto_lower == "resultado":
                metadata["result"] = (
                    str(jugador_val).strip() if pd.notna(jugador_val) else None
                )
            elif puesto_lower == "tanteador":
                our_score, opponent_score = self._parse_score(jugador_val)
                metadata["our_score"] = our_score
                metadata["opponent_score"] = opponent_score
            elif puesto_lower == "equipo":
                metadata["team"] = (
                    str(jugador_val).strip() if pd.notna(jugador_val) else None
                )

        return metadata

    @staticmethod
    def _parse_date(value) -> date | None:
        """Parse date from various formats."""
        if pd.isna(value):
            return None

        # If it's already a datetime/date object
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value

        # Try to parse string formats
        if isinstance(value, str):
            value = value.strip()
            for fmt in ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"]:
                try:
                    return datetime.strptime(value, fmt).date()
                except ValueError:
                    continue

        return None

    @staticmethod
    def _parse_score(value) -> tuple[int | None, int | None]:
        """Parse score from format 'X - Y' or 'X-Y'."""
        if pd.isna(value):
            return None, None

        value_str = str(value).strip()

        # Try to split by ' - ' or '-'
        for separator in [" - ", "-"]:
            if separator in value_str:
                parts = value_str.split(separator)
                if len(parts) == 2:
                    try:
                        our_score = int(parts[0].strip())
                        opponent_score = int(parts[1].strip())
                        return our_score, opponent_score
                    except ValueError:
                        continue

        return None, None
