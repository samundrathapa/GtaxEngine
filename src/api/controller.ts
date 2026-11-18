import { IApiResponse } from "../server/BaseFrame/response/ApiResponse.ts";

export class ApiController {
  private static token = "Bearer bearer_adm_token";

  static setAuthToken(token: string) {
    this.token = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  static getAuthToken(): string {
    return this.token;
  }

  public static get baseUrl(): string {
    return this.getBaseUrl();
  }

  public static getBaseUrl(): string {
    if (typeof window !== "undefined") {
      // If deployed inside an IIS Application / Virtual Directory (e.g. /gtax)
      const pathname = window.location.pathname.replace(/\/index\.html$/i, "").replace(/\/+$/, "");
      if (pathname && !pathname.startsWith("/api") && pathname !== "/") {
        return `${pathname}/api/v1`;
      }
    }
    return "/api/v1";
  }

  private static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<IApiResponse<T>> {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.getBaseUrl()}${cleanEndpoint}`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: this.token,
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Safely read response as raw text first to avoid 'Unexpected end of JSON input' on empty bodies or HTML error pages
      const responseText = await response.text();
      let data: any = null;
      if (responseText && responseText.trim().length > 0) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = null;
        }
      }

      if (!response.ok) {
        if (data && typeof data === "object" && (data.message || data.errors)) {
          return {
            success: false,
            failure: true,
            status: response.status,
            message: data.message || `Server returned error (${response.status})`,
            data: data.data || null,
            errors: Array.isArray(data.errors) ? data.errors : [data.message || `HTTP ${response.status}`],
            validation_errors: data.validation_errors || {},
            timestamp: data.timestamp || new Date().toISOString()
          };
        }

        // Actionable messages for reverse proxy & network error codes
        let friendlyMessage = `Server request failed with HTTP ${response.status}.`;
        if (response.status === 400) {
          friendlyMessage = "HTTP 400 Bad Request: Request was rejected by the server or IIS ARR proxy. Verify that Node.js backend is running on port 3000 and URL rewrite rules in web.config are active.";
        } else if (response.status === 502 || response.status === 503) {
          friendlyMessage = "Backend server is offline (HTTP 502/503). Please launch 'start_server.bat' to run the Node.js service on port 3000.";
        } else if (response.status === 404) {
          friendlyMessage = `API endpoint not found: ${url}. Verify IIS rewrite rules in web.config.`;
        }

        return {
          success: false,
          failure: true,
          status: response.status,
          message: friendlyMessage,
          data: null,
          errors: [responseText ? responseText.slice(0, 300) : friendlyMessage],
          validation_errors: {},
          timestamp: new Date().toISOString()
        };
      }

      if (!data) {
        return {
          success: false,
          failure: true,
          status: response.status || 500,
          message: "Server returned an empty response.",
          data: null,
          errors: ["Empty response received from backend"],
          validation_errors: {},
          timestamp: new Date().toISOString()
        };
      }

      return data as IApiResponse<T>;
    } catch (err: any) {
      return {
        success: false,
        failure: true,
        status: 500,
        message: err?.message || "Network request failed. Ensure backend server is running on port 3000.",
        data: null,
        errors: [err?.message || "Unknown communication error"],
        validation_errors: {},
        timestamp: new Date().toISOString()
      };
    }
  }

  // System & Architecture
  static async getTopology() {
    return this.request("/topology");
  }

  // Taxpayer Property & Valuation Endpoints
  static async getPropertyMasters() {
    return this.request<{
      fiscalYears: any[];
      units: any[];
      landNatures: any[];
      constructionTypes: any[];
      landRates: any[];
      malpotRates: any[];
      constructionRates: any[];
      depreciations: any[];
      fineRebates: any[];
      propertyRanges?: any[];
      companies?: any[];
      applicationSettings?: any[];
    }>("/property/masters");
  }

  static async createFiscalYear(data: any) {
    return this.request("/property/fiscal-year", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async getTaxpayers() {
    return this.request<any[]>("/property/taxpayers");
  }

  static async getTaxpayerRecord(taxpayerId: number) {
    return this.request<any>(`/property/taxpayers/${taxpayerId}`);
  }

  static async createTaxpayer(data: any) {
    return this.request("/property/taxpayers", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async getTaxpayerDossier(taxpayerId: number) {
    return this.request<any>(`/property/taxpayers/${taxpayerId}`);
  }

  static async createLand(data: any) {
    return this.request("/property/lands", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async createHouse(data: any) {
    return this.request("/property/houses", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async createFloor(data: any) {
    return this.request("/property/floors", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  static async updateTaxpayer(id: number, data: any) {
    return this.request(`/property/taxpayers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  static async deleteTaxpayer(id: number) {
    return this.request(`/property/taxpayers/${id}`, {
      method: "DELETE"
    });
  }

  static async updateLand(id: number, data: any) {
    return this.request(`/property/lands/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  static async deleteLand(id: number) {
    return this.request(`/property/lands/${id}`, {
      method: "DELETE"
    });
  }

  static async updateHouse(id: number, data: any) {
    return this.request(`/property/houses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  static async deleteHouse(id: number) {
    return this.request(`/property/houses/${id}`, {
      method: "DELETE"
    });
  }

  static async updateFloor(id: number, data: any) {
    return this.request(`/property/floors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  static async deleteFloor(id: number) {
    return this.request(`/property/floors/${id}`, {
      method: "DELETE"
    });
  }

  static async calculateMultiYearTax(params: {
    taxpayerId: number;
    fromFiscalYearId: number;
    toFiscalYearId: number;
    scope?: "all" | "land" | "house";
    propertyId?: number;
  }) {
    return this.request("/property/multi-year-tax-calc", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }

  static async saveRateItem(category: string, data: any, id?: number) {
    if (id) {
      return this.request(`/property/rates/${category}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    } else {
      return this.request(`/property/rates/${category}`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    }
  }

  static async deleteRateItem(category: string, id: number) {
    return this.request(`/property/rates/${category}/${id}`, {
      method: "DELETE"
    });
  }

  static async copyRates(payload: {
    sourceFiscalYearId?: number | null;
    source_fiscal_year_id?: number | null;
    targetFiscalYearId?: number;
    target_fiscal_year_id?: number;
    categories?: string[] | string;
    category?: string[] | string;
    overwrite?: boolean;
  }) {
    const formatted = {
      sourceFiscalYearId: payload.sourceFiscalYearId !== undefined ? payload.sourceFiscalYearId : (payload.source_fiscal_year_id ?? null),
      targetFiscalYearId: payload.targetFiscalYearId || payload.target_fiscal_year_id || 2,
      categories: payload.categories || payload.category || "all",
      overwrite: payload.overwrite !== undefined ? payload.overwrite : true
    };
    return this.request("/property/rates/copy", {
      method: "POST",
      body: JSON.stringify(formatted)
    });
  }

  static async getCompanies() {
    return this.request("/property/companies");
  }

  static async saveCompany(data: any, id?: number) {
    if (id) {
      return this.request(`/property/companies/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    } else {
      return this.request("/property/companies", {
        method: "POST",
        body: JSON.stringify(data)
      });
    }
  }

  static async getApplicationSettings() {
    return this.request("/property/settings");
  }

  static async updateApplicationSettings(data: any) {
    return this.request("/property/settings", {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  static async saveTaxCalculation(payload: any) {
    return this.request("/property/calculation/save", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  static async saveCalculationMaster(payload: any) {
    return this.saveTaxCalculation(payload);
  }

  static async getCalculationHistory(taxpayerId?: number, fiscalYearId?: number) {
    const params = new URLSearchParams();
    if (taxpayerId) params.append("taxpayer_id", String(taxpayerId));
    if (fiscalYearId) params.append("fiscal_year_id", String(fiscalYearId));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/property/calculation/history${qs}`);
  }

  static async getCalculationById(id: number) {
    return this.request(`/property/calculation/${id}`);
  }

  static async deleteCalculation(id: number) {
    return this.request(`/property/calculation/${id}`, {
      method: "DELETE"
    });
  }

  // Authentication & Session Lifecycle
  static async login(identifier: string, password: string) {
    const res = await this.request<{
      token: string;
      session: any;
      user: any;
      role: any;
      rights: any[];
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password })
    });
    if (res.success && res.data?.token) {
      this.setAuthToken(res.data.token);
      localStorage.setItem("gtax_auth_token", res.data.token);
    }
    return res;
  }

  static async logout(userId?: number) {
    const res = await this.request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ user_id: userId })
    });
    localStorage.removeItem("gtax_auth_token");
    this.token = "";
    return res;
  }

  static async registerUser(userData: {
    fullname: string;
    email: string;
    password?: string;
    mobile?: string;
    country_id?: number;
    employee_id?: string;
    send_password_to_email?: boolean;
    role_name?: string;
  }) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData)
    });
  }

  static async forgotPassword(emailOrMobile: string) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email_or_mobile: emailOrMobile })
    });
  }

  static async resetOwnPassword(currentPassword: string, newPassword: string, token?: string) {
    const authToken = token
      ? token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`
      : this.token;
    return this.request("/auth/reset-own-password", {
      method: "POST",
      headers: {
        Authorization: authToken
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  static async adminResetUserPassword(targetUserId: number | string, newPassword: string, token?: string) {
    const authToken = token
      ? token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`
      : this.token;
    return this.request("/auth/admin/reset-password", {
      method: "POST",
      headers: {
        Authorization: authToken
      },
      body: JSON.stringify({ targetUserId, newPassword })
    });
  }

  static async adminResetAllPasswords(newPassword: string, excludeSelf: boolean = true, token?: string) {
    const authToken = token
      ? token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`
      : this.token;
    return this.request("/auth/admin/reset-all-passwords", {
      method: "POST",
      headers: {
        Authorization: authToken
      },
      body: JSON.stringify({ newPassword, excludeSelf })
    });
  }

  static async checkSession() {
    return this.request<{
      user: any;
      role: any;
      rights: any[];
    }>("/auth/session");
  }

  static async getSecurityLogs() {
    return this.request<{
      userLogs: any[];
      sessionLogs: any[];
    }>("/auth/logs");
  }

  static async getMigrations() {
    return this.request("/migrations");
  }

  // Users (Inherited BaseFrame CRUD)
  static async getUsers() {
    return this.request<{ items: any[]; total: number }>("/users");
  }

  static async createUser(userData: any) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(userData)
    });
  }

  static async updateUser(userId: string, userData: any) {
    return this.request(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData)
    });
  }

  static async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, {
      method: "DELETE"
    });
  }

  // Jurisdictions (Inherited BaseFrame CRUD)
  static async getJurisdictions() {
    return this.request<{ items: any[]; total: number }>("/jurisdictions");
  }

  static async createJurisdiction(data: any) {
    return this.request("/jurisdictions", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  // Tax Calculation & Complex Liabilities
  static async getTransactions() {
    return this.request<{ items: any[]; total: number }>("/tax-calc/transactions");
  }

  static async calculateTaxLiability(calculationParams: {
    invoiceNumber: string;
    grossAmount: number;
    originCountry: string;
    originRegion: string;
    destinationCountry: string;
    destinationRegion: string;
    productTaxCode: string;
    customerId?: string;
  }) {
    return this.request("/tax-calc/calculate", {
      method: "POST",
      body: JSON.stringify(calculationParams)
    });
  }

  // Real-time Sync Events
  static async getSyncEvents() {
    return this.request<{ items: any[]; total: number }>("/sync-events");
  }

  static async broadcastSync(aggregateId: string, payload?: any) {
    return this.request("/sync-events/broadcast", {
      method: "POST",
      body: JSON.stringify({ aggregate_id: aggregateId, payload })
    });
  }

  // AI Agent (Gemini, OpenAI, Grok, Voice)
  static async consultAi(prompt: string, provider: "gemini" | "openai" | "grok" = "gemini", context?: any) {
    return this.request("/ai/advisory", {
      method: "POST",
      body: JSON.stringify({ prompt, provider, context })
    });
  }

  // Gemini Advanced Capabilities
  static async geminiChat(params: {
    messages: { role: "user" | "model"; text: string }[];
    newMessage: string;
    modelTier?: "complex" | "general" | "fast";
    systemInstruction?: string;
  }) {
    return this.request<{
      text: string;
      modelUsed: string;
      modelTier: string;
      fallback?: boolean;
    }>("/gemini/chat", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }

  static async geminiMapsGrounding(prompt: string, location?: { latitude: number; longitude: number }) {
    return this.request<{
      text: string;
      links: { title: string; uri: string }[];
      modelUsed: string;
      fallback?: boolean;
    }>("/gemini/maps-grounding", {
      method: "POST",
      body: JSON.stringify({ prompt, location })
    });
  }

  static async geminiTranscribeAudio(audioBase64: string, mimeType = "audio/webm") {
    return this.request<{
      transcript: string;
      modelUsed: string;
      fallback?: boolean;
    }>("/gemini/transcribe", {
      method: "POST",
      body: JSON.stringify({ audioBase64, mimeType })
    });
  }

  static async geminiLiveVoice(prompt: string, systemInstruction?: string) {
    return this.request<{
      replyText: string;
      audioBase64: string | null;
      modelUsed: string;
      fallback?: boolean;
    }>("/gemini/live-voice", {
      method: "POST",
      body: JSON.stringify({ prompt, systemInstruction })
    });
  }

  static async parseVoiceCommand(transcript: string) {
    return this.request("/ai/voice-command", {
      method: "POST",
      body: JSON.stringify({ transcript })
    });
  }

  // Reports
  static async exportReport(payload: {
    format: "csv" | "excel" | "html" | "pdf";
    title: string;
    headers: string[];
    rows: any[];
    summary?: any;
  }) {
    if (payload.format === "csv" || payload.format === "html" || payload.format === "excel") {
      const response = await fetch(`${this.baseUrl}/reports/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.token
        },
        body: JSON.stringify(payload)
      });
      const blob = await response.blob();
      return blob;
    }

    return this.request("/reports/export", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
}
