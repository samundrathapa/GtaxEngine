import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface AiChatMessage {
  role: "user" | "model" | "assistant" | "system";
  content: string;
}

export interface TaxAnalysisContext {
  taxpayerName?: string;
  taxpayerCode?: string;
  landCount?: number;
  houseCount?: number;
  floorCount?: number;
  totalLandAmount?: number;
  totalHouseAmount?: number;
  totalFloorAmount?: number;
  evaluatedAmount?: number;
  iptTax?: number;
  sanitationFee?: number;
  grandTotal?: number;
  fiscalYear?: string;
}

export class GeminiFeaturesService {
  /**
   * Conversational tax intelligence & inquiry handling
   */
  public static async chatWithTaxAssistant(
    message: string,
    history: AiChatMessage[] = [],
    context?: TaxAnalysisContext
  ): Promise<string> {
    if (!ai) {
      return this.fallbackTaxAssistantResponse(message, context);
    }

    try {
      const systemPrompt = `You are gtax municipal property & tax intelligence assistant.
You help taxpayers and municipal revenue officers calculate, inspect, and understand integrated property tax (सम्पत्ति कर), land valuation (जग्गा मूल्याङ्कन), house/building valuation (घर मूल्याङ्कन), floor slabs, and depreciation according to Local Government Operation Act (स्थानीय सरकार सञ्चालन ऐन).
Current Context:
${context ? JSON.stringify(context, null, 2) : "General Municipal Taxpayer Assistance"}
Always be professional, polite, concise, and provide exact calculation formulas whenever asked. You support English, Nepali (नेपाली), and Hindi.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }] }
        ]
      });

      return response.text || "No response received from Gemini tax engine.";
    } catch (err: any) {
      console.warn("Gemini API call failed, falling back to local tax engine response:", err.message);
      return this.fallbackTaxAssistantResponse(message, context);
    }
  }

  /**
   * Explain property tax calculation formula in detail
   */
  public static explainCalculationFormula(context: TaxAnalysisContext): string {
    const landAmt = context.totalLandAmount || 0;
    const houseAmt = context.totalHouseAmount || 0;
    const evaluated = context.evaluatedAmount || (landAmt + houseAmt);
    const ipt = context.iptTax || 0;
    const fee = context.sanitationFee || 200;
    const total = context.grandTotal || (ipt + fee);

    return `### gtax Municipal Property Tax Breakdown:
1. **Land Valuation (land_amount)**:
   - Sum of all registered parcels normalized by unit rate.
   - Evaluated Land Total = Rs. ${landAmt.toLocaleString()}

2. **House & Floors Valuation (house_amount)**:
   - Evaluated floor slabs minus structural depreciation, aggregated with plinth multiplier.
   - Evaluated House Total = Rs. ${houseAmt.toLocaleString()}

3. **Total Assessed Property (Evaluated_Amount)**:
   - Evaluated_Amount = land_amount + house_amount = Rs. ${evaluated.toLocaleString()}

4. **Tax Calculation (IPT Slab Tax)**:
   - Municipal property bracket progressive rate evaluated = Rs. ${ipt.toLocaleString()}
   - Sanitation & Waste Management Fee = Rs. ${fee.toLocaleString()}
   - **Grand Total Tax Payable = Rs. ${total.toLocaleString()}**`;
  }

  /**
   * Deterministic local fallback in case GEMINI_API_KEY is not configured
   */
  private static fallbackTaxAssistantResponse(message: string, context?: TaxAnalysisContext): string {
    const lower = message.toLowerCase();
    if (lower.includes("land") || lower.includes("जग्गा") || lower.includes("kitta")) {
      return `Land valuation is calculated using normalized parcel areas (Ropani/Aana or Bigha/Kattha) multiplied by the approved municipal or Malpot circle rate per unit. You have ${context?.landCount || 0} registered parcel(s).`;
    }
    if (lower.includes("house") || lower.includes("घर") || lower.includes("floor") || lower.includes("तला")) {
      return `House structure amount is derived from all associated floor slabs (Area × Construction Rate - Depreciation %), scaled by the plinth multiplier factor and municipal adjustments.`;
    }
    if (lower.includes("calculate") || lower.includes("कर") || lower.includes("tax") || lower.includes("formula")) {
      return this.explainCalculationFormula(context || {});
    }
    return `gtax Tax Assistant: I am ready to help you with taxpayer registration, land parcel entries (कित्ता नं.), building structures, floor depreciation rates, and progressive municipal tax calculations for Fiscal Year ${context?.fiscalYear || "2081/82"}.`;
  }
}
