import rawColumnMapping from "../i18n/db_column_mapping.json";

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

// LocalStorage key for persisting dynamic JSON updates made in-app
const STORAGE_KEY_DB_COLUMNS = "gtax_db_column_mapping_override";
const STORAGE_KEY_CURRENT_LANG = "gtax_current_language";

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

// Listeners for live auto-reflection across all components
type MappingChangeListener = (mapping: DbColumnMappingDictionary) => void;
type LangChangeListener = (lang: SupportedLang) => void;

const mappingListeners: Set<MappingChangeListener> = new Set();
const langListeners: Set<LangChangeListener> = new Set();

/**
 * Get display label for any database column name based on active language.
 * If columnName is in json mapping, returns localized string.
 * Otherwise formats columnName cleanly (e.g. "kitta_number" -> "Kitta Number").
 */
export function getDbColumnLabel(columnName: string, lang: SupportedLang = "eng"): string {
  if (!columnName) return "";
  const entry = activeColumnMapping[columnName];
  if (entry && entry[lang]) {
    return entry[lang] as string;
  }
  if (entry && entry.eng) {
    return entry.eng;
  }
  // Fallback: convert snake_case to Title Case
  return columnName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Shorthand alias for getDbColumnLabel
 */
export const tCol = getDbColumnLabel;

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
  // Notify all listeners
  mappingListeners.forEach((fn) => {
    try {
      fn(activeColumnMapping);
    } catch (err) {
      console.error(err);
    }
  });
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
 * Proxy-based translations object so `translations[lang][key]` can resolve
 * both standard keys AND any `db_column_name` from the JSON mapping!
 */
export function getMergedTranslations(lang: SupportedLang) {
  const base = baseUiTranslations[lang] || baseUiTranslations.eng;
  return new Proxy(base as any, {
    get(target, prop: string) {
      if (prop in target) {
        return target[prop];
      }
      // Check db_column_mapping
      const colEntry = activeColumnMapping[prop];
      if (colEntry && colEntry[lang]) {
        return colEntry[lang];
      }
      return target[prop];
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
