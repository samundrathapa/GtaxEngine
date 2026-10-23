/**
 * gtax Enterprise - Next.js API Service Client
 * Connects Next.js client pages and hooks to the Single Common Entry Point (/api/v1)
 */

import { ClientApiResponse, TaxpayerRecord, CalculationResult } from "../types.ts";

const BASE_URL = "/api/v1";

class ApiServiceClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ClientApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options?.headers,
        },
        ...options,
      });

      const json = await response.json();
      return json;
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        data: null as unknown as T,
        message: error instanceof Error ? error.message : "Network error occurred",
      };
    }
  }

  // Taxpayer Services
  async getTaxpayers(query?: string): Promise<ClientApiResponse<TaxpayerRecord[]>> {
    const q = query ? `?q=${encodeURIComponent(query)}` : "";
    return this.request<TaxpayerRecord[]>(`/taxpayers${q}`);
  }

  async getTodayTaxpayers(): Promise<ClientApiResponse<TaxpayerRecord[]>> {
    return this.request<TaxpayerRecord[]>("/taxpayers/today");
  }

  async createTaxpayer(payload: Partial<TaxpayerRecord>): Promise<ClientApiResponse<TaxpayerRecord>> {
    return this.request<TaxpayerRecord>("/taxpayers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Rates Master Services
  async getRates(category: string): Promise<ClientApiResponse<unknown[]>> {
    return this.request<unknown[]>(`/rates/${category}`);
  }

  async saveRateItem(category: string, payload: Record<string, unknown>): Promise<ClientApiResponse<unknown>> {
    return this.request<unknown>(`/rates/${category}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Tax Calculation Engine Services
  async calculateTax(params: Record<string, unknown>): Promise<ClientApiResponse<CalculationResult>> {
    return this.request<CalculationResult>("/calculations/evaluate", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async saveCalculation(record: Partial<CalculationResult>): Promise<ClientApiResponse<CalculationResult>> {
    return this.request<CalculationResult>("/calculations/save", {
      method: "POST",
      body: JSON.stringify(record),
    });
  }

  // AI & Voice Intent Services
  async sendAiChat(message: string, context?: Record<string, unknown>): Promise<ClientApiResponse<{ response: string }>> {
    return this.request<{ response: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, context }),
    });
  }

  async parseVoiceIntent(transcript: string): Promise<ClientApiResponse<{ intent: string; executed: boolean }>> {
    return this.request<{ intent: string; executed: boolean }>("/ai/voice-intent", {
      method: "POST",
      body: JSON.stringify({ transcript }),
    });
  }
}

export const apiClient = new ApiServiceClient();
