import 'package:flutter/material.dart';

class LocalizationService extends ChangeNotifier {
  static final LocalizationService _instance = LocalizationService._internal();
  factory LocalizationService() => _instance;
  LocalizationService._internal();

  String _currentLocale = 'eng';
  String get currentLocale => _currentLocale;

  void setLocale(String langCode) {
    if (['eng', 'nep', 'ind'].contains(langCode)) {
      _currentLocale = langCode;
      notifyListeners();
    }
  }

  // Common UI dictionaries matching db_column_mapping.json
  static const Map<String, Map<String, String>> _translations = {
    'app_title': {
      'eng': 'gtax Municipal Tax Mobile',
      'nep': 'जि-ट्याक्स नगरपालिका कर मोबाइल',
      'ind': 'जी-टैक्स नगर पालिका कर मोबाइल',
    },
    'dashboard': {
      'eng': 'Dashboard',
      'nep': 'ड्यासबोर्ड',
      'ind': 'डैशबोर्ड',
    },
    'taxpayers': {
      'eng': 'Taxpayers',
      'nep': 'करदाताहरु',
      'ind': 'करदाता',
    },
    'one_door_registration': {
      'eng': 'One-Door Registration',
      'nep': 'एकद्वार करदाता दर्ता',
      'ind': 'एकल खिड़की पंजीकरण',
    },
    'ai_assistant': {
      'eng': 'AI Tax Advisor',
      'nep': 'एआई कर सल्लाहकार',
      'ind': 'एआई कर सलाहकार',
    },
    'portal_web': {
      'eng': 'Full Portal (Web)',
      'nep': 'पूर्ण पोर्टल (वेब)',
      'ind': 'पूर्ण पोर्टल (वेब)',
    },
    'settings': {
      'eng': 'Settings',
      'nep': 'सेटिङहरू',
      'ind': 'सेटिंग्स',
    },
    'search_hint': {
      'eng': 'Search by Name, PAN, Citizenship, Kitta...',
      'nep': 'नाम, प्यान, नागरिकता वा कित्ता नं. खोज्नुहोस्...',
      'ind': 'नाम, पैन, नागरिकता या कित्ता नंबर से खोजें...',
    },
    'kitta_number': {
      'eng': 'Kitta Number (Plot No.)',
      'nep': 'कित्ता नम्बर',
      'ind': 'कित्ता संख्या',
    },
    'area_sqft': {
      'eng': 'Area (Sq. Ft.)',
      'nep': 'क्षेत्रफल (वर्ग फिट)',
      'ind': 'क्षेत्रफल (वर्ग फुट)',
    },
    'assessed_valuation': {
      'eng': 'Assessed Valuation',
      'nep': 'मूल्याङ्कन रकम',
      'ind': 'मूल्यांकित राशि',
    },
    'net_payable_tax': {
      'eng': 'Net Tax Payable',
      'nep': 'जम्मा तिर्नुपर्ने कर',
      'ind': 'कुल देय कर',
    },
  };

  String translate(String key) {
    return _translations[key]?[_currentLocale] ?? key;
  }
}
