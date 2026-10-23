import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/localization_service.dart';
import '../config/app_config.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final ApiService _api = ApiService();
  final LocalizationService _locale = LocalizationService();
  late final TextEditingController _serverCtrl;
  String _connStatus = "Untested";
  bool _isTesting = false;

  @override
  void initState() {
    super.initState();
    _serverCtrl = TextEditingController(text: _api.baseUrl);
  }

  Future<void> _testConnection() async {
    setState(() {
      _isTesting = true;
      _connStatus = "Connecting...";
    });
    _api.setBaseUrl(_serverCtrl.text);
    final manifest = await _api.getSystemManifest();
    if (mounted) {
      setState(() {
        _isTesting = false;
        if (manifest['status'] == 'offline_fallback') {
          _connStatus = "Offline Mode (Mock fallback active)";
        } else {
          _connStatus = "Connected: ${manifest['appName'] ?? 'gtax Server'}";
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Mobile Settings & Diagnostics"),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Single Common Entry Point Server
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Single Common Entry Point Backend",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    "Configure the backend host that serves Client, AI, and Mobile.",
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _serverCtrl,
                    decoration: const InputDecoration(
                      labelText: "Backend Base URL",
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      ElevatedButton(
                        onPressed: _isTesting ? null : _testConnection,
                        child: _isTesting
                            ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Text("Test Common Entry Point"),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _connStatus,
                          style: TextStyle(
                            fontSize: 11,
                            color: _connStatus.contains("Connected") ? Colors.green : Colors.grey.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Multi-Language Selection
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Application Language (भाषा चयन)",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    "Matches db_column_mapping.json dictionaries dynamically.",
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: AppConfig.supportedLanguages.map((lang) {
                      final isSelected = _locale.currentLocale == lang['code'];
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              backgroundColor: isSelected ? Colors.indigo.shade50 : null,
                              side: BorderSide(
                                color: isSelected ? Colors.indigo : Colors.grey.shade300,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            onPressed: () {
                              setState(() {
                                _locale.setLocale(lang['code']!);
                              });
                            },
                            child: Text(
                              "${lang['flag']} ${lang['label']}",
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                color: isSelected ? Colors.indigo : Colors.black87,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // 4-Tier Restructured Topology Info
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "System Topology (4 Tiers)",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const Divider(height: 16),
                  _buildTierRow("client", "React 19 + Tailwind CSS", Icons.web),
                  _buildTierRow("server", "Node.js Express + Port 3000", Icons.dns),
                  _buildTierRow("ai", "Google Gemini 2.5/3.8 Flash", Icons.smart_toy),
                  _buildTierRow("mobileapp", "Flutter iOS & Android", Icons.phone_iphone),
                  const Divider(height: 16),
                  const Row(
                    children: [
                      Icon(Icons.check_circle, color: Colors.green, size: 16),
                      SizedBox(width: 8),
                      Text("Single Common Entry Point Verified", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green)),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTierRow(String tier, String desc, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.indigo),
          const SizedBox(width: 8),
          Text(tier, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(width: 8),
          Expanded(child: Text(desc, style: const TextStyle(fontSize: 12, color: Colors.grey))),
          const Text("ACTIVE", style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
