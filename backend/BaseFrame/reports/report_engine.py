"""
Report Engine: Supports PDF, Excel, HTML, and CSV Generation for Tax Liabilities
"""
import csv
import io
from typing import List, Dict, Any

class ReportEngine:
    @staticmethod
    def generate_csv(headers: List[str], data_rows: List[Dict[str, Any]]) -> str:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()
        for row in data_rows:
            writer.writerow(row)
        return output.getvalue()

    @staticmethod
    def generate_html(title: str, headers: List[str], data_rows: List[Dict[str, Any]], summary: Dict[str, Any] = None) -> str:
        th_html = "".join([f"<th style='padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;text-align:left;'>{h}</th>" for h in headers])
        tr_list = []
        for r in data_rows:
            tds = "".join([f"<td style='padding:8px 12px;border:1px solid #e2e8f0;'>{r.get(h, '')}</td>" for h in headers])
            tr_list.append(f"<tr>{tds}</tr>")
        rows_html = "".join(tr_list)

        summary_html = ""
        if summary:
            items = "".join([f"<li><strong>{k}:</strong> {v}</li>" for k, v in summary.items()])
            summary_html = f"<div style='margin-top:20px;padding:16px;background:#f1f5f9;'><h3>Summary Totals</h3><ul>{items}</ul></div>"

        return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>{title}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 24px; }}
        table {{ border-collapse: collapse; width: 100%; font-size: 14px; }}
        h1 {{ font-size: 20px; font-weight: 700; margin-bottom: 16px; }}
    </style>
</head>
<body>
    <h1>{title}</h1>
    <table>
        <thead><tr>{th_html}</tr></thead>
        <tbody>{rows_html}</tbody>
    </table>
    {summary_html}
</body>
</html>"""

    @staticmethod
    def generate_excel_xml(title: str, headers: List[str], data_rows: List[Dict[str, Any]]) -> str:
        """Lightweight spreadsheet-compatible XML (opens directly in MS Excel)."""
        header_cells = "".join([f'<Cell><Data ss:Type="String">{h}</Data></Cell>' for h in headers])
        row_elements = []
        for row in data_rows:
            cell_items = []
            for h in headers:
                val = str(row.get(h, ''))
                val_type = "Number" if val.replace('.', '', 1).isdigit() else "String"
                cell_items.append(f'<Cell><Data ss:Type="{val_type}">{val}</Data></Cell>')
            row_elements.append(f"<Row>{''.join(cell_items)}</Row>")

        return f"""<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="{title[:31]}">
  <Table>
   <Row>{header_cells}</Row>
   {''.join(row_elements)}
  </Table>
 </Worksheet>
</Workbook>"""

    @staticmethod
    def generate_pdf_definition(title: str, headers: List[str], data_rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Provides PDF-Make / Weasyprint structured JSON configuration for headless print rendering."""
        return {
            "title": title,
            "pageOrientation": "landscape",
            "content": [
                {"text": title, "fontSize": 18, "bold": True, "margin": [0, 0, 0, 10]},
                {
                    "table": {
                        "headerRows": 1,
                        "widths": ["*"] * len(headers),
                        "body": [headers] + [[str(row.get(h, "")) for h in headers] for row in data_rows]
                    }
                }
            ]
        }
