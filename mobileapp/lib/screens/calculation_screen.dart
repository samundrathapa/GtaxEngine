import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/localization_service.dart';
import '../models/taxpayer.dart';
import 'login_screen.dart';

class CalculationScreen extends StatefulWidget {
  final int? initialTaxpayerId;
  const CalculationScreen({Key? key, this.initialTaxpayerId}) : super(key: key);

  @override
  State<CalculationScreen> createState() => _CalculationScreenState();
}

class _CalculationScreenState extends State<CalculationScreen> with SingleTickerProviderStateMixin {
  final ApiService _api = ApiService();
  final LocalizationService _locale = LocalizationService();

  late TabController _tabController;
  bool _isLoading = true;
  bool _isSaving = false;
  String? _statusMessage;

  // Master Data & Taxpayers
  List<Map<String, dynamic>> _taxpayers = [];
  Map<String, dynamic> _masters = {};
  int _selectedTaxpayerId = 1;
  TaxpayerDossier? _dossier;

  // Calculation Parameters (Frontend & Manual Adjustments)
  bool _useMalpotRate = false;
  double _customTaxRatePercent = 0.10;
  bool _overrideAutoTaxRate = false;
  double _landAdjustPercent = 0.0;
  double _structureAdjustPercent = 0.0;
  String _fineRebateFactor = "rebate_10"; // rebate_10, none, fine_10, fine_20
  double _additionalSanitationFee = 500.0;
  double _additionalServicePercent = 1.0;

  // Calculation History
  List<Map<String, dynamic>> _historyList = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index == 1) {
        _loadHistory();
      }
    });
    if (widget.initialTaxpayerId != null) {
      _selectedTaxpayerId = widget.initialTaxpayerId!;
    }
    _loadInitialData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);
    final masters = await _api.getPropertyMasters();
    final tps = await _api.getTaxpayersList();

    if (mounted) {
      setState(() {
        _masters = masters;
        _taxpayers = tps;
        if (tps.isNotEmpty && widget.initialTaxpayerId == null) {
          _selectedTaxpayerId = tps.first['id'] as int;
        }
      });
      await _loadDossier(_selectedTaxpayerId);
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadDossier(int id) async {
    final dossier = await _api.getTaxpayerDossier(id);
    if (mounted) {
      setState(() {
        _dossier = dossier;
      });
    }
  }

  Future<void> _loadHistory() async {
    final list = await _api.getCalculationHistory();
    if (mounted) {
      setState(() => _historyList = list);
    }
  }

  // --- Dynamic Calculation Logic ---
  Map<String, dynamic> _computeTax() {
    if (_dossier == null) {
      return {
        'totalLandValuation': 0.0,
        'totalHouseValuation': 0.0,
        'totalPropertyValuation': 0.0,
        'appliedTaxRate': 0.10,
        'baseTax': 0.0,
        'rebateAmount': 0.0,
        'fineAmount': 0.0,
        'additionalAmount': 0.0,
        'totalTax': 0.0,
      };
    }

    // 1. Land valuation
    double totalLand = 0;
    for (final l in _dossier!.lands) {
      if (l.includeInEvaluation) {
        final double rate = _useMalpotRate ? 1000000.0 : 800000.0;
        final aana = l.areaSqfeet / 342.25;
        double baseVal = aana * rate;
        if (_landAdjustPercent != 0) {
          baseVal += baseVal * (_landAdjustPercent / 100.0);
        }
        totalLand += baseVal.clamp(0, double.infinity);
      }
    }

    // 2. House & Floor valuation
    double totalHouse = 0;
    for (final f in _dossier!.floors) {
      const double constRate = 2800.0;
      final raw = f.areaInSqft * constRate;
      final dep = raw * (f.depreciationRate / 100.0);
      double netFloor = (raw - dep).clamp(0, double.infinity);
      if (_structureAdjustPercent != 0) {
        netFloor += netFloor * (_structureAdjustPercent / 100.0);
      }
      totalHouse += netFloor;
    }

    // 3. Progressive Slabs & Base Tax
    final totalValuation = totalLand + totalHouse;
    double appliedRate = _customTaxRatePercent;
    if (!_overrideAutoTaxRate) {
      if (totalValuation > 10000000) {
        appliedRate = 0.20;
      } else if (totalValuation > 5000000) {
        appliedRate = 0.15;
      } else if (totalValuation > 1000000) {
        appliedRate = 0.10;
      } else {
        appliedRate = 0.05;
      }
    }

    final double baseTax = (totalValuation * (appliedRate / 100.0)).roundToDouble();

    // 4. Fines & Rebates
    double rebate = 0;
    double fine = 0;
    if (_fineRebateFactor == "rebate_10") {
      rebate = (baseTax * 0.10).roundToDouble();
    } else if (_fineRebateFactor == "fine_10") {
      fine = (baseTax * 0.10).roundToDouble();
    } else if (_fineRebateFactor == "fine_20") {
      fine = (baseTax * 0.20).roundToDouble();
    }

    // 5. Additional Levies
    final svc = (baseTax * (_additionalServicePercent / 100.0)).roundToDouble();
    final double additionals = _additionalSanitationFee + svc;

    final double finalTax = (baseTax - rebate + fine + additionals).clamp(0, double.infinity);

    return {
      'totalLandValuation': totalLand.roundToDouble(),
      'totalHouseValuation': totalHouse.roundToDouble(),
      'totalPropertyValuation': totalValuation.roundToDouble(),
      'appliedTaxRate': appliedRate,
      'baseTax': baseTax,
      'rebateAmount': rebate,
      'fineAmount': fine,
      'additionalAmount': additionals,
      'totalTax': finalTax,
    };
  }

  Future<void> _handleSaveCalculation(Map<String, dynamic> calc) async {
    if (_api.currentSession.isGuest) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: const [
              Icon(Icons.lock_outline, color: Color(0xFF1E3A8A), size: 22),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  "Staff Authentication Required",
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          content: const Text(
            "You are currently in Public Citizen / Guest mode. Tax calculation and rate viewing are unrestricted, but saving official municipal assessments to the municipal ledger requires authorized staff login.",
            style: TextStyle(fontSize: 12, height: 1.4),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text("Keep Calculating as Guest"),
            ),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1E3A8A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              icon: const Icon(Icons.login, size: 16),
              label: const Text("Staff Login", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen(isModal: true)),
                );
              },
            ),
          ],
        ),
      );
      return;
    }

    setState(() => _isSaving = true);
    final payload = {
      'taxpayer_id': _selectedTaxpayerId,
      'fiscal_year_id': 2,
      'total_tax': calc['totalTax'],
      'calculate_date_bs': '2081-07-02',
      'lands': [
        {
          'land_id': _dossier?.lands.firstOrNull?.id ?? 1,
          'unit_id': 3,
          'area_sqft': _dossier?.lands.firstOrNull?.areaSqfeet ?? 1369.0,
          'calculated_amount': calc['totalLandValuation'],
          'total_amount': calc['totalLandValuation'],
        }
      ],
      'additionals': [
        {
          'collection_rate_id': 1,
          'amount': calc['additionalAmount'],
        }
      ]
    };

    final res = await _api.saveCalculationMaster(payload);
    setState(() {
      _isSaving = false;
      _statusMessage = "Calculation saved successfully to municipal records!";
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Tax calculation for ${_dossier?.taxpayer.fullname ?? 'Taxpayer'} saved to DB!"),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final calc = _computeTax();

    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Tax Calculation Engine", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text("Frontend & Manual Valuation Matrix", style: TextStyle(fontSize: 11, color: Colors.white70)),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.amber,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(icon: Icon(Icons.calculate, size: 18), text: "Live Calculator"),
            Tab(icon: Icon(Icons.history, size: 18), text: "Saved History"),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildCalculatorTab(calc),
                _buildHistoryTab(),
              ],
            ),
    );
  }

  Widget _buildCalculatorTab(Map<String, dynamic> calc) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Taxpayer Selector Card
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.grey.shade300),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4, offset: const Offset(0, 2))
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.person, color: Color(0xFF1E3A8A), size: 18),
                    SizedBox(width: 6),
                    Text("Select Taxpayer to Assess", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<int>(
                  isExpanded: true,
                  icon: const Icon(Icons.arrow_drop_down_circle_outlined, color: Color(0xFF1E3A8A), size: 22),
                  iconSize: 22,
                  iconEnabledColor: const Color(0xFF1E3A8A),
                  value: _taxpayers.any((tp) => tp['id'] == _selectedTaxpayerId)
                      ? _selectedTaxpayerId
                      : (_taxpayers.isNotEmpty ? _taxpayers.first['id'] as int : null),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                  ),
                  items: _taxpayers.map((tp) {
                    return DropdownMenuItem<int>(
                      value: tp['id'] as int,
                      child: Text(
                        "${tp['fullanme'] ?? tp['fullname']} (${tp['code']})",
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                        overflow: TextOverflow.ellipsis,
                      ),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() => _selectedTaxpayerId = val);
                      _loadDossier(val);
                    }
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // STEP 1: Land Valuation Card
          _buildStepCard(
            stepNumber: 1,
            title: "Land Parcel Valuation (जग्गा मुल्यांकन)",
            color: Colors.blue.shade700,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text("Rate Matrix Source:", style: TextStyle(fontSize: 12)),
                  ToggleButtons(
                    isSelected: [!_useMalpotRate, _useMalpotRate],
                    borderRadius: BorderRadius.circular(8),
                    constraints: const BoxConstraints(minHeight: 28, minWidth: 70),
                    children: const [
                      Padding(padding: EdgeInsets.symmetric(horizontal: 6), child: Text("Municipal", style: TextStyle(fontSize: 11))),
                      Padding(padding: EdgeInsets.symmetric(horizontal: 6), child: Text("Malpot", style: TextStyle(fontSize: 11))),
                    ],
                    onPressed: (idx) {
                      setState(() => _useMalpotRate = idx == 1);
                    },
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Manual Land Adjust: ${_landAdjustPercent >= 0 ? '+' : ''}${_landAdjustPercent.toInt()}%",
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    "NPR ${calc['totalLandValuation'].toStringAsFixed(0)}",
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.blue.shade900),
                  ),
                ],
              ),
              Slider(
                value: _landAdjustPercent,
                min: -50,
                max: 50,
                divisions: 20,
                label: "${_landAdjustPercent.toInt()}%",
                onChanged: (val) => setState(() => _landAdjustPercent = val),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // STEP 2: House & Floor Valuation Card
          _buildStepCard(
            stepNumber: 2,
            title: "House & Floor Structure (घर तथा तला मुल्यांकन)",
            color: Colors.purple.shade700,
            children: [
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("Structure Standard:", style: TextStyle(fontSize: 12)),
                  SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      "RCC Frame (NPR 2,800/sqft)",
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.right,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Structure Adjust: ${_structureAdjustPercent >= 0 ? '+' : ''}${_structureAdjustPercent.toInt()}%",
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    "NPR ${calc['totalHouseValuation'].toStringAsFixed(0)}",
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.purple.shade900),
                  ),
                ],
              ),
              Slider(
                value: _structureAdjustPercent,
                min: -50,
                max: 50,
                divisions: 20,
                label: "${_structureAdjustPercent.toInt()}%",
                onChanged: (val) => setState(() => _structureAdjustPercent = val),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // STEP 3: Progressive Tax Slabs
          _buildStepCard(
            stepNumber: 3,
            title: "Tax Slab Assessment (प्रगतिशील कर दर)",
            color: Colors.teal.shade700,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text("Total Property Valuation:", style: TextStyle(fontSize: 12)),
                  Text(
                    "NPR ${calc['totalPropertyValuation'].toStringAsFixed(0)}",
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      "Applied Tax Rate: ${calc['appliedTaxRate']}%",
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.teal.shade900),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text("Override", style: TextStyle(fontSize: 10)),
                      const SizedBox(width: 4),
                      SizedBox(
                        height: 24,
                        child: Switch(
                          value: _overrideAutoTaxRate,
                          onChanged: (v) => setState(() => _overrideAutoTaxRate = v),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              if (_overrideAutoTaxRate)
                Slider(
                  value: _customTaxRatePercent,
                  min: 0.01,
                  max: 0.50,
                  divisions: 49,
                  label: "${_customTaxRatePercent.toStringAsFixed(2)}%",
                  onChanged: (v) => setState(() => _customTaxRatePercent = v),
                ),
            ],
          ),

          const SizedBox(height: 12),

          // STEP 4: Rebates & Penalties
          _buildStepCard(
            stepNumber: 4,
            title: "Fines & Early Rebate (जरिवाना तथा छुट)",
            color: Colors.amber.shade800,
            children: [
              Wrap(
                spacing: 8,
                children: [
                  ChoiceChip(
                    label: const Text("10% Early Rebate", style: TextStyle(fontSize: 11)),
                    selected: _fineRebateFactor == "rebate_10",
                    onSelected: (s) => setState(() => _fineRebateFactor = "rebate_10"),
                  ),
                  ChoiceChip(
                    label: const Text("Standard", style: TextStyle(fontSize: 11)),
                    selected: _fineRebateFactor == "none",
                    onSelected: (s) => setState(() => _fineRebateFactor = "none"),
                  ),
                  ChoiceChip(
                    label: const Text("10% Late Fine", style: TextStyle(fontSize: 11)),
                    selected: _fineRebateFactor == "fine_10",
                    onSelected: (s) => setState(() => _fineRebateFactor = "fine_10"),
                  ),
                  ChoiceChip(
                    label: const Text("20% Late Fine", style: TextStyle(fontSize: 11)),
                    selected: _fineRebateFactor == "fine_20",
                    onSelected: (s) => setState(() => _fineRebateFactor = "fine_20"),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 14),

          // FINAL TAX SUMMARY & ACTION
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF1E3A8A), Color(0xFF172554)]),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(color: Colors.blue.shade900.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text("TOTAL TAX PAYABLE", style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold)),
                    Text("FY 2081/82", style: TextStyle(color: Colors.amber, fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  "NPR ${calc['totalTax'].toStringAsFixed(0)}",
                  style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text("Base Tax: NPR ${calc['baseTax'].toStringAsFixed(0)}", style: const TextStyle(color: Colors.white70, fontSize: 11)),
                    if (calc['rebateAmount'] > 0)
                      Text("Rebate: -NPR ${calc['rebateAmount'].toStringAsFixed(0)}", style: const TextStyle(color: Colors.greenAccent, fontSize: 11)),
                    if (calc['fineAmount'] > 0)
                      Text("Fine: +NPR ${calc['fineAmount'].toStringAsFixed(0)}", style: const TextStyle(color: Colors.amberAccent, fontSize: 11)),
                  ],
                ),
                const Divider(color: Colors.white24, height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.amber,
                      foregroundColor: Colors.black87,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: _isSaving
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.save, size: 18),
                    label: Text(_isSaving ? "Saving..." : "Save Calculation to Municipal Database"),
                    onPressed: _isSaving ? null : () => _handleSaveCalculation(calc),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepCard({
    required int stepNumber,
    required String title,
    required Color color,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 10,
                backgroundColor: color,
                child: Text("$stepNumber", style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          ...children,
        ],
      ),
    );
  }

  Widget _buildHistoryTab() {
    if (_historyList.isEmpty) {
      return const Center(child: Text("No saved calculations found."));
    }

    return ListView.separated(
      padding: const EdgeInsets.all(14),
      itemCount: _historyList.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, idx) {
        final item = _historyList[idx];
        return Card(
          elevation: 1,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      item['taxpayer_name'] ?? "Taxpayer #${item['taxpayer_id']}",
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        item['fiscal_year_name'] ?? "FY 2081/82",
                        style: TextStyle(fontSize: 10, color: Colors.blue.shade800, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text("Date: ${item['calculate_date_bs'] ?? '2081-07-02'}", style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    Text(
                      "NPR ${item['total_tax'] ?? 0}",
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.green),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
