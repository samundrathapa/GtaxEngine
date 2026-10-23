import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/localization_service.dart';
import 'taxpayer_list_screen.dart';
import 'registration_wizard_screen.dart';
import 'ai_assistant_screen.dart';
import 'calculation_screen.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int) onNavigateTab;
  const DashboardScreen({Key? key, required this.onNavigateTab}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _api = ApiService();
  final LocalizationService _locale = LocalizationService();
  Map<String, dynamic>? _summary;
  List<Map<String, dynamic>> _recentTaxpayers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final summary = await _api.getDashboardSummary();
    final recents = await _api.quickSearch('');
    if (mounted) {
      setState(() {
        _summary = summary;
        _recentTaxpayers = recents;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _locale.translate('app_title'),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const Text(
              'FY 2081/82 • Single Common Entry Mobile',
              style: TextStyle(fontSize: 11, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
          IconButton(
            icon: const Icon(Icons.smart_toy_outlined),
            onPressed: () => widget.onNavigateTab(2), // Switch to AI tab
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // System Topology Status Banner
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.hub_outlined, color: Colors.blue.shade700, size: 28),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "Restructured 4-Tier Topology Active",
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.blue.shade900,
                                    fontSize: 13,
                                  ),
                                ),
                                Text(
                                  "client • server • ai • mobileapp (iOS & Android Ready)",
                                  style: TextStyle(color: Colors.blue.shade700, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.emerald?.shade100 ?? Colors.green.shade100,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Text(
                              "ONLINE",
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green),
                            ),
                          )
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Quick Action Buttons
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.indigo.shade600,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            icon: const Icon(Icons.calculate, size: 18),
                            label: const Text("Calculate Tax", style: TextStyle(fontSize: 12)),
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const CalculationScreen()),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.teal.shade700,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            icon: const Icon(Icons.person_add_alt_1, size: 18),
                            label: const Text("1-Door Register", style: TextStyle(fontSize: 12)),
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const RegistrationWizardScreen()),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Metrics Cards Grid
                    Text(
                      "Municipal Overview",
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 10),
                    GridView.count(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      childAspectRatio: 1.5,
                      children: [
                        _buildMetricCard(
                          title: "Total Taxpayers",
                          value: "${_summary?['totalTaxpayers'] ?? 124}",
                          icon: Icons.people_outline,
                          color: Colors.blue,
                        ),
                        _buildMetricCard(
                          title: "Properties Registered",
                          value: "${_summary?['totalProperties'] ?? 310}",
                          icon: Icons.home_work_outlined,
                          color: Colors.indigo,
                        ),
                        _buildMetricCard(
                          title: "Active Fiscal Year",
                          value: "${_summary?['currentFiscalYear'] ?? '2081/82'}",
                          icon: Icons.calendar_today_outlined,
                          color: Colors.teal,
                        ),
                        _buildMetricCard(
                          title: "Pending Valuations",
                          value: "${_summary?['pendingAssessments'] ?? 18}",
                          icon: Icons.pending_actions_outlined,
                          color: Colors.orange,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Recent Taxpayers
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "Recent Taxpayer Dossiers",
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        TextButton(
                          onPressed: () => widget.onNavigateTab(1),
                          child: const Text("View All", style: TextStyle(fontSize: 12)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _recentTaxpayers.length,
                      itemBuilder: (context, index) {
                        final tp = _recentTaxpayers[index];
                        return Card(
                          elevation: 0.5,
                          margin: const EdgeInsets.only(bottom: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: Colors.indigo.shade50,
                              child: Text(
                                (tp['fullname'] ?? 'T')[0].toUpperCase(),
                                style: TextStyle(color: Colors.indigo.shade800, fontWeight: FontWeight.bold),
                              ),
                            ),
                            title: Text(
                              tp['fullname'] ?? '',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            subtitle: Text(
                              "Code: ${tp['code']} • Ward: ${tp['ward']} • Mobile: ${tp['mobile']}",
                              style: const TextStyle(fontSize: 11),
                            ),
                            trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => TaxpayerListScreen(initialTaxpayerId: tp['id']),
                                ),
                              );
                            },
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(fontSize: 11, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
              ),
              Icon(icon, size: 18, color: color),
            ],
          ),
          Text(
            value,
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color.withOpacity(0.9)),
          ),
        ],
      ),
    );
  }
}
