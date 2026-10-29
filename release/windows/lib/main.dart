import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'config/app_config.dart';
import 'services/api_service.dart';
import 'services/localization_service.dart';
import 'screens/dashboard_screen.dart';
import 'screens/taxpayer_list_screen.dart';
import 'screens/ai_assistant_screen.dart';
import 'screens/hybrid_web_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/calculation_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const GtaxMobileApp());
}

/// Single Common Entry Point for Flutter iOS & Android
class GtaxMobileApp extends StatefulWidget {
  const GtaxMobileApp({Key? key}) : super(key: key);

  @override
  State<GtaxMobileApp> createState() => _GtaxMobileAppState();
}

class _GtaxMobileAppState extends State<GtaxMobileApp> {
  final LocalizationService _localeService = LocalizationService();
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _localeService.addListener(_onLocaleChanged);
    _apiService.initSession();
  }

  @override
  void dispose() {
    _localeService.removeListener(_onLocaleChanged);
    super.dispose();
  }

  void _onLocaleChanged() {
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E3A8A), // Indigo / Deep Blue
          brightness: Brightness.light,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1E3A8A),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en', 'US'),
        Locale('ne', 'NP'),
        Locale('hi', 'IN'),
      ],
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({Key? key}) : super(key: key);

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;
  final LocalizationService _locale = LocalizationService();

  void _setTab(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      DashboardScreen(onNavigateTab: _setTab),
      const TaxpayerListScreen(),
      const CalculationScreen(),
      AiAssistantScreen(onNavigateTab: _setTab),
      const SettingsScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: _setTab,
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.dashboard_outlined),
            selectedIcon: const Icon(Icons.dashboard),
            label: _locale.translate('dashboard'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.people_outline),
            selectedIcon: const Icon(Icons.people),
            label: _locale.translate('taxpayers'),
          ),
          const NavigationDestination(
            icon: Icon(Icons.calculate_outlined),
            selectedIcon: Icon(Icons.calculate),
            label: "Calculate",
          ),
          NavigationDestination(
            icon: const Icon(Icons.smart_toy_outlined),
            selectedIcon: const Icon(Icons.smart_toy),
            label: _locale.translate('ai_assistant'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.settings_outlined),
            selectedIcon: const Icon(Icons.settings),
            label: _locale.translate('settings'),
          ),
        ],
      ),
    );
  }
}
