import { ApiController } from "../../api/controller.ts";
import { ReportConfig } from "./model.ts";

export class ReportController {
  static async exportReport(
    config: ReportConfig,
    headers: string[],
    rows: any[],
    summary?: any
  ): Promise<{ success: boolean; blobUrl?: string; pdfSpec?: any; message: string }> {
    try {
      const res = await ApiController.exportReport({
        format: config.format,
        title: config.title,
        headers,
        rows,
        summary
      });

      if (config.format === "pdf") {
        return {
          success: true,
          pdfSpec: (res as any)?.data,
          message: "PDF Print specification generated"
        };
      }

      // Download file blob
      const blob = res as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = config.format === "excel" ? "xls" : config.format;
      a.download = `gtax_tax_report_${Date.now()}.${ext}`;
      a.click();

      return {
        success: true,
        blobUrl: url,
        message: `Successfully exported ${config.format.toUpperCase()} report.`
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Export failed"
      };
    }
  }
}
