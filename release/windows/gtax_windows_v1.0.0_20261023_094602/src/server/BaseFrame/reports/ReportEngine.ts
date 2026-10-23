export class ReportEngine {
  static generateCsv(headers: string[], rows: Record<string, any>[]): string {
    const headerRow = headers.join(",");
    const bodyRows = rows.map((row) =>
      headers.map((h) => {
        const val = row[h] !== undefined ? String(row[h]) : "";
        return `"${val.replace(/"/g, '""')}"`;
      }).join(",")
    );
    return [headerRow, ...bodyRows].join("\n");
  }

  static generateHtml(title: string, headers: string[], rows: Record<string, any>[], summary?: Record<string, any>): string {
    const thead = headers.map((h) => `<th style="padding:10px 14px;background:#0f172a;color:#f8fafc;text-align:left;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">${h}</th>`).join("");
    const tbody = rows
      .map((r, i) => {
        const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
        const tds = headers.map((h) => `<td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${r[h] ?? ""}</td>`).join("");
        return `<tr style="background:${bg};">${tds}</tr>`;
      })
      .join("");

    let summaryBlock = "";
    if (summary) {
      const items = Object.entries(summary)
        .map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span style="color:#64748b;">${k}:</span><strong style="color:#0f172a;">${v}</strong></div>`)
        .join("");
      summaryBlock = `
        <div style="margin-top:24px;padding:16px 20px;background:#f1f5f9;border-radius:8px;max-width:380px;margin-left:auto;">
          <h4 style="margin:0 0 12px 0;font-size:14px;color:#0f172a;border-bottom:1px solid #cbd5e1;padding-bottom:6px;">Summary Totals</h4>
          ${items}
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #0f172a; background: #fff; }
    h2 { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
  </style>
</head>
<body>
  <h2>${title}</h2>
  <table>
    <thead><tr>${thead}</tr></thead>
    <tbody>${tbody}</tbody>
  </table>
  ${summaryBlock}
</body>
</html>`;
  }

  static generateExcelXml(title: string, headers: string[], rows: Record<string, any>[]): string {
    const headerCells = headers.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join("");
    const rowXml = rows
      .map((r) => {
        const cells = headers.map((h) => {
          const val = String(r[h] ?? "");
          const isNum = !isNaN(Number(val)) && val !== "";
          return `<Cell><Data ss:Type="${isNum ? "Number" : "String"}">${val}</Data></Cell>`;
        }).join("");
        return `<Row>${cells}</Row>`;
      })
      .join("\n");

    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${title.slice(0, 31)}">
  <Table>
   <Row>${headerCells}</Row>
   ${rowXml}
  </Table>
 </Worksheet>
</Workbook>`;
  }

  static generatePdfDocumentSpec(title: string, headers: string[], rows: Record<string, any>[]) {
    return {
      pageSize: "A4",
      pageOrientation: "landscape",
      documentTitle: title,
      metadata: {
        creator: "gtax Enterprise BaseFrame Report Engine",
        generatedAt: new Date().toISOString()
      },
      headers,
      dataRowCount: rows.length,
      sampleRows: rows.slice(0, 5)
    };
  }
}
