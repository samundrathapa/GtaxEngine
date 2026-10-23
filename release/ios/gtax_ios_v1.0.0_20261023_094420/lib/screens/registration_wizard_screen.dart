import 'package:flutter/material.dart';
import '../services/api_service.dart';

class RegistrationWizardScreen extends StatefulWidget {
  const RegistrationWizardScreen({Key? key}) : super(key: key);

  @override
  State<RegistrationWizardScreen> createState() => _RegistrationWizardScreenState();
}

class _RegistrationWizardScreenState extends State<RegistrationWizardScreen> {
  final ApiService _api = ApiService();
  int _currentStep = 0;
  bool _isSubmitting = false;

  // Step 1: Taxpayer Info
  final _fullnameCtrl = TextEditingController(text: "Bishnu Prasad Adhikari");
  final _mobileCtrl = TextEditingController(text: "9841887766");
  final _panCtrl = TextEditingController(text: "109283746");
  final _citizenshipCtrl = TextEditingController(text: "27-01-70-11223");
  int _wardNo = 4;

  // Step 2: Land Parcels
  final List<Map<String, dynamic>> _lands = [
    {
      "kitta_number": "412/A",
      "moth_number": "M-12",
      "ward_no": 4,
      "area_sqfeet": 1800.0,
      "assessed_valuation": 4200000.0,
    }
  ];

  // Step 3: Houses
  final List<Map<String, dynamic>> _houses = [
    {
      "house_name": "Main Residence",
      "house_number": "H-101",
      "kitta_number": "412/A",
      "total_area_sqft": 1800.0,
      "assessed_valuation": 6500000.0,
    }
  ];

  // Step 4: Floors
  final List<Map<String, dynamic>> _floors = [
    {
      "floor_name": "Ground Floor",
      "area_in_sqft": 900.0,
      "depreciation_rate": 5.0,
      "floor_assessed_valuation": 3250000.0,
    },
    {
      "floor_name": "First Floor",
      "area_in_sqft": 900.0,
      "depreciation_rate": 2.5,
      "floor_assessed_valuation": 3250000.0,
    }
  ];

  void _addLandParcel() {
    setState(() {
      _lands.add({
        "kitta_number": "${413 + _lands.length}/B",
        "moth_number": "M-12",
        "ward_no": _wardNo,
        "area_sqfeet": 1200.0,
        "assessed_valuation": 2800000.0,
      });
    });
  }

  void _addHouseStructure() {
    final kittaList = _lands.map((l) => l["kitta_number"].toString()).join(", ");
    setState(() {
      _houses.add({
        "house_name": "Secondary Annex / Garage",
        "house_number": "H-102",
        "kitta_number": kittaList,
        "total_area_sqft": 600.0,
        "assessed_valuation": 1800000.0,
      });
    });
  }

  double get _totalLandValuation => _lands.fold(0.0, (acc, l) => acc + (l["assessed_valuation"] as double));
  double get _totalHouseValuation => _houses.fold(0.0, (acc, h) => acc + (h["assessed_valuation"] as double));
  double get _combinedValuation => _totalLandValuation + _totalHouseValuation;
  double get _calculatedTax => (_combinedValuation * 0.001);
  double get _netTax => _calculatedTax * 0.9; // 10% rebate

  Future<void> _submitRegistration() async {
    setState(() => _isSubmitting = true);
    final payload = {
      "taxpayer": {
        "fullname": _fullnameCtrl.text,
        "mobile_no": _mobileCtrl.text,
        "pan_vat_no": _panCtrl.text,
        "citizenship_no": _citizenshipCtrl.text,
        "ward_no": _wardNo,
      },
      "lands": _lands,
      "houses": _houses,
      "floors": _floors,
      "valuation": {
        "land_amount": _totalLandValuation,
        "house_amount": _totalHouseValuation,
        "evaluated_amount": _combinedValuation,
        "calculated_tax": _calculatedTax,
        "net_payable": _netTax,
      }
    };

    final res = await _api.submitOneDoorRegistration(payload);
    if (mounted) {
      setState(() => _isSubmitting = false);
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: Colors.green),
              SizedBox(width: 8),
              Text("Registration Complete"),
            ],
          ),
          content: Text("Taxpayer ${_fullnameCtrl.text} registered successfully with ${_lands.length} land parcel(s) and ${_houses.length} building(s). Net Payable: NPR ${_netTax.toStringAsFixed(0)}"),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context);
              },
              child: const Text("Done"),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("1-Door Mobile Registration"),
      ),
      body: Stepper(
        currentStep: _currentStep,
        onStepContinue: () {
          if (_currentStep < 4) {
            setState(() => _currentStep++);
          } else {
            _submitRegistration();
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep--);
          }
        },
        steps: [
          // Step 1: Taxpayer
          Step(
            title: const Text("Taxpayer Details"),
            isActive: _currentStep >= 0,
            content: Column(
              children: [
                TextField(
                  controller: _fullnameCtrl,
                  decoration: const InputDecoration(labelText: "Full Name (पूरा नाम)"),
                ),
                TextField(
                  controller: _mobileCtrl,
                  decoration: const InputDecoration(labelText: "Mobile Phone"),
                  keyboardType: TextInputType.phone,
                ),
                TextField(
                  controller: _panCtrl,
                  decoration: const InputDecoration(labelText: "PAN / VAT Number"),
                ),
                TextField(
                  controller: _citizenshipCtrl,
                  decoration: const InputDecoration(labelText: "Citizenship Number"),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<int>(
                  value: _wardNo,
                  decoration: const InputDecoration(labelText: "Municipal Ward"),
                  items: List.generate(32, (i) => DropdownMenuItem(value: i + 1, child: Text("Ward #${i + 1}"))),
                  onChanged: (v) => setState(() => _wardNo = v ?? 1),
                ),
              ],
            ),
          ),

          // Step 2: Land Parcels
          Step(
            title: Text("Land Parcels (${_lands.length})"),
            isActive: _currentStep >= 1,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ..._lands.map((l) => Card(
                  child: ListTile(
                    leading: const Icon(Icons.landscape, color: Colors.brown),
                    title: Text("कित्ता नं. ${l['kitta_number']}"),
                    subtitle: Text("Area: ${l['area_sqfeet']} sq.ft. • Moth: ${l['moth_number']}"),
                    trailing: Text("NPR ${(l['assessed_valuation'] as double).toStringAsFixed(0)}"),
                  ),
                )),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  icon: const Icon(Icons.add),
                  label: const Text("Add Another Land Parcel"),
                  onPressed: _addLandParcel,
                ),
              ],
            ),
          ),

          // Step 3: House Structures
          Step(
            title: Text("House Structures (${_houses.length})"),
            isActive: _currentStep >= 2,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ..._houses.map((h) => Card(
                  child: ListTile(
                    leading: const Icon(Icons.home, color: Colors.indigo),
                    title: Text("${h['house_name']} (${h['house_number']})"),
                    subtitle: Text("Linked Kitta(s): ${h['kitta_number']} • Plinth: ${h['total_area_sqft']} sqft"),
                    trailing: Text("NPR ${(h['assessed_valuation'] as double).toStringAsFixed(0)}"),
                  ),
                )),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  icon: const Icon(Icons.add),
                  label: const Text("Add Another House Structure"),
                  onPressed: _addHouseStructure,
                ),
              ],
            ),
          ),

          // Step 4: Floor Slabs
          Step(
            title: Text("Floor Slabs (${_floors.length})"),
            isActive: _currentStep >= 3,
            content: Column(
              children: _floors.map((fl) => Card(
                child: ListTile(
                  leading: const Icon(Icons.layers, color: Colors.blue),
                  title: Text(fl['floor_name']),
                  subtitle: Text("${fl['area_in_sqft']} sqft • Deprec: ${fl['depreciation_rate']}%"),
                  trailing: Text("NPR ${(fl['floor_assessed_valuation'] as double).toStringAsFixed(0)}"),
                ),
              )).toList(),
            ),
          ),

          // Step 5: Valuation & Submission
          Step(
            title: const Text("Valuation & Tax Assessment"),
            isActive: _currentStep >= 4,
            content: _isSubmitting
                ? const Center(child: CircularProgressIndicator())
                : Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Land Evaluated: NPR ${_totalLandValuation.toStringAsFixed(0)}"),
                        const SizedBox(height: 4),
                        Text("House Evaluated: NPR ${_totalHouseValuation.toStringAsFixed(0)}"),
                        const SizedBox(height: 4),
                        Text("Combined Property: NPR ${_combinedValuation.toStringAsFixed(0)}", style: const TextStyle(fontWeight: FontWeight.bold)),
                        const Divider(height: 16),
                        Text("Base IPT Slab Tax: NPR ${_calculatedTax.toStringAsFixed(0)}"),
                        const SizedBox(height: 4),
                        Text("Early Payment Rebate (10%): - NPR ${(_calculatedTax * 0.1).toStringAsFixed(0)}", style: const TextStyle(color: Colors.green)),
                        const Divider(height: 16),
                        Text(
                          "NET PAYABLE TAX: NPR ${_netTax.toStringAsFixed(0)}",
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.indigo.shade900),
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
