import 'package:flutter/material.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          "Privacy Policy & Data Protection",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        centerTitle: true,
        backgroundColor: const Color(0xFF1E3A8A),
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Badge Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.privacy_tip_outlined, color: Color(0xFF1E3A8A), size: 28),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            "Gtax Municipal Tax System",
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0F172A)),
                          ),
                          SizedBox(height: 3),
                          Text(
                            "Official Municipal Privacy Policy • Version 2.5",
                            style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                          ),
                          SizedBox(height: 2),
                          Text(
                            "Effective: Fiscal Year 2081/82 (2026/2027)",
                            style: TextStyle(fontSize: 10, color: Color(0xFF10B981), fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              _buildSection(
                title: "1. Overview & Commitment",
                icon: Icons.shield_outlined,
                content:
                    "Netcore International and the Municipal Revenue Administration are committed to protecting the privacy and personal data of citizens, taxpayers, and authorized municipal officers using the Gtax Municipal Mobile Application.\n\nThis application operates strictly under the local government financial regulations, the Privacy Act of Nepal, and international data protection standards. We do not sell, rent, or trade your personal information to third parties.",
              ),

              _buildSection(
                title: "2. Information We Collect",
                icon: Icons.folder_shared_outlined,
                content:
                    "• Taxpayer Identity: Name, PAN, Citizenship/Identification number, Ward number, Contact phone, and Email address.\n"
                    "• Property Records: Land plot (kitta) numbers, survey boundaries, building structure specs, floor areas, construction materials, and commercial usage.\n"
                    "• Financial & Valuation Data: Assessed circle rates, municipal rebate entitlements, and tax calculation records.",
              ),

              _buildSection(
                title: "3. Device Permissions & Purpose",
                icon: Icons.security_outlined,
                content:
                    "• Camera (android.permission.CAMERA): Used only when you choose to scan paper tax receipts, QR codes, or photograph land ownership certificates (Lalpurja).\n"
                    "• Audio (android.permission.RECORD_AUDIO): Used optionally for voice-assisted tax calculations and query dictation with the AI tax advisor.\n"
                    "• Internet & Network (android.permission.INTERNET): Required to synchronize tax evaluations with the municipal central revenue server and check calculation formulas.",
              ),

              _buildSection(
                title: "4. Guest & Public Citizen Mode",
                icon: Icons.person_outline,
                content:
                    "Public citizens and unauthorized users can use the tax calculation engine, view valuation matrices, and consult the AI advisor without creating an account or logging in. No personal identifiable information (PII) is captured or transmitted when using the app in Guest Mode.",
              ),

              _buildSection(
                title: "5. Data Security & Storage",
                icon: Icons.lock_outline,
                content:
                    "All communications between the mobile application and municipal backends are secured using TLS 1.3 / 256-bit encryption. Local cache on your device is protected using encrypted secure storage, and official records are maintained in compliance with municipal audit trails.",
              ),

              _buildSection(
                title: "6. Citizen Rights & Data Access",
                icon: Icons.verified_user_outlined,
                content:
                    "Taxpayers have the statutory right to:\n"
                    "• Inspect their official property tax records and valuation dossiers.\n"
                    "• Request corrections to erroneous survey areas or construction classifications.\n"
                    "• Inquire about assessment histories directly at the Ward Office or through the Municipal Grievance Redressal Portal.",
              ),

              _buildSection(
                title: "7. Contact & Grievance Officer",
                icon: Icons.contact_support_outlined,
                content:
                    "For inquiries regarding this privacy policy or data protection, please contact:\n\n"
                    "Municipal Revenue & ICT Directorate\n"
                    "Department of Information Technology & Tax Administration\n"
                    "Email: privacy@gtax.enterprise / support@netcoreint.com\n"
                    "Support Line: +977-1-4200000 / Ward Helpdesk",
              ),

              const SizedBox(height: 24),
              Center(
                child: Text(
                  "© 2026-2027 Gtax Municipal • All Rights Reserved",
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection({required String title, required IconData icon, required String content}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: const Color(0xFF1E3A8A)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A)),
                ),
              ),
            ],
          ),
          const Divider(height: 20, color: Color(0xFFF1F5F9)),
          Text(
            content,
            style: const TextStyle(fontSize: 12, height: 1.5, color: Color(0xFF334155)),
          ),
        ],
      ),
    );
  }
}
