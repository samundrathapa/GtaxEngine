import rawColumnMapping from "../i18n/db_column_mapping.json";
import engLocaleJson from "../i18n/locales/eng.json";
import nepLocaleJson from "../i18n/locales/nep.json";
import indLocaleJson from "../i18n/locales/ind.json";

export type SupportedLang = "nep" | "ind" | "eng";
export type SupportedTheme = "dark" | "slate" | "emerald" | "light";

export interface ColumnTranslation {
  table?: string;
  eng: string;
  nep: string;
  ind: string;
  [key: string]: string | undefined;
}

export type DbColumnMappingDictionary = Record<string, ColumnTranslation>;

// LocalStorage keys for persisting dynamic JSON updates, active language, and Google Translate cache
const STORAGE_KEY_DB_COLUMNS = "gtax_db_column_mapping_override";
const STORAGE_KEY_GOOGLE_CACHE = "gtax_google_translate_cache_v1";
const STORAGE_KEY_CURRENT_LANG = "gtax_active_lang";

const localeDictionaries: Record<SupportedLang, Record<string, string>> = {
  eng: engLocaleJson as Record<string, string>,
  nep: nepLocaleJson as Record<string, string>,
  ind: indLocaleJson as Record<string, string>
};

// In-memory active column mapping initialized from JSON file or localStorage override
let activeColumnMapping: DbColumnMappingDictionary = (() => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY_DB_COLUMNS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return { ...rawColumnMapping.columns, ...parsed };
        }
      }
    }
  } catch (e) {
    console.warn("Failed to load custom DB column mapping from storage, using json defaults", e);
  }
  return { ...rawColumnMapping.columns };
})();

// Persistent client cache for Google Translate fallback results: { nep: { "Reset Password": "..." }, ind: { ... } }
type GoogleCacheMap = Record<SupportedLang, Record<string, string>>;
let googleTranslateCache: GoogleCacheMap = (() => {
  const empty: GoogleCacheMap = { eng: {}, nep: {}, ind: {} };
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY_GOOGLE_CACHE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return {
            eng: parsed.eng || {},
            nep: parsed.nep || {},
            ind: parsed.ind || {}
          };
        }
      }
    }
  } catch {
    // ignore storage parse failure
  }
  return empty;
})();

function saveGoogleTranslateCache() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_GOOGLE_CACHE, JSON.stringify(googleTranslateCache));
    }
  } catch {
    // ignore quota errors
  }
}

// Listeners for live auto-reflection across all components
type MappingChangeListener = (mapping: DbColumnMappingDictionary) => void;
type TranslationUpdateListener = () => void;

const mappingListeners: Set<MappingChangeListener> = new Set();
const translationListeners: Set<TranslationUpdateListener> = new Set();

function notifyTranslationListeners() {
  translationListeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error(err);
    }
  });
}

export function subscribeToTranslations(callback: TranslationUpdateListener): () => void {
  translationListeners.add(callback);
  return () => {
    translationListeners.delete(callback);
  };
}

/**
 * Resolve IIS-safe API base URL
 */
function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname.replace(/\/index\.html$/i, "").replace(/\/+$/, "");
    if (pathname && !pathname.startsWith("/api") && pathname !== "/") {
      return `${pathname}/api/v1`;
    }
  }
  return "/api/v1";
}

/**
 * Format snake_case or camelCase identifier to readable English Title Case
 */
export function formatIdentifierToEnglish(keyOrText: string): string {
  if (!keyOrText) return "";
  if (keyOrText.includes(" ")) return keyOrText;
  return keyOrText
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Debounced batch queue for missing translations
const pendingQueue: Record<SupportedLang, Map<string, string>> = {
  eng: new Map(),
  nep: new Map(),
  ind: new Map()
};
const inFlightKeys: Set<string> = new Set();
let batchTimer: ReturnType<typeof setTimeout> | null = null;

function flushTranslationQueue() {
  batchTimer = null;
  (["nep", "ind"] as SupportedLang[]).forEach(async (lang) => {
    const q = pendingQueue[lang];
    if (!q || q.size === 0) return;

    const entries = Array.from(q.entries());
    q.clear();

    const items = entries.map(([key, text]) => ({ key, text }));
    try {
      const res = await fetch(`${resolveApiBaseUrl()}/i18n/translate-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLang: lang, items })
      });
      if (!res.ok) return;
      const json = await res.json();
      const list = json?.data?.translations;
      if (Array.isArray(list)) {
        let updated = false;
        for (const item of list) {
          const originalText = item.originalText || item.text || "";
          const translatedText = item.translatedText || "";
          if (translatedText && originalText && translatedText !== originalText) {
            googleTranslateCache[lang][originalText] = translatedText;
            if (item.key) {
              googleTranslateCache[lang][item.key] = translatedText;
            }
            updated = true;
          }
        }
        if (updated) {
          saveGoogleTranslateCache();
          notifyTranslationListeners();
        }
      }
    } catch {
      // Non-fatal fallback to English if Google Translate is unreachable
    } finally {
      for (const [k] of entries) {
        inFlightKeys.delete(`${lang}:${k}`);
      }
    }
  });
}

function scheduleGoogleTranslate(key: string, englishText: string, lang: SupportedLang) {
  if (typeof window === "undefined" || lang === "eng" || !englishText.trim()) return;
  const cacheSig = `${lang}:${key}`;
  if (inFlightKeys.has(cacheSig)) return;
  if (googleTranslateCache[lang]?.[key] || googleTranslateCache[lang]?.[englishText]) return;

  inFlightKeys.add(cacheSig);
  pendingQueue[lang].set(key, englishText);

  if (!batchTimer) {
    batchTimer = setTimeout(flushTranslationQueue, 40);
  }
}

/**
 * Synchronously lookup a key or English text inside loaded language JSON dictionaries.
 * Returns null if not defined for the target language.
 */
export function lookupJsonTranslation(keyOrText: string, lang: SupportedLang): string | null {
  if (!keyOrText) return null;

  // 1. Dynamic overrides & db_column_mapping.json by exact key
  const colEntry = activeColumnMapping[keyOrText];
  if (colEntry && typeof colEntry[lang] === "string" && colEntry[lang]!.trim() !== "") {
    return colEntry[lang] as string;
  }

  // 2. Locale JSON file (src/i18n/locales/{lang}.json) by exact key
  const localeDict = localeDictionaries[lang];
  if (localeDict && typeof localeDict[keyOrText] === "string" && localeDict[keyOrText].trim() !== "") {
    return localeDict[keyOrText];
  }

  // 3. Base UI translations JSON dictionary
  const baseDict = baseUiTranslations[lang] as Record<string, string> | undefined;
  if (baseDict && typeof baseDict[keyOrText] === "string" && baseDict[keyOrText].trim() !== "") {
    return baseDict[keyOrText];
  }

  // 4. Case-insensitive English value match across baseUiTranslations, locales/eng.json, and activeColumnMapping
  const lower = keyOrText.trim().toLowerCase();
  const baseEng = baseUiTranslations.eng as Record<string, string>;
  for (const [k, engVal] of Object.entries(baseEng)) {
    if (engVal.trim().toLowerCase() === lower) {
      const targetVal = baseDict?.[k];
      if (targetVal && targetVal.trim() !== "") return targetVal;
    }
  }
  for (const [k, engVal] of Object.entries(localeDictionaries.eng)) {
    if (String(engVal).trim().toLowerCase() === lower) {
      const targetVal = localeDictionaries[lang]?.[k];
      if (targetVal && targetVal.trim() !== "") return targetVal;
    }
  }
  for (const entry of Object.values(activeColumnMapping)) {
    if (entry?.eng && entry.eng.trim().toLowerCase() === lower) {
      const targetVal = entry[lang];
      if (targetVal && targetVal.trim() !== "") return targetVal;
    }
  }

  return null;
}

/**
 * Determine where a translation comes from ("json" | "google_translate" | "fallback")
 */
export function getTranslationSource(keyOrText: string, lang: SupportedLang = "eng"): "json" | "google_translate" | "fallback" {
  if (lookupJsonTranslation(keyOrText, lang)) {
    return "json";
  }
  if (lang !== "eng") {
    const colEntry = activeColumnMapping[keyOrText];
    const sourceEng =
      colEntry?.eng ||
      localeDictionaries.eng[keyOrText] ||
      (baseUiTranslations.eng as Record<string, string>)[keyOrText] ||
      formatIdentifierToEnglish(keyOrText);
    if (googleTranslateCache[lang]?.[keyOrText] || googleTranslateCache[lang]?.[sourceEng]) {
      return "google_translate";
    }
  }
  return "fallback";
}

/**
 * Get display label for any database column name based on active language.
 * Rule:
 *   1. If language JSON contains value -> return it directly from JSON.
 *   2. Else (for non-eng) -> use cached Google Translate result or trigger Google Translate fallback & auto-refresh.
 *   3. While fetching or in eng -> clean English label.
 */
export function getDbColumnLabel(columnName: string, lang: SupportedLang = "eng"): string {
  if (!columnName) return "";

  const fromJson = lookupJsonTranslation(columnName, lang);
  if (fromJson) {
    return fromJson;
  }

  const colEntry = activeColumnMapping[columnName];
  const sourceEnglish =
    (colEntry && colEntry.eng) ||
    localeDictionaries.eng[columnName] ||
    (baseUiTranslations.eng as Record<string, string>)[columnName] ||
    formatIdentifierToEnglish(columnName);

  if (lang === "eng") {
    return sourceEnglish;
  }

  // Check Google Translate cache
  const cached = googleTranslateCache[lang]?.[columnName] || googleTranslateCache[lang]?.[sourceEnglish];
  if (cached) {
    return cached;
  }

  // Trigger async Google Translate lookup (re-renders subscribed UI once returned)
  scheduleGoogleTranslate(columnName, sourceEnglish, lang);
  return sourceEnglish;
}

/**
 * Shorthand alias for getDbColumnLabel
 */
export const tCol = getDbColumnLabel;

/**
 * Translate ANY UI key or English phrase:
 *   - Checks language JSON first (db_column_mapping, locales/*.json, baseUiTranslations).
 *   - Falls back to Google Translate if missing from JSON (and caches + re-renders automatically).
 */
export function translateUiText(keyOrEnglishText: string, lang: SupportedLang = "eng"): string {
  return getDbColumnLabel(keyOrEnglishText, lang);
}

export const tText = translateUiText;

/**
 * Imperative async Google Translate helper (JSON first, else calls Google Translate API directly)
 */
export async function translateTextNow(
  textOrKey: string,
  targetLang: SupportedLang,
  key?: string
): Promise<{ translatedText: string; source: "json" | "cache" | "google_translate" | "fallback" }> {
  const fromJson = lookupJsonTranslation(key || textOrKey, targetLang) || lookupJsonTranslation(textOrKey, targetLang);
  if (fromJson) {
    return { translatedText: fromJson, source: "json" };
  }
  if (targetLang === "eng") {
    return { translatedText: textOrKey, source: "json" };
  }

  const cached = (key && googleTranslateCache[targetLang]?.[key]) || googleTranslateCache[targetLang]?.[textOrKey];
  if (cached) {
    return { translatedText: cached, source: "cache" };
  }

  try {
    const res = await fetch(`${resolveApiBaseUrl()}/i18n/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textOrKey, key, targetLang })
    });
    if (res.ok) {
      const json = await res.json();
      const data = json?.data;
      if (data?.translatedText) {
        if (data.source === "google_translate" || data.source === "cache") {
          googleTranslateCache[targetLang][textOrKey] = data.translatedText;
          if (key) googleTranslateCache[targetLang][key] = data.translatedText;
          saveGoogleTranslateCache();
          notifyTranslationListeners();
        }
        return {
          translatedText: data.translatedText,
          source: data.source || "google_translate"
        };
      }
    }
  } catch {
    // Fallback
  }

  return { translatedText: textOrKey, source: "fallback" };
}

/**
 * Helpers for persisting & restoring user's preferred language locally
 */
export function getSavedLanguage(userId?: number | string | null): SupportedLang {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      if (userId) {
        const userSpecific = window.localStorage.getItem(`gtax_user_lang_${userId}`);
        if (userSpecific === "eng" || userSpecific === "nep" || userSpecific === "ind") {
          return userSpecific;
        }
      }
      const globalSaved = window.localStorage.getItem(STORAGE_KEY_CURRENT_LANG);
      if (globalSaved === "eng" || globalSaved === "nep" || globalSaved === "ind") {
        return globalSaved;
      }
    }
  } catch {
    // ignore storage errors
  }
  return "eng";
}

export function persistLanguageLocally(lang: SupportedLang, userId?: number | string | null): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_CURRENT_LANG, lang);
      if (userId) {
        window.localStorage.setItem(`gtax_user_lang_${userId}`, lang);
      }
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "nep" ? "ne" : lang === "ind" ? "hi" : "en";
    }
  } catch {
    // ignore
  }
}

/**
 * Get current active column mappings
 */
export function getActiveDbColumnMapping(): DbColumnMappingDictionary {
  return { ...activeColumnMapping };
}

/**
 * Update mapping dynamically (auto-reflects in UI without reload)
 */
export function updateDbColumnMapping(updated: DbColumnMappingDictionary): void {
  activeColumnMapping = { ...activeColumnMapping, ...updated };
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_DB_COLUMNS, JSON.stringify(activeColumnMapping));
    }
  } catch (e) {
    console.error("Failed to save mapping to localStorage", e);
  }
  mappingListeners.forEach((fn) => {
    try {
      fn(activeColumnMapping);
    } catch (err) {
      console.error(err);
    }
  });
  notifyTranslationListeners();
}

/**
 * Reset mapping back to the pristine db_column_mapping.json file
 */
export function resetDbColumnMappingToDefault(): void {
  activeColumnMapping = { ...rawColumnMapping.columns };
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY_DB_COLUMNS);
    }
  } catch (e) {
    console.error("Failed to reset mapping", e);
  }
  mappingListeners.forEach((fn) => {
    try {
      fn(activeColumnMapping);
    } catch (err) {
      console.error(err);
    }
  });
  notifyTranslationListeners();
}

/**
 * Export current mapping as formatted JSON string
 */
export function exportDbColumnMappingJson(): string {
  return JSON.stringify(
    {
      _metadata: {
        ...rawColumnMapping._metadata,
        exported_at: new Date().toISOString()
      },
      columns: activeColumnMapping
    },
    null,
    2
  );
}

/**
 * Subscribe to column mapping changes
 */
export function subscribeToColumnMapping(callback: MappingChangeListener): () => void {
  mappingListeners.add(callback);
  return () => {
    mappingListeners.delete(callback);
  };
}

/**
 * Base UI Application Translations
 */
export const baseUiTranslations = {
  eng: {
    appTitle: "gtax Enterprise Property & Municipal Tax Engine",
    appSubtitle: "Multi-Jurisdictional Tax Liabilities & Real-Time Sync",
    theme: "Theme",
    language: "Language",
    dashboard: "Dashboard",
    taxpayer: "Taxpayer",
    calculation: "Calculation",
    calculationStudio: "Calculation Studio",
    multiYearEngine: "Multi-Year Engine",
    master: "Master",
    rateMasters: "Rate Masters",
    measurementUnit: "Measurement Unit",
    user: "User",
    usersAndRoles: "Users & Roles",
    companyProfile: "Company Profile",
    auditLogs: "Audit Logs",
    privacyPolicy: "Privacy Policy",
    signOut: "Sign Out",
    resetPassword: "Reset Password",
    resetAllPasswords: "Reset All Passwords",
    ownAccount: "Own Account",
    userManagement: "User Management",
    addUser: "Add User",
    taxpayerWorkflow: "Taxpayer Property Entry Steps",
    step1: "1. Fiscal Year",
    step2: "2. Units & Natures",
    step3: "3. Valuation Rates",
    step4: "4. Taxpayer Master",
    step5: "5. Land Assets (Kitta)",
    step6: "6. House & Floors",
    step7: "7. Tax Assessment",
    fiscalYear: "Fiscal Year",
    units: "Measuring Units",
    landRates: "Land Valuation Rates",
    malpotRates: "Malpot (Govt) Rates",
    constructionTypes: "Construction Types",
    constructionRates: "Construction Rates",
    depreciation: "Depreciation Slabs",
    fineRebate: "Fine & Rebates",
    landNature: "Land Nature / Zoning",
    taxpayerMaster: "Taxpayer Master",
    landEntry: "Land Parcel (Kitta) Entry",
    houseEntry: "Building (House) Entry",
    floorEntry: "Floor Breakdown Entry",
    code: "Code",
    fullname: "Full Name",
    dateFromBs: "Date From (BS)",
    dateFromAd: "Date From (AD)",
    dateToBs: "Date To (BS)",
    dateToAd: "Date To (AD)",
    ratePerUnit: "Rate Per Unit (NPR / INR)",
    wardNo: "Ward Numbers",
    kittaNo: "Kitta Number",
    mothNo: "Moth Number",
    areaSqFt: "Area (Sq. Feet)",
    plinthArea: "Plinth Area",
    houseNo: "House Number",
    floorNo: "Floor Number",
    actions: "Actions",
    add: "Add New",
    save: "Save Record",
    calculate: "Calculate Total Tax",
    printBill: "Print Official Tax Bill",
    assessedValuation: "Assessed Valuation",
    taxLiability: "Net Tax Liability",
    auditStatus: "BaseFrame Audit Verified"
  },
  nep: {
    appTitle: "जि-ट्याक्स नगरपालिका सम्पत्ति तथा भूमिकर प्रणाली",
    appSubtitle: "बहु-क्षेत्रीय कर दायित्व तथा वास्तविक-समय डाटा समक्रमण",
    theme: "रंग / थिम",
    language: "भाषा",
    dashboard: "ड्यासबोर्ड",
    taxpayer: "करदाता",
    calculation: "कर गणना",
    calculationStudio: "गणना स्टुडियो",
    multiYearEngine: "बहु-वर्षीय कर इन्जिन",
    master: "मास्टर सेटअप",
    rateMasters: "दररेट मास्टर",
    measurementUnit: "मापन एकाई",
    user: "प्रयोगकर्ता",
    usersAndRoles: "प्रयोगकर्ता र भूमिका",
    companyProfile: "संस्था विवरण",
    auditLogs: "अडिट लगहरू",
    privacyPolicy: "गोपनीयता नीति",
    signOut: "बाहिर निस्कनुहोस्",
    resetPassword: "पासवर्ड रिसेट",
    resetAllPasswords: "सबै पासवर्ड रिसेट गर्नुहोस्",
    ownAccount: "आफ्नै खाता",
    userManagement: "प्रयोगकर्ता व्यवस्थापन",
    addUser: "नयाँ प्रयोगकर्ता",
    taxpayerWorkflow: "करदाता प्रविष्टि चरणहरू",
    step1: "१. आर्थिक वर्ष",
    step2: "२. एकाई र प्रकृतिका विवरण",
    step3: "३. मूल्यांकन दररेट",
    step4: "४. करदाता दर्ता",
    step5: "५. जग्गा विवरण (कित्ता)",
    step6: "६. घर तथा तला विवरण",
    step7: "७. कर मूल्यांकन तथा रसिद",
    fiscalYear: "आर्थिक वर्ष",
    units: "मापन एकाई (रोपनी/आना/कठ्ठा/वर्गफुट)",
    landRates: "जग्गाको सरकारी/स्थानीय मूल्यांकन दर",
    malpotRates: "मालपोत मूल्यांकन दर",
    constructionTypes: "संरचना निर्माण प्रकार (RCC/काठ/इँटा)",
    constructionRates: "भवन निर्माण दररेट",
    depreciation: "ह्रासकट्टी (Depreciation) प्रतिशत",
    fineRebate: "जरिवाना तथा छुट नीति",
    landNature: "जग्गाको प्रकृति (कृषि/व्यापारिक/आवासीय)",
    taxpayerMaster: "करदाता मुख्य दर्ता",
    landEntry: "जग्गा कित्ता विवरण प्रविष्टि",
    houseEntry: "घर तथा भवन विवरण",
    floorEntry: "तलागत क्षेत्रफल तथा दररेट",
    code: "संकेत / कोड",
    fullname: "पूरा नाम / विवरण",
    dateFromBs: "सुरु मिति (वि.सं.)",
    dateFromAd: "सुरु मिति (ई.सं.)",
    dateToBs: "अन्त्य मिति (वि.सं.)",
    dateToAd: "अन्त्य मिति (ई.सं.)",
    ratePerUnit: "प्रति एकाई दर (रु.)",
    wardNo: "वडा नं.",
    kittaNo: "कित्ता नं.",
    mothNo: "मोठ नं.",
    areaSqFt: "क्षेत्रफल (वर्गफुट)",
    plinthArea: "प्लिन्थ एरिया",
    houseNo: "घर नं.",
    floorNo: "तला नं.",
    actions: "कार्यहरू",
    add: "नयाँ थप्नुहोस्",
    save: "सुरक्षित गर्नुहोस्",
    calculate: "सम्पत्ति कर हिसाब गर्नुहोस्",
    printBill: "कर रसिद / बिल प्रिन्ट गर्नुहोस्",
    assessedValuation: "कुल मूल्यांकन रकम",
    taxLiability: "तिर्नुपर्ने खुद कर रकम",
    auditStatus: "अडिट स्तम्भ प्रमाणीकृत"
  },
  ind: {
    appTitle: "जी-टैक्स संपत्ति एवं नगर निगम कर मूल्यांकन प्रणाली",
    appSubtitle: "बहु-क्षेत्रीय कर देयता एवं रियल-टाइम डाटा सिंक्रोनाइज़ेशन",
    theme: "थीम",
    language: "भाषा",
    dashboard: "डैशबोर्ड",
    taxpayer: "करदाता",
    calculation: "कर गणना",
    calculationStudio: "गणना स्टूडियो",
    multiYearEngine: "बहु-वर्षीय इंजन",
    master: "मास्टर सेटअप",
    rateMasters: "दर मास्टर",
    measurementUnit: "मापन इकाई",
    user: "उपयोगकर्ता",
    usersAndRoles: "उपयोगकर्ता और भूमिकाएँ",
    companyProfile: "संस्था प्रोफ़ाइल",
    auditLogs: "ऑडिट लॉग",
    privacyPolicy: "गोपनीयता नीति",
    signOut: "साइन आउट",
    resetPassword: "पासवर्ड रीसेट",
    resetAllPasswords: "सभी पासवर्ड रीसेट करें",
    ownAccount: "स्वयं का खाता",
    userManagement: "उपयोगकर्ता प्रबंधन",
    addUser: "नया उपयोगकर्ता जोड़ें",
    taxpayerWorkflow: "करदाता प्रविष्टि चरण",
    step1: "१. वित्तीय वर्ष",
    step2: "२. मापन इकाइयाँ एवं प्रकार",
    step3: "३. सर्किल एवं मूल्यांकन दरें",
    step4: "४. करदाता पंजीकरण",
    step5: "५. भूमि खसरा / कित्ता",
    step6: "६. भवन एवं मंजिलों का विवरण",
    step7: "७. कर निर्धारण एवं रसीद",
    fiscalYear: "वित्तीय वर्ष (Fiscal Year)",
    units: "मापन इकाइयाँ (वर्गफुट / गज / बीघा)",
    landRates: "भूमि सर्किल दरें",
    malpotRates: "राजस्व मूल्यांकन दरें",
    constructionTypes: "निर्माण प्रकार (आरसीसी / ईंट / स्टील)",
    constructionRates: "भवन निर्माण दरें",
    depreciation: "मूल्यह्रास (Depreciation) दर",
    fineRebate: "जुर्माना एवं छूट नियम",
    landNature: "भूमि की प्रकृति (कृषि / व्यावसायिक / आवासीय)",
    taxpayerMaster: "करदाता मास्टर रिकॉर्ड",
    landEntry: "भूमि / खसरा संख्या प्रविष्टि",
    houseEntry: "भवन एवं मकान विवरण",
    floorEntry: "मंजिलवार क्षेत्रफल एवं दर",
    code: "कोड",
    fullname: "पूरा नाम",
    dateFromBs: "प्रारंभ तिथि (संवत)",
    dateFromAd: "प्रारंभ तिथि (ईस्वी)",
    dateToBs: "समाप्ति तिथि (संवत)",
    dateToAd: "समाप्ति तिथि (ईस्वी)",
    ratePerUnit: "प्रति इकाई दर (रुपये)",
    wardNo: "वार्ड संख्या",
    kittaNo: "खसरा / कित्ता सं.",
    mothNo: "खाता / मोठ सं.",
    areaSqFt: "क्षेत्रफल (वर्गफुट)",
    plinthArea: "प्लिंथ एरिया",
    houseNo: "मकान नंबर",
    floorNo: "मंजिल संख्या",
    actions: "कार्रवाई",
    add: "नया जोड़ें",
    save: "सुरक्षित करें",
    calculate: "कुल कर की गणना करें",
    printBill: "आधिकारिक टैक्स रसीद प्रिंट करें",
    assessedValuation: "मूल्यांकन मूल्य",
    taxLiability: "देय कुल संपत्ति कर",
    auditStatus: "ऑडिट ट्रेल्स सत्यापित"
  }
};

/**
 * Proxy-based translations object so `translations[lang][key]` resolves:
 *   1. Language JSON files (baseUiTranslations, locales/*.json, db_column_mapping.json)
 *   2. Google Translate fallback cache (and triggers live Google Translate if missing from JSON)
 */
export function getMergedTranslations(lang: SupportedLang) {
  const base = baseUiTranslations[lang] || baseUiTranslations.eng;
  return new Proxy(base as any, {
    get(target, prop: string | symbol) {
      if (typeof prop !== "string") return target[prop];
      if (prop in target && typeof target[prop] === "string" && target[prop].trim() !== "") {
        return target[prop];
      }
      const fromJson = lookupJsonTranslation(prop, lang);
      if (fromJson) {
        return fromJson;
      }
      if (prop in target) {
        return target[prop];
      }
      return getDbColumnLabel(prop, lang);
    }
  });
}

export const translations = {
  get eng() {
    return getMergedTranslations("eng");
  },
  get nep() {
    return getMergedTranslations("nep");
  },
  get ind() {
    return getMergedTranslations("ind");
  }
};
