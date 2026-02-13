"""PDF report generation service."""

import io
import re
from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.constants import STAT_LABELS
from app.models import Match


class PDFGeneratorService:
    """Service for generating PDF match reports."""

    RANKINGS_COL_WIDTHS = [1.2, 6, 2, 2.5, 2]  # in cm
    SCORE_EVOLUTION_COL_WIDTHS = [4.5, 2.5, 1.5, 1.5, 2.5]
    TRENDS_COL_WIDTHS = [3.5, 2, 2, 1.5, 1.8, 2]
    COMPARISON_COL_WIDTHS = [4, 2.5, 2.5, 2.5]

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Set up custom paragraph styles for the report."""
        self.styles.add(
            ParagraphStyle(
                name="ReportTitle",
                parent=self.styles["Heading1"],
                fontSize=20,
                spaceAfter=20,
                alignment=1,  # Center
                textColor=colors.HexColor("#1a365d"),
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="SectionTitle",
                parent=self.styles["Heading2"],
                fontSize=14,
                spaceBefore=15,
                spaceAfter=10,
                textColor=colors.HexColor("#2d3748"),
                borderColor=colors.HexColor("#e2e8f0"),
                borderWidth=0,
                borderPadding=5,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="MatchInfo",
                parent=self.styles["Normal"],
                fontSize=11,
                spaceAfter=5,
                textColor=colors.HexColor("#4a5568"),
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="AnalysisText",
                parent=self.styles["Normal"],
                fontSize=10,
                spaceAfter=8,
                leading=14,
                textColor=colors.HexColor("#2d3748"),
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="AnalysisSubheading",
                parent=self.styles["Normal"],
                fontSize=11,
                spaceBefore=10,
                spaceAfter=5,
                fontName="Helvetica-Bold",
                textColor=colors.HexColor("#1a365d"),
            )
        )

    def _format_date(self, match_date: date | None) -> str:
        """Format match date for display."""
        if match_date is None:
            return "Fecha no disponible"
        return match_date.strftime("%d/%m/%Y")

    def _parse_markdown_analysis(self, analysis: str | None) -> list:
        """Parse markdown analysis into reportlab elements."""
        elements = []

        if not analysis:
            elements.append(
                Paragraph(
                    "No hay análisis disponible para este partido.",
                    self.styles["AnalysisText"],
                )
            )
            return elements

        # Split by lines and process
        lines = analysis.split("\n")
        current_paragraph = []

        for line in lines:
            stripped = line.strip()

            # Skip empty lines - flush current paragraph
            if not stripped:
                if current_paragraph:
                    text = " ".join(current_paragraph)
                    elements.append(Paragraph(text, self.styles["AnalysisText"]))
                    current_paragraph = []
                continue

            # Headers (## or ### or ####)
            if stripped.startswith("##"):
                # Flush current paragraph first
                if current_paragraph:
                    text = " ".join(current_paragraph)
                    elements.append(Paragraph(text, self.styles["AnalysisText"]))
                    current_paragraph = []

                # Remove # symbols and clean up
                header_text = re.sub(r"^#+\s*", "", stripped)
                # Remove any markdown formatting like ** or *
                header_text = re.sub(r"\*+", "", header_text)
                elements.append(
                    Paragraph(header_text, self.styles["AnalysisSubheading"])
                )
                continue

            # Bullet points
            if stripped.startswith(("- ", "* ", "• ")):
                # Flush current paragraph first
                if current_paragraph:
                    text = " ".join(current_paragraph)
                    elements.append(Paragraph(text, self.styles["AnalysisText"]))
                    current_paragraph = []

                # Process bullet point
                bullet_text = re.sub(r"^[-*•]\s*", "", stripped)
                # Convert markdown bold (**text**) to reportlab bold (<b>text</b>)
                bullet_text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", bullet_text)
                # Convert markdown italic (*text*) to reportlab italic (<i>text</i>)
                bullet_text = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", bullet_text)
                elements.append(
                    Paragraph(f"• {bullet_text}", self.styles["AnalysisText"])
                )
                continue

            # Regular text - accumulate for paragraph
            # Convert markdown formatting
            processed_line = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", stripped)
            processed_line = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", processed_line)
            current_paragraph.append(processed_line)

        # Flush remaining paragraph
        if current_paragraph:
            text = " ".join(current_paragraph)
            elements.append(Paragraph(text, self.styles["AnalysisText"]))

        return elements

    def _create_styled_table(
        self, data: list[list], col_widths_cm: list[float], font_size: int = 9
    ) -> Table:
        """Create a table with standard header styling and alternating row colors."""
        col_widths = [w * cm for w in col_widths_cm]
        table = Table(data, colWidths=col_widths)

        style = TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a365d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), font_size),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), max(font_size - 1, 7)),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ]
        )

        for i in range(1, len(data)):
            if i % 2 == 0:
                style.add("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f7fafc"))

        table.setStyle(style)
        return table

    def _create_pdf_document(self, buffer: io.BytesIO) -> SimpleDocTemplate:
        """Create a SimpleDocTemplate with standard margins."""
        return SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2 * cm,
            leftMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )

    def _finalize_pdf(
        self, doc: SimpleDocTemplate, elements: list, buffer: io.BytesIO
    ) -> bytes:
        """Build the PDF document and return the resulting bytes."""
        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

    # -- Match report element builders --

    def _build_match_header_elements(self, match: Match) -> list:
        """Return elements for the match report title, info, and score."""
        elements = []

        elements.append(
            Paragraph("INFORME DEL PARTIDO", self.styles["ReportTitle"])
        )

        match_title = f"{match.team} vs {match.opponent_name}"
        elements.append(
            Paragraph(match_title, self.styles["Heading2"])
        )
        elements.append(Spacer(1, 0.5 * cm))

        elements.append(
            Paragraph(
                f"<b>Fecha:</b> {self._format_date(match.match_date)}",
                self.styles["MatchInfo"],
            )
        )

        if match.location:
            elements.append(
                Paragraph(
                    f"<b>Ubicación:</b> {match.location}",
                    self.styles["MatchInfo"],
                )
            )

        if match.our_score is not None and match.opponent_score is not None:
            result_text = match.result or ""
            score_text = f"{match.our_score} - {match.opponent_score}"
            if result_text:
                score_text += f" ({result_text})"
            elements.append(
                Paragraph(
                    f"<b>Resultado:</b> {score_text}",
                    self.styles["MatchInfo"],
                )
            )

        elements.append(Spacer(1, 0.8 * cm))
        return elements

    def _build_analysis_elements(self, analysis: str | None) -> list:
        """Return the analysis section elements (heading + parsed markdown)."""
        elements = []

        elements.append(
            Paragraph("ANÁLISIS DEL PARTIDO", self.styles["SectionTitle"])
        )

        analysis_elements = self._parse_markdown_analysis(analysis)
        elements.extend(analysis_elements)

        elements.append(Spacer(1, 0.8 * cm))
        return elements

    def _build_rankings_elements(self, rankings: list[dict]) -> list:
        """Return the rankings section elements (heading + table)."""
        elements = []

        elements.append(
            Paragraph("RANKINGS DEL PARTIDO", self.styles["SectionTitle"])
        )
        elements.append(Spacer(1, 0.3 * cm))

        if rankings:
            rankings_table = self._create_rankings_table(rankings)
            elements.append(rankings_table)
        else:
            elements.append(
                Paragraph(
                    "No hay estadísticas disponibles para este partido.",
                    self.styles["AnalysisText"],
                )
            )

        return elements

    def _create_rankings_table(self, rankings: list[dict]) -> Table:
        """Create rankings table for the PDF."""
        headers = ["#", "Jugador", "Puesto", "Puntuación", "Minutos"]

        data = [headers]
        for ranking in rankings:
            row = [
                str(ranking["rank"]),
                ranking["player_name"],
                f"#{ranking['puesto']}" if ranking.get("puesto") else "-",
                f"{ranking['puntuacion_final']:.1f}",
                f"{ranking['tiempo_juego']:.0f}'" if ranking.get("tiempo_juego") else "-",
            ]
            data.append(row)

        col_widths = [w * cm for w in self.RANKINGS_COL_WIDTHS]
        table = Table(data, colWidths=col_widths)

        style = TableStyle(
            [
                # Header styling
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a365d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("TOPPADDING", (0, 0), (-1, 0), 10),
                # Body styling
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), 9),
                ("ALIGN", (0, 1), (0, -1), "CENTER"),  # Rank column
                ("ALIGN", (2, 1), (-1, -1), "CENTER"),  # Puesto, score, minutes
                ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                ("TOPPADDING", (0, 1), (-1, -1), 6),
                # Grid
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ]
        )

        for i in range(1, len(data)):
            if i % 2 == 0:
                style.add("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f7fafc"))

        table.setStyle(style)
        return table

    # -- Player report element builders --

    def _build_player_header_elements(
        self, player_name: str, position_group: str, match_count: int
    ) -> list:
        """Return elements for the player report title, info, and date."""
        elements = []

        elements.append(
            Paragraph("INFORME DE EVOLUCIÓN", self.styles["ReportTitle"])
        )
        elements.append(
            Paragraph(player_name, self.styles["Heading2"])
        )
        elements.append(Spacer(1, 0.3 * cm))

        pos_label = "Forward" if position_group == "forwards" else "Back"
        elements.append(
            Paragraph(
                f"<b>Posición:</b> {pos_label} | <b>Partidos jugados:</b> {match_count}",
                self.styles["MatchInfo"],
            )
        )
        elements.append(
            Paragraph(
                f"<b>Fecha del informe:</b> {date.today().strftime('%d/%m/%Y')}",
                self.styles["MatchInfo"],
            )
        )
        elements.append(Spacer(1, 0.8 * cm))
        return elements

    def _build_score_evolution_elements(self, matches_data: list[dict]) -> list:
        """Return elements for the score evolution section (heading + table)."""
        elements = []

        elements.append(
            Paragraph("EVOLUCIÓN DE PUNTUACIÓN", self.styles["SectionTitle"])
        )
        elements.append(Spacer(1, 0.3 * cm))

        if matches_data:
            score_headers = ["Rival", "Fecha", "Puesto", "Min.", "Puntuación"]
            score_data = [score_headers]
            for m in matches_data:
                score_data.append([
                    m.get("opponent", "-"),
                    m.get("match_date", "-") or "-",
                    f"#{m.get('puesto', '-')}",
                    f"{m.get('tiempo_juego', 0):.0f}'",
                    f"{m.get('score', 0):.1f}",
                ])

            score_table = self._create_styled_table(
                score_data, self.SCORE_EVOLUTION_COL_WIDTHS, font_size=9
            )
            # Override alignment for numeric columns (puesto, min, score)
            style = TableStyle([
                ("ALIGN", (2, 1), (-1, -1), "CENTER"),
            ])
            score_table.setStyle(style)
            elements.append(score_table)

        elements.append(Spacer(1, 0.8 * cm))
        return elements

    def _build_stats_trends_elements(self, anomalies: dict[str, dict]) -> list:
        """Return elements for the stats trends section (heading + table with alert coloring)."""
        elements = []

        if not anomalies:
            return elements

        elements.append(
            Paragraph("TENDENCIAS POR ESTADÍSTICA", self.styles["SectionTitle"])
        )
        elements.append(Spacer(1, 0.3 * cm))

        trend_headers = ["Estadística", "Med. Hist.", "Med. Rec.", "Último", "Desv. %", "Alerta"]
        trend_data = [trend_headers]

        for stat_name, label in STAT_LABELS.items():
            if stat_name not in anomalies:
                continue
            anomaly_data = anomalies[stat_name]
            alert_text = ""
            if anomaly_data.get("alert") == "positive":
                alert_text = "↑ Mejora"
            elif anomaly_data.get("alert") == "negative":
                alert_text = "↓ Baja"

            trend_data.append([
                label,
                f"{anomaly_data.get('median_all', 0):.1f}",
                f"{anomaly_data.get('median_recent', 0):.1f}",
                str(anomaly_data.get("last_value", 0)),
                f"{anomaly_data.get('deviation_pct', 0):+.1f}%",
                alert_text,
            ])

        col_widths = [w * cm for w in self.TRENDS_COL_WIDTHS]
        trend_table = Table(trend_data, colWidths=col_widths)
        trend_style = TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a365d")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("ALIGN", (1, 1), (-1, -1), "CENTER"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ])

        # Color alert rows
        for i in range(1, len(trend_data)):
            alert_val = trend_data[i][5]
            if "Mejora" in alert_val:
                trend_style.add("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f0fff4"))
                trend_style.add("TEXTCOLOR", (5, i), (5, i), colors.HexColor("#276749"))
            elif "Baja" in alert_val:
                trend_style.add("BACKGROUND", (0, i), (-1, i), colors.HexColor("#fff5f5"))
                trend_style.add("TEXTCOLOR", (5, i), (5, i), colors.HexColor("#c53030"))
            elif i % 2 == 0:
                trend_style.add("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f7fafc"))

        trend_table.setStyle(trend_style)
        elements.append(trend_table)

        return elements

    def _build_position_comparison_elements(
        self,
        position_comparison: dict[str, dict],
        position_group: str,
    ) -> list:
        """Return elements for the position comparison section (heading + table)."""
        elements = []

        if not position_comparison:
            return elements

        significant = {
            k: v
            for k, v in position_comparison.items()
            if abs(v.get("difference_pct", 0)) >= 15
        }
        if not significant:
            return elements

        elements.append(
            Paragraph(
                f"COMPARATIVA CON {position_group.upper()}",
                self.styles["SectionTitle"],
            )
        )
        elements.append(Spacer(1, 0.3 * cm))

        comp_headers = ["Estadística", "Jugador", "Grupo", "Diferencia"]
        comp_data = [comp_headers]
        for stat_name, comp in significant.items():
            label = STAT_LABELS.get(stat_name, stat_name)
            diff = comp["difference_pct"]
            diff_text = f"{diff:+.1f}%"
            comp_data.append([
                label,
                f"{comp['player_avg']:.1f}",
                f"{comp['group_avg']:.1f}",
                diff_text,
            ])

        comp_table = self._create_styled_table(
            comp_data, self.COMPARISON_COL_WIDTHS, font_size=9
        )
        # Override alignment for numeric columns
        style = TableStyle([
            ("ALIGN", (1, 1), (-1, -1), "CENTER"),
        ])
        comp_table.setStyle(style)
        elements.append(comp_table)

        elements.append(Spacer(1, 0.8 * cm))
        return elements

    # -- Public report generators --

    def generate_match_report(
        self, match: Match, rankings: list[dict]
    ) -> bytes:
        """
        Generate a PDF report for a match.

        Args:
            match: The match to generate a report for
            rankings: List of player rankings for the match

        Returns:
            PDF file as bytes
        """
        buffer = io.BytesIO()
        doc = self._create_pdf_document(buffer)

        elements = []
        elements.extend(self._build_match_header_elements(match))
        elements.extend(self._build_analysis_elements(match.ai_analysis))
        elements.extend(self._build_rankings_elements(rankings))

        return self._finalize_pdf(doc, elements, buffer)

    def generate_player_report(
        self,
        player_name: str,
        position_group: str,
        matches_data: list[dict],
        anomalies: dict[str, dict],
        position_comparison: dict[str, dict],
        ai_analysis: str | None = None,
    ) -> bytes:
        """Generate a PDF evolution report for a player."""
        buffer = io.BytesIO()
        doc = self._create_pdf_document(buffer)

        elements = []
        elements.extend(
            self._build_player_header_elements(player_name, position_group, len(matches_data))
        )
        elements.extend(self._build_score_evolution_elements(matches_data))
        elements.extend(self._build_stats_trends_elements(anomalies))
        elements.append(Spacer(1, 0.8 * cm))
        elements.extend(
            self._build_position_comparison_elements(position_comparison, position_group)
        )

        # AI Analysis section
        elements.append(
            Paragraph("ANÁLISIS DE EVOLUCIÓN", self.styles["SectionTitle"])
        )
        analysis_elements = self._parse_markdown_analysis(ai_analysis)
        elements.extend(analysis_elements)

        return self._finalize_pdf(doc, elements, buffer)
