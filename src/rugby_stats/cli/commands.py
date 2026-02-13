"""CLI commands for rugby statistics."""

from pathlib import Path

import typer
from alembic import command
from alembic.config import Config
from rich.console import Console
from rich.table import Table
from sqlalchemy import text

from rugby_stats.database import SessionLocal, engine
from rugby_stats.models import Base
from rugby_stats.services.importer import ExcelImporter
from rugby_stats.services.scoring import ScoringService

app = typer.Typer(
    name="rugby",
    help="Rugby Statistics CLI",
    no_args_is_help=True,
)

console = Console()

ANALYSIS_PREVIEW_LENGTH = 500


# ---------------------------------------------------------------------------
# Helpers for import_excel
# ---------------------------------------------------------------------------


def _validate_file_exists(file_path: Path) -> None:
    if not file_path.exists():
        console.print(f"[red]Error: File not found: {file_path}[/red]")
        raise typer.Exit(1)


def _print_import_stats(stats: dict, ai: bool) -> None:
    console.print("[green]Import completed successfully![/green]")
    console.print(f"  Players created: {stats['players_created']}")
    console.print(f"  Matches created: {stats['matches_created']}")
    console.print(f"  Stats records created: {stats['stats_created']}")
    console.print(f"  Opponents: {', '.join(stats['sheets_processed'])}")
    if ai:
        console.print(f"  AI analysis generated: {stats.get('ai_analysis_generated', 0)}")
        if stats.get('ai_analysis_errors', 0) > 0:
            console.print(f"  [yellow]AI analysis errors: {stats['ai_analysis_errors']}[/yellow]")


# ---------------------------------------------------------------------------
# Helpers for show_rankings
# ---------------------------------------------------------------------------


def _create_aggregated_table(rankings: list[dict]) -> Table:
    table = Table(title="Player Rankings (Promedio - min 20 min/partido)")
    table.add_column("Rank", justify="right", style="cyan")
    table.add_column("Player", style="white")
    table.add_column("Matches", justify="right", style="blue")
    table.add_column("Avg Score", justify="right", style="green")

    for r in rankings:
        table.add_row(
            str(r["rank"]),
            r["player_name"],
            str(r["matches_played"]),
            f"{r['puntuacion_final']:.2f}",
        )

    return table


def _create_match_table(rankings: list[dict]) -> Table:
    table = Table(title="Player Rankings (Por Partido)")
    table.add_column("Rank", justify="right", style="cyan")
    table.add_column("Player", style="white")
    table.add_column("Opponent", style="blue")
    table.add_column("Position", justify="right")
    table.add_column("Minutes", justify="right")
    table.add_column("Score Abs", justify="right")
    table.add_column("Score Final", justify="right", style="green")

    for r in rankings:
        table.add_row(
            str(r["rank"]),
            r["player_name"],
            r["opponent"] or "-",
            str(r["puesto"]) if r["puesto"] else "-",
            f"{r['tiempo_juego']:.0f}" if r["tiempo_juego"] else "-",
            f"{r['score_absoluto']:.2f}" if r["score_absoluto"] else "-",
            f"{r['puntuacion_final']:.2f}",
        )

    return table


# ---------------------------------------------------------------------------
# Helpers for reset_db
# ---------------------------------------------------------------------------


def _confirm_reset(force: bool) -> None:
    if force:
        return
    confirm = typer.confirm(
        "[yellow]¿Estás seguro? Esto eliminará TODOS los datos de la base de datos.[/yellow]",
        default=False,
    )
    if not confirm:
        console.print("[blue]Operación cancelada.[/blue]")
        raise typer.Exit(0)


def _drop_all_tables() -> None:
    console.print("[blue]Eliminando todas las tablas...[/blue]")
    Base.metadata.drop_all(bind=engine)
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        conn.commit()
    console.print("[green]Tablas eliminadas correctamente.[/green]")


def _run_migrations() -> None:
    console.print("[blue]Ejecutando migraciones...[/blue]")
    alembic_ini = Path(__file__).parent.parent.parent.parent / "alembic.ini"
    if not alembic_ini.exists():
        console.print(f"[red]Error: No se encontró alembic.ini en {alembic_ini}[/red]")
        raise typer.Exit(1)
    alembic_cfg = Config(str(alembic_ini))
    command.upgrade(alembic_cfg, "head")
    console.print("[green]Migraciones aplicadas correctamente.[/green]")


def _seed_default_weights() -> None:
    console.print("[blue]Seeding pesos por defecto...[/blue]")
    with SessionLocal() as db:
        scoring_service = ScoringService(db)
        config = scoring_service.seed_default_weights()
        console.print(f"[green]Configuración de scoring creada: {config.name}[/green]")


# ---------------------------------------------------------------------------
# Helpers for list_matches
# ---------------------------------------------------------------------------


def _create_matches_table(matches: list) -> Table:
    table = Table(title="Matches")
    table.add_column("ID", justify="right", style="cyan")
    table.add_column("Opponent", style="white")
    table.add_column("Date", style="blue")
    table.add_column("Location", style="magenta")
    table.add_column("Result", style="yellow")
    table.add_column("Score", justify="center")
    table.add_column("Players", justify="right")

    for match in matches:
        date_str = str(match.match_date) if match.match_date else "-"
        location_str = match.location if match.location else "-"
        result_str = match.result if match.result else "-"
        if match.our_score is not None and match.opponent_score is not None:
            score_str = f"{match.our_score} - {match.opponent_score}"
        else:
            score_str = "-"
        table.add_row(
            str(match.id),
            match.opponent_name,
            date_str,
            location_str,
            result_str,
            score_str,
            str(len(match.player_stats)),
        )

    return table


# ---------------------------------------------------------------------------
# Helpers for regenerate_analysis
# ---------------------------------------------------------------------------


def _print_analysis_result(match) -> None:
    if match.ai_analysis:
        console.print("[green]AI analysis generated successfully![/green]")
        console.print("\n[bold]Analysis Preview:[/bold]")
        preview = match.ai_analysis[:ANALYSIS_PREVIEW_LENGTH]
        if len(match.ai_analysis) > ANALYSIS_PREVIEW_LENGTH:
            preview += "..."
        console.print(preview)
    elif match.ai_analysis_error:
        console.print(f"[red]Error generating analysis: {match.ai_analysis_error}[/red]")
    else:
        console.print("[yellow]No analysis generated (AI may not be configured)[/yellow]")


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------


@app.command()
def import_excel(
    file_path: Path = typer.Argument(..., help="Path to the Excel file to import"),
    recalculate: bool = typer.Option(
        True, "--recalculate/--no-recalculate", help="Recalculate scores after import"
    ),
    ai: bool = typer.Option(
        False, "--ai/--no-ai", help="Generate AI analysis for each match"
    ),
):
    """Import rugby data from an Excel file."""
    _validate_file_exists(file_path)

    with SessionLocal() as db:
        scoring_service = ScoringService(db)
        scoring_service.seed_default_weights()

        console.print(f"[blue]Importing data from {file_path}...[/blue]")
        importer = ExcelImporter(db)
        try:
            stats = importer.import_file(file_path, generate_ai_analysis=ai)
        except Exception as e:
            console.print(f"[red]Error importing file: {e}[/red]")
            raise typer.Exit(1)

        _print_import_stats(stats, ai)

        if recalculate:
            console.print("\n[blue]Recalculating scores...[/blue]")
            try:
                count = scoring_service.recalculate_all_scores()
                console.print(f"[green]Recalculated scores for {count} player stats[/green]")
            except ValueError as e:
                console.print(f"[yellow]Warning: Could not recalculate scores: {e}[/yellow]")


@app.command()
def recalculate_scores():
    """Recalculate all player scores using the active scoring configuration."""
    with SessionLocal() as db:
        scoring_service = ScoringService(db)
        try:
            count = scoring_service.recalculate_all_scores()
            console.print(f"[green]Recalculated scores for {count} player stats[/green]")
        except ValueError as e:
            console.print(f"[red]Error: {e}[/red]")
            raise typer.Exit(1)


@app.command()
def show_rankings(
    match_id: int | None = typer.Option(None, "--match", "-m", help="Filter by match ID (shows per-match stats)"),
    opponent: str | None = typer.Option(None, "--opponent", "-o", help="Filter by opponent name"),
    position: str | None = typer.Option(
        None, "--position", "-p", help="Filter by position type: 'forwards' or 'backs'"
    ),
    limit: int = typer.Option(20, "--limit", "-n", help="Number of results to show"),
):
    """Show player rankings by puntuacion_final.

    Without --match: shows aggregated rankings (avg score, min 20 min per match).
    With --match: shows individual match rankings.
    """
    with SessionLocal() as db:
        scoring_service = ScoringService(db)
        rankings = scoring_service.get_rankings(
            match_id=match_id, opponent=opponent, position_type=position, limit=limit
        )

        if not rankings:
            console.print("[yellow]No rankings found. Have you imported data and calculated scores?[/yellow]")
            return

        is_aggregated = rankings[0].get("matches_played") is not None
        if is_aggregated:
            table = _create_aggregated_table(rankings)
        else:
            table = _create_match_table(rankings)

        console.print(table)


@app.command()
def player_summary(
    player_name: str = typer.Argument(..., help="Player name to get summary for"),
):
    """Show a player's performance summary across all matches."""
    with SessionLocal() as db:
        scoring_service = ScoringService(db)
        summary = scoring_service.get_player_summary(player_name)

        if summary is None:
            console.print(f"[yellow]Player '{player_name}' not found[/yellow]")
            return

        console.print(f"\n[bold]Player: {summary['player_name']}[/bold]")
        console.print(f"Matches played: {summary['matches_played']}")

        if summary['matches_played'] > 0:
            console.print(f"Total minutes: {summary.get('total_minutes', 0):.1f}")
            console.print(f"Average score: {summary.get('avg_puntuacion_final', 0):.2f}")

            if summary.get('matches'):
                table = Table(title="Match Details")
                table.add_column("Opponent", style="blue")
                table.add_column("Position", justify="right")
                table.add_column("Minutes", justify="right")
                table.add_column("Score", justify="right", style="green")

                for m in summary['matches']:
                    score = f"{m['puntuacion_final']:.2f}" if m['puntuacion_final'] else "-"
                    table.add_row(
                        m['opponent'],
                        str(m['puesto']),
                        f"{m['tiempo_juego']:.0f}",
                        score,
                    )

                console.print(table)


@app.command()
def seed_weights(
    force: bool = typer.Option(False, "--force", "-f", help="Delete existing default config and re-seed"),
):
    """Seed the default scoring weights into the database."""
    with SessionLocal() as db:
        scoring_service = ScoringService(db)
        config = scoring_service.seed_default_weights(force=force)
        if force:
            console.print(f"[green]Default scoring configuration re-seeded: {config.name}[/green]")
        else:
            console.print(f"[green]Default scoring configuration created/verified: {config.name}[/green]")


@app.command()
def reset_db(
    force: bool = typer.Option(False, "--force", "-f", help="Omitir confirmación"),
    seed: bool = typer.Option(True, "--seed-weights/--no-seed-weights", help="Seedear pesos por defecto"),
):
    """Resetear la base de datos eliminando todas las tablas y re-ejecutando migraciones."""
    _confirm_reset(force)
    _drop_all_tables()
    _run_migrations()

    if seed:
        _seed_default_weights()

    console.print("\n[bold green]Base de datos reseteada exitosamente![/bold green]")


@app.command()
def list_players():
    """List all players in the database."""
    with SessionLocal() as db:
        from rugby_stats.models import Player

        players = db.query(Player).all()

        if not players:
            console.print("[yellow]No players found. Have you imported data?[/yellow]")
            return

        table = Table(title="Players")
        table.add_column("ID", justify="right", style="cyan")
        table.add_column("Name", style="white")
        table.add_column("Matches", justify="right")

        for player in players:
            table.add_row(
                str(player.id),
                player.name,
                str(len(player.match_stats)),
            )

        console.print(table)


@app.command()
def list_matches():
    """List all matches in the database."""
    with SessionLocal() as db:
        from rugby_stats.models import Match

        matches = db.query(Match).all()

        if not matches:
            console.print("[yellow]No matches found. Have you imported data?[/yellow]")
            return

        console.print(_create_matches_table(matches))


@app.command()
def regenerate_analysis(
    match_id: int = typer.Argument(..., help="Match ID to regenerate analysis for"),
):
    """Regenerate AI analysis for a specific match."""
    from rugby_stats.models import Match
    from rugby_stats.services.ai_analysis import AIAnalysisService

    with SessionLocal() as db:
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            console.print(f"[red]Error: Match with ID {match_id} not found[/red]")
            raise typer.Exit(1)

        console.print(f"[blue]Regenerating AI analysis for match vs {match.opponent_name}...[/blue]")

        ai_service = AIAnalysisService(db)
        ai_service.analyze_and_save(match)
        db.commit()

        _print_analysis_result(match)


if __name__ == "__main__":
    app()
