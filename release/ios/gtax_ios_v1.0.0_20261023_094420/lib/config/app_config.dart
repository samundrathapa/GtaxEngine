import 'package:flutter/foundation.dart';

/// Single Common Entry Point Configuration for Flutter Mobile App (iOS & Android)
class AppConfig {
  static const String appName = "gtax Mobile";
  static const String appVersion = "2.5.0+2";
  static const String currentFiscalYear = "2081/82";

  /// Single common entry point backend host:
  /// - In local Android emulator: 10.0.2.2:3000
  /// - In local iOS simulator: 127.0.0.1:3000
  /// - In production / cloud deployed: Cloud Run or custom host URL
  static String defaultBaseUrl = kIsWeb
      ? ""
      : (defaultTargetPlatform == TargetPlatform.android
          ? "http://10.0.2.2:3000"
          : "http://127.0.0.1:3000");

  /// Relative API path prefix
  static const String apiPrefix = "/api/v1";

  /// Core Endpoints
  static String get commonEntryManifest => "$apiPrefix/entry/manifest";
  static String get authLogin => "$apiPrefix/auth/login";
  static String get authSession => "$apiPrefix/auth/session";
  static String get mobileBoot => "$apiPrefix/mobile/boot-config";
  static String get mobileSummary => "$apiPrefix/mobile/dashboard-summary";
  static String get mobileQuickSearch => "$apiPrefix/mobile/quick-search";
  static String get taxpayerList => "$apiPrefix/property/taxpayers";
  static String taxpayerDossier(int id) => "$apiPrefix/property/taxpayers/$id";
  static String get masterTables => "$apiPrefix/property/masters";
  static String get calculationSave => "$apiPrefix/property/calculation/save";
  static String get calculationHistory => "$apiPrefix/property/calculation/history";
  static String ratesCategory(String category) => "$apiPrefix/property/rates/$category";
  static String get aiChat => "$apiPrefix/ai/chat";
  static String get aiVoiceIntent => "$apiPrefix/ai/voice-intent";

  /// Supported UI Languages matching web db_column_mapping.json
  static const List<Map<String, String>> supportedLanguages = [
    {"code": "eng", "label": "English", "flag": "🇺🇸"},
    {"code": "nep", "label": "नेपाली", "flag": "🇳🇵"},
    {"code": "ind", "label": "हिन्दी", "flag": "🇮🇳"},
  ];
}
