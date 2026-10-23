import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/taxpayer.dart';

class TaxpayerDossierScreen extends StatefulWidget {
  final int taxpayerId;
  const TaxpayerDossierScreen({Key? key, required this.taxpayerId}) : super(key: key);

  @override
  State<TaxpayerDossierScreen> createState() => _TaxpayerDossierScreenState();
}

class _TaxpayerDossierScreenState extends State<TaxpayerDossierScreen> with SingleTickerProviderStateMixin {
  final ApiService _api = ApiService();
  TaxpayerDossier? _dossier;
  bool _isLoading = true;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _fetchDossier();
  }

  Future<void> _fetchDossier() async {
    setState(() => _isLoading = true);
    final d = await _api.getTaxpayerDossier(widget.taxpayerId);
    if (mounted) {
      setState(() {
        _dossier = d;
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text("Taxpayer Dossier")),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final d = _dossier;
    if (d == null) {
      return Scaffold(
        appBar: AppBar(title: const Text("Taxpayer Dossier")),
        body: const Center(child: Text("Taxpayer dossier not found")),
      );
    }

    final tp = d.taxpayer;
    final val = d.valuationSummary;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(tp.fullname, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            Text("Code: ${tp.code} • Ward: ${tp.wardNo}", style: const TextStyle(fontSize: 11, color: Colors.white70)),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: [
            Tab(text: "Valuation (${val.currency})"),
            Tab(text: "Lands (${d.lands.length})"),
            Tab(text: "Houses (${d.houses.length})"),
            Tab(text: "Floors (${d.floors.length})"),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Valuation Summary & Tax Liability
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Net Tax Payable Big Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.indigo.shade800, Colors.blue.shade700],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.blue.withOpacity(0.3),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "NET MUNICIPAL PROPERTY TAX PAYABLE",
                        style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "${val.currency} ${val.netPayableTax.toStringAsFixed(0)}",
                        style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(12)),
                            child: Text(
                              "Rebate Applied: ${val.currency} ${val.rebateApplied.toStringAsFixed(0)}",
                              style: const TextStyle(color: Colors.white, fontSize: 11),
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text("• FY 2081/82", style: TextStyle(color: Colors.white70, fontSize: 11)),
                        ],
                      )
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Formula Breakdown
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Assessment Calculation Details",
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        const Divider(height: 20),
                        _buildRow("Total Land Evaluated Amount", "${val.currency} ${val.totalLandValuation.toStringAsFixed(0)}"),
                        const SizedBox(height: 8),
                        _buildRow("Total House Evaluated Amount", "${val.currency} ${val.totalHouseValuation.toStringAsFixed(0)}"),
                        const SizedBox(height: 8),
                        _buildRow("Combined Evaluated Asset", "${val.currency} ${val.combinedTotalValuation.toStringAsFixed(0)}", isBold: true),
                        const SizedBox(height: 8),
                        _buildRow("Base Progressive Tax Liability", "${val.currency} ${val.calculatedTaxLiability.toStringAsFixed(0)}"),
                        const SizedBox(height: 8),
                        _buildRow("Prompt Payment Rebate (-10%)", "- ${val.currency} ${val.rebateApplied.toStringAsFixed(0)}", color: Colors.green),
                        const Divider(height: 20),
                        _buildRow("Net Payable Tax", "${val.currency} ${val.netPayableTax.toStringAsFixed(0)}", isBold: true, color: Colors.indigo),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Taxpayer Identity Card
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("Taxpayer Details", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        const Divider(height: 20),
                        _buildRow("Full Name", tp.fullname),
                        const SizedBox(height: 8),
                        _buildRow("Taxpayer Code", tp.code),
                        const SizedBox(height: 8),
                        _buildRow("PAN / VAT", tp.panVatNo ?? "N/A"),
                        const SizedBox(height: 8),
                        _buildRow("Citizenship No.", tp.citizenshipNo ?? "N/A"),
                        const SizedBox(height: 8),
                        _buildRow("Mobile Phone", tp.mobileNo),
                        const SizedBox(height: 8),
                        _buildRow("Ward Number", "Ward #${tp.wardNo}"),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Tab 2: Land Parcels
          ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: d.lands.length,
            itemBuilder: (context, idx) {
              final land = d.lands[idx];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("कित्ता नं. ${land.kittaNumber}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          Chip(
                            label: Text("Ward #${land.wardNo}"),
                            visualDensity: VisualDensity.compact,
                          )
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text("Moth No: ${land.mothNumber} • Area: ${land.areaSqfeet} sq.ft."),
                      const SizedBox(height: 4),
                      Text(
                        "Assessed Valuation: NPR ${land.assessedValuation.toStringAsFixed(0)}",
                        style: TextStyle(color: Colors.indigo.shade700, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

          // Tab 3: House Structures
          ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: d.houses.length,
            itemBuilder: (context, idx) {
              final house = d.houses[idx];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(house.houseName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          Text(house.houseNumber, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(6)),
                        child: Text("Linked Kitta(s): ${house.kittaNumber}", style: TextStyle(fontSize: 12, color: Colors.brown.shade800)),
                      ),
                      const SizedBox(height: 8),
                      Text("Total Plinth Area: ${house.totalAreaSqft} sq.ft."),
                      const SizedBox(height: 4),
                      Text(
                        "Structure Valuation: NPR ${house.assessedValuation.toStringAsFixed(0)}",
                        style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

          // Tab 4: Floors
          ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: d.floors.length,
            itemBuilder: (context, idx) {
              final fl = d.floors[idx];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: ListTile(
                  title: Text(fl.floorName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  subtitle: Text("Area: ${fl.areaInSqft} sq.ft. • Depreciation: ${fl.depreciationRate}%"),
                  trailing: Text(
                    "NPR ${fl.floorAssessedValuation.toStringAsFixed(0)}",
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue.shade900),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value, {bool isBold = false, Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            color: color ?? Colors.black87,
          ),
        ),
      ],
    );
  }
}
