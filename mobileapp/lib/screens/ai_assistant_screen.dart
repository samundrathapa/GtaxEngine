import 'package:flutter/material.dart';
import '../services/ai_service.dart';
import '../services/api_service.dart';
import 'registration_wizard_screen.dart';
import 'calculation_screen.dart';
import 'taxpayer_dossier_screen.dart';

class AiAssistantScreen extends StatefulWidget {
  final Function(int)? onNavigateTab;
  const AiAssistantScreen({Key? key, this.onNavigateTab}) : super(key: key);

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final AiService _ai = AiService();
  final ApiService _api = ApiService();
  final TextEditingController _textCtrl = TextEditingController();

  final List<Map<String, dynamic>> _messages = [
    {
      "role": "assistant",
      "text": "Namaste! I am the gtax AI Municipal Tax Assistant. You can speak or type:\n• 'open taxpayer' → Opens registration\n• 'list taxpayer today registered' → Shows today's citizens\n• 'add landrate 1 to land rate' → Auto-inserts Land Rate 1\n• 'calculate tax' → Launches calculation engine",
      "action": null,
      "taxpayers": null,
      "landRate": null,
    }
  ];
  bool _isSending = false;

  final List<String> _quickChips = [
    "open taxpayer",
    "list taxpayer today registered",
    "add landrate 1 to land rate",
    "calculate tax",
    "Explain progressive tax slabs",
  ];

  Future<void> _sendMessage(String text) async {
    final query = text.trim();
    if (query.isEmpty) return;

    setState(() {
      _messages.add({"role": "user", "text": query});
      _isSending = true;
    });
    _textCtrl.clear();

    final lower = query.toLowerCase();

    // 1. Intent: "open taxpayer"
    if (lower.contains("open taxpayer") || lower.contains("new taxpayer") || lower.contains("करदाता दर्ता")) {
      await Future.delayed(const Duration(milliseconds: 300));
      if (mounted) {
        setState(() {
          _messages.add({
            "role": "assistant",
            "text": "Opening the New Taxpayer Registration wizard now!",
            "action": "opened_taxpayer"
          });
          _isSending = false;
        });
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const RegistrationWizardScreen()),
        );
      }
      return;
    }

    // 2. Intent: "calculate tax" / "open calculation"
    if (lower.contains("calculate") || lower.contains("गणना") || lower.contains("valuation")) {
      await Future.delayed(const Duration(milliseconds: 300));
      if (mounted) {
        setState(() {
          _messages.add({
            "role": "assistant",
            "text": "Launching the Frontend & Manual Property Tax Calculation Engine!",
            "action": "opened_calc"
          });
          _isSending = false;
        });
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const CalculationScreen()),
        );
      }
      return;
    }

    // 3. Intent: "list taxpayer today registered"
    if (lower.contains("list taxpayer") || lower.contains("today registered") || lower.contains("registered today")) {
      try {
        final tps = await _api.getTaxpayersList();
        final todayStr = DateTime.now().toIso8601String().substring(0, 10);
        final todayTps = tps.where((tp) {
          final ins = (tp['insert_on'] ?? '').toString();
          return ins.startsWith(todayStr);
        }).toList();

        final display = todayTps.isNotEmpty ? todayTps : tps;
        if (mounted) {
          setState(() {
            _messages.add({
              "role": "assistant",
              "text": todayTps.isNotEmpty
                  ? "Found ${todayTps.length} citizen(s) registered today ($todayStr):"
                  : "Showing ${display.length} active registered citizens in the system (0 registered today so far):",
              "action": "listed_taxpayers",
              "taxpayers": display,
            });
            _isSending = false;
          });
        }
        return;
      } catch (_) {}
    }

    // 4. Intent: "add landrate 1 to land rate"
    if ((lower.contains("add") || lower.contains("insert")) && (lower.contains("landrate") || lower.contains("land rate"))) {
      try {
        final res = await _api.insertLandRate({
          'code': 'LR-1',
          'fullanme': 'Land Rate 1 - Municipal Core Commercial & Residential',
          'rate_per_unit': 1200000,
          'ward_no_ids': '1,2,3',
          'fiscal_year_id': 2,
        });

        if (mounted) {
          setState(() {
            _messages.add({
              "role": "assistant",
              "text": "✅ Land Rate 1 has been automatically inserted into tbl_land_rate!\n• Code: LR-1\n• Rate: NPR 1,200,000 / Aana\n• Applicable Wards: 1, 2, 3\n• Fiscal Year: 2081/82",
              "action": "inserted_rate",
              "landRate": res,
            });
            _isSending = false;
          });
        }
        return;
      } catch (_) {}
    }

    // 5. Default Gemini AI Tax query
    final reply = await _ai.queryAiAssistant(query);
    if (mounted) {
      setState(() {
        _messages.add({"role": "assistant", "text": reply});
        _isSending = false;
      });
    }
  }

  void _simulateVoiceInput() {
    _sendMessage("open taxpayer");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.smart_toy, size: 20),
            SizedBox(width: 8),
            Text("AI Tax Assistant (Voice & Workflows)"),
          ],
        ),
      ),
      body: Column(
        children: [
          // Prompt suggestions
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
            color: Colors.grey.shade100,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _quickChips.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final chip = _quickChips[idx];
                return ActionChip(
                  label: Text(chip, style: const TextStyle(fontSize: 11)),
                  onPressed: () => _sendMessage(chip),
                  visualDensity: VisualDensity.compact,
                );
              },
            ),
          ),

          // Chat message list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, idx) {
                final m = _messages[idx];
                final isUser = m['role'] == 'user';
                final taxpayers = m['taxpayers'] as List?;
                final landRate = m['landRate'] as Map?;

                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.85),
                    decoration: BoxDecoration(
                      color: isUser ? Colors.indigo.shade600 : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: isUser ? null : Border.all(color: Colors.grey.shade300),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        )
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          m['text'] ?? '',
                          style: TextStyle(
                            color: isUser ? Colors.white : Colors.black87,
                            fontSize: 12.5,
                            height: 1.4,
                          ),
                        ),

                        // Render Taxpayer Cards if listed
                        if (taxpayers != null && taxpayers.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          ...taxpayers.map((tp) {
                            return Container(
                              margin: const EdgeInsets.only(top: 6),
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.blue.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.blue.shade200),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          tp['fullanme'] ?? tp['fullname'] ?? 'Taxpayer',
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                                        ),
                                        Text(
                                          "${tp['code']} • Ward ${tp['ward_no'] ?? 1}",
                                          style: const TextStyle(fontSize: 10, color: Colors.grey),
                                        ),
                                      ],
                                    ),
                                  ),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.blue.shade800,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      minimumSize: Size.zero,
                                    ),
                                    onPressed: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => TaxpayerDossierScreen(taxpayerId: tp['id'] as int),
                                        ),
                                      );
                                    },
                                    child: const Text("Dossier", style: TextStyle(fontSize: 10)),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ],

                        // Render Land Rate Card if inserted
                        if (landRate != null) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.green.shade50,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.green.shade200),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.check_circle, color: Colors.green, size: 16),
                                SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    "Rate ready for real-time land valuation & assessment",
                                    style: TextStyle(fontSize: 10, color: Colors.green, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          if (_isSending)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 4),
              child: LinearProgressIndicator(minHeight: 2),
            ),

          // Input field
          Container(
            padding: const EdgeInsets.all(8),
            color: Colors.white,
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.mic, color: Colors.indigo),
                  tooltip: "Simulate Voice Command ('open taxpayer')",
                  onPressed: _simulateVoiceInput,
                ),
                Expanded(
                  child: TextField(
                    controller: _textCtrl,
                    style: const TextStyle(fontSize: 12),
                    decoration: InputDecoration(
                      hintText: "Ask tax rules or speak 'open taxpayer'...",
                      hintStyle: const TextStyle(fontSize: 11),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                    onSubmitted: _sendMessage,
                  ),
                ),
                const SizedBox(width: 6),
                IconButton(
                  icon: const Icon(Icons.send, color: Colors.indigo),
                  onPressed: () => _sendMessage(_textCtrl.text),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
