import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import 'api_service.dart';

class AiService {
  static final AiService _instance = AiService._internal();
  factory AiService() => _instance;
  AiService._internal();

  /// Send prompt to Gemini AI Tax Assistant
  Future<String> queryAiAssistant(String message, {Map<String, dynamic>? context}) async {
    final api = ApiService();
    try {
      final res = await http.post(
        Uri.parse('${api.baseUrl}${AppConfig.aiChat}'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({
          'message': message,
          'context': context ?? {
            'fiscalYear': AppConfig.currentFiscalYear,
            'jurisdiction': 'Kathmandu Metropolitan City',
          },
        }),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body)['data'];
        if (data != null && data['reply'] != null) {
          return data['reply'];
        }
      }
    } catch (_) {}

    // Smart on-device fallback when offline
    final lower = message.toLowerCase();
    if (lower.contains('land') || lower.contains('जग्गा') || lower.contains('kitta')) {
      return "gtax Mobile AI: Land valuation is assessed by converting area (Ropani-Aana or Bigha-Kattha) into square feet and multiplying by the circle rate approved by the municipality for the current fiscal year.";
    }
    if (lower.contains('house') || lower.contains('floor') || lower.contains('घर') || lower.contains('तला')) {
      return "gtax Mobile AI: House structures are evaluated per floor slab (Area × Construction Rate − Structural Depreciation %). Multiple lands connected to a single house automatically link their kitta numbers.";
    }
    if (lower.contains('formula') || lower.contains('tax') || lower.contains('कर')) {
      return "gtax Mobile AI: Total Evaluated Amount = Land Assessed Valuation + House/Floor Valuation. Progressive IPT slabs apply with standard sanitation fee and 10% prompt payment discount.";
    }

    return "gtax Mobile AI: Assistant is ready to help with taxpayer registration, multi-kitta land parcels, RCC/brick building depreciation, and municipal tax assessments.";
  }

  /// Parse spoken voice commands into structured mobile actions
  Future<Map<String, dynamic>> parseVoiceIntent(String transcript) async {
    final lower = transcript.toLowerCase();
    if (lower.contains('search') || lower.contains('find') || lower.contains('खोज')) {
      return {'intent': 'NAVIGATE_SEARCH', 'query': transcript};
    }
    if (lower.contains('add') || lower.contains('register') || lower.contains('नयाँ')) {
      return {'intent': 'NAVIGATE_REGISTRATION', 'query': transcript};
    }
    if (lower.contains('tax') || lower.contains('calculate') || lower.contains('हिसाब')) {
      return {'intent': 'CALCULATE_TAX', 'query': transcript};
    }
    return {'intent': 'AI_CHAT', 'query': transcript};
  }
}
