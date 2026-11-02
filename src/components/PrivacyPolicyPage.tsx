import React, { useState } from "react";
import {
  Shield,
  Lock,
  FileText,
  ArrowLeft,
  Printer,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Building,
  Mail,
  Phone,
  Landmark,
  UserCheck,
  Scale,
  Eye,
  Globe
} from "lucide-react";

interface PrivacyPolicyPageProps {
  onBackToApp?: () => void;
  isAuthenticated?: boolean;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  onBackToApp,
  isAuthenticated = false
}) => {
  const [activeDoc, setActiveDoc] = useState<"privacy" | "terms" | "security">("privacy");
  const [lang, setLang] = useState<"nep" | "eng">("eng");

  const lastUpdated = "November 2, 2026";
  const idleTimeoutMin = import.meta.env.VITE_IDLE_SESSION_TIMEOUT_MINUTES || "15";

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (onBackToApp) {
      onBackToApp();
    } else {
      window.location.hash = "#/dashboard";
      window.location.pathname = "/";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-2xs group"
              title="Return to Gtax Application"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-indigo-400" />
              <span>{isAuthenticated ? "Back to Dashboard" : "Back to Login"}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-600/30">
                G
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Gtax Enterprise</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                    Official Policy
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">Municipal Revenue & Tax Governance</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setLang("eng")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  lang === "eng"
                    ? "bg-indigo-600 text-white shadow-xs font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang("nep")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  lang === "nep"
                    ? "bg-indigo-600 text-white shadow-xs font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                नेपाली (Nepali)
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors shadow-2xs"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Document Navigation Tabs */}
        <div className="flex items-center gap-2 pb-6 border-b border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveDoc("privacy")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeDoc === "privacy"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>{lang === "eng" ? "Privacy Policy" : "गोपनीयता नीति"}</span>
          </button>

          <button
            onClick={() => setActiveDoc("terms")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeDoc === "terms"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Scale className="w-4 h-4 text-amber-400" />
            <span>{lang === "eng" ? "Terms of Service" : "सेवाका सर्तहरू"}</span>
          </button>

          <button
            onClick={() => setActiveDoc("security")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeDoc === "security"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Lock className="w-4 h-4 text-indigo-400" />
            <span>{lang === "eng" ? "Data Protection & Security" : "डेटा सुरक्षा र गोपनीयता मापदण्ड"}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Document Body */}
          <div className="lg:col-span-8 space-y-8 bg-slate-900/60 p-6 sm:p-10 rounded-3xl border border-slate-800">
            {activeDoc === "privacy" && (
              <div className="space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-semibold mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Last Revised: {lastUpdated}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {lang === "eng" ? "Municipal Privacy Policy" : "नगरपालिका गोपनीयता नीति"}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">
                    {lang === "eng"
                      ? "Standards for collecting, processing, and safeguarding taxpayer property and financial records."
                      : "करदाता सम्पत्ति, भूमिकर र वित्तीय अभिलेखहरूको संकलन, प्रशोधन र सुरक्षा सम्बन्धी मापदण्ड।"}
                  </p>
                </div>

                {/* Section 1 */}
                <section className="space-y-2.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                      1
                    </span>
                    <span>{lang === "eng" ? "Scope & Governing Authority" : "१. परिचय र कानुनी दायरा"}</span>
                  </h3>
                  <p>
                    {lang === "eng"
                      ? "This Privacy Policy applies to the Gtax Enterprise Municipal Tax Management Platform. The system is operated under the statutory authority of the Local Government Operation Act (स्थानीय सरकार सञ्चालन ऐन) for the lawful assessment, collection, and management of Property Tax (सम्पत्ति कर), Integrated Land Tax (एकीकृत भूमिकर / मालपोत), Business Tax (व्यवसाय कर), and Rental Taxes."
                      : "यो गोपनीयता नीति Gtax Enterprise नगरपालिका कर व्यवस्थापन प्रणालीमा लागू हुन्छ। स्थानीय सरकार सञ्चालन ऐन २०७४ अन्तर्गत स्थानीय निकायहरूको सम्पत्ति कर, भूमिकर/मालपोत, व्यवसाय कर तथा बहाल करको कानुनी निर्धारण र व्यवस्थापनका लागि यो प्रणाली सञ्चालन गरिएको हो।"}
                  </p>
                </section>

                {/* Section 2 */}
                <section className="space-y-2.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                      2
                    </span>
                    <span>{lang === "eng" ? "Information We Collect" : "२. हामीले संकलन गर्ने जानकारी"}</span>
                  </h3>
                  <p>
                    {lang === "eng"
                      ? "To compute accurate tax liabilities and maintain taxpayer registries, the system collects and maintains:"
                      : "सही कर दायित्व निर्धारण गर्न र करदाताको लगत व्यवस्थित गर्न प्रणालीले देहायका विवरणहरू संकलन गर्दछ:"}
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                    <li>
                      <strong className="text-slate-200">Taxpayer Identification:</strong> Full name, Citizenship Number, National Identity Number, Permanent Account Number (PAN/VAT), Mobile phone number, and physical mailing address.
                    </li>
                    <li>
                      <strong className="text-slate-200">Land & Parcel Records:</strong> Plot/Kitta numbers, cadastre sheet numbers, ward numbers, land nature (Abal, Doyam, Sim, Chahar), and total area in standard units (Ropani-Aana-Paisa-Daam or Bigha-Katha-Dhur).
                    </li>
                    <li>
                      <strong className="text-slate-200">Building & Structure Records:</strong> Construction classification (RCC framed, brick masonry, wooden, temporary), plinth area, number of floors, construction completion date, and depreciation schedule.
                    </li>
                    <li>
                      <strong className="text-slate-200">Operational & Security Audit Logs:</strong> User session tokens, authorized operator credentials, IP addresses, transaction timestamps, and modification logs.
                    </li>
                  </ul>
                </section>

                {/* Section 3 */}
                <section className="space-y-2.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                      3
                    </span>
                    <span>{lang === "eng" ? "Automatic Idle Session Timeout Policy" : "३. निष्क्रिय सत्र स्वतः अन्त्य नीति (Idle Session Timeout)"}</span>
                  </h3>
                  <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                      <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Configured Inactivity Protection: {idleTimeoutMin} Minutes</span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      {lang === "eng"
                        ? `To safeguard taxpayer privacy and confidential municipal financial data against unauthorized physical access at municipal workstations, Gtax enforces an automatic Idle Session Timeout. If an operator is inactive for ${idleTimeoutMin} minutes (configurable via VITE_IDLE_SESSION_TIMEOUT_MINUTES in the environment), the workstation is automatically locked and the session is terminated. A 60-second warning countdown is provided before termination.`
                        : `नगरपालिका कार्यकक्षमा करदाताको व्यक्तिगत तथा वित्तीय विवरणको सुरक्षाका लागि प्रणालीमा स्वतः निष्क्रिय सत्र अन्त्य (Idle Session Timeout) लागू गरिएको छ। यदि प्रयोगकर्ता ${idleTimeoutMin} मिनेटसम्म निष्क्रिय रहेमा प्रणाली स्वतः लगआउट हुन्छ।`}
                    </p>
                  </div>
                </section>

                {/* Section 4 */}
                <section className="space-y-2.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                      4
                    </span>
                    <span>{lang === "eng" ? "Purpose of Data Processing" : "४. विवरण प्रशोधनको उद्देश्य"}</span>
                  </h3>
                  <p>
                    {lang === "eng"
                      ? "Collected data is strictly utilized for authorized municipal governance tasks:"
                      : "संकलित विवरणहरू केवल तोकिएका कानुनी प्रयोजनका लागि मात्र प्रयोग गरिन्छ:"}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Assessment of statutory property and land tax liabilities.</li>
                    <li>Application of prompt payment rebates and late fine calculations under municipal finance bylaws.</li>
                    <li>Issuance of authentic tax clearance certificates and verification receipts.</li>
                    <li>Official reconciliation and audit verification under the Auditor General standards.</li>
                  </ul>
                </section>

                {/* Section 5 */}
                <section className="space-y-2.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                      5
                    </span>
                    <span>{lang === "eng" ? "Zero Commercial Data Sharing" : "५. व्यावसायिक रूपमा डेटा बिक्री वा हस्तान्तरण निषेध"}</span>
                  </h3>
                  <p>
                    {lang === "eng"
                      ? "Gtax Enterprise and municipal operators do not sell, rent, monetize, or disclose citizen or taxpayer data to commercial third parties, ad networks, or data brokers under any circumstances."
                      : "Gtax Enterprise र नगरपालिका प्रशासनले करदाताको कुनै पनि विवरण कुनै पनि व्यावसायिक तेस्रो पक्ष, विज्ञापनदाता वा निजी कम्पनीहरूलाई बिक्री वा वितरण गर्दैन।"}
                  </p>
                </section>
              </div>
            )}

            {activeDoc === "terms" && (
              <div className="space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-semibold mb-3">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Effective: {lastUpdated}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {lang === "eng" ? "Terms of Service & Usage Agreement" : "सेवाका सर्तहरू तथा प्रयोग सम्झौता"}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">
                    {lang === "eng"
                      ? "Rules, operator responsibilities, and system usage guidelines for Gtax Enterprise."
                      : "Gtax प्रणाली प्रयोग गर्दा पालना गर्नुपर्ने सर्तहरू र दायित्वहरू।"}
                  </p>
                </div>

                <section className="space-y-2.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-600/30 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">
                      1
                    </span>
                    <span>{lang === "eng" ? "Authorized Access Only" : "१. आधिकारिक प्रयोग"}</span>
                  </h3>
                  <p>
                    {lang === "eng"
                      ? "Access to Gtax Enterprise is restricted to authorized municipal personnel, revenue operators, ward administrators, and taxpayers accessing their verified dossiers. Credential sharing is strictly prohibited."
                      : "यस प्रणालीको पहुँच केवल अधिकारप्राप्त नगरपालिका कर्मचारी, राजस्व अधिकृत, वडा सचिव र प्रमाणीकरण भएका करदाताका लागि मात्र सीमित छ।"}
                  </p>
                </section>

                <section className="space-y-2.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-600/30 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">
                      2
                    </span>
                    <span>{lang === "eng" ? "Accuracy of Cadastral & Tax Data" : "२. तथ्याङ्कको शुद्धता र दायित्व"}</span>
                  </h3>
                  <p>
                    {lang === "eng"
                      ? "Users and operators must ensure that all entered land parcel dimensions, plinth measurements, construction types, and PAN numbers reflect verified cadastral records (जग्गाधनी प्रमाण पुर्जा) and approved engineering plans."
                      : "प्रविष्टि गरिएका जग्गाको क्षेत्रफल, कित्ता नम्बर, नक्सा पास तथा भवनको संरचना आधिकारिक प्रमाण पुर्जा अनुसार दुरुस्त हुनुपर्दछ।"}
                  </p>
                </section>

                <section className="space-y-2.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-600/30 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">
                      3
                    </span>
                    <span>{lang === "eng" ? "Audit Trails & Non-Repudiation" : "३. अडिट ट्रेल र सुरक्षा नियम"}</span>
                  </h3>
                  <p>
                    {lang === "eng"
                      ? "All property valuations, rate matrix updates, tax rebates, and late fine exemptions are permanently recorded in the immutable audit log with operator ID, IP address, and timestamp."
                      : "सबै कर गणना, दररेट हेरफेर, छुट तथा जरिवानाको अभिलेख अपरिवर्तनीय अडिट लगमा सुरक्षित रहन्छ।"}
                  </p>
                </section>
              </div>
            )}

            {activeDoc === "security" && (
              <div className="space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-semibold mb-3">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Security Tier: Enterprise Municipal Grade</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {lang === "eng" ? "Data Protection & Security Architecture" : "डेटा सुरक्षा र प्राविधिक पूर्वाधार"}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">
                    {lang === "eng"
                      ? "How Gtax safeguards municipal databases, session credentials, and cryptographic integrity."
                      : "नगरपालिका डाटाबेस र करदाता विवरण सुरक्षित राख्ने प्राविधिक सुरक्षा मापदण्डहरू।"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                      <Lock className="w-4 h-4" />
                      <span>End-to-End Encryption</span>
                    </div>
                    <p className="text-slate-400 text-xs">
                      All data in transit is protected with TLS 1.3 encryption. Passwords and sensitive identifiers are hashed using industry-standard salt algorithms.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <UserCheck className="w-4 h-4" />
                      <span>Granular RBAC</span>
                    </div>
                    <p className="text-slate-400 text-xs">
                      Role-Based Access Control restricts operations by user tier (SuperAdmin, Revenue Officer, Ward Operator, Taxpayer Viewer).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <Calendar className="w-4 h-4" />
                      <span>Session Expiration ({idleTimeoutMin}m)</span>
                    </div>
                    <p className="text-slate-400 text-xs">
                      Automatic workstation lockout terminates dormant sessions after {idleTimeoutMin} minutes of user inactivity to prevent unauthorized access.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <Shield className="w-4 h-4" />
                      <span>Continuous Threat Auditing</span>
                    </div>
                    <p className="text-slate-400 text-xs">
                      Automated audit logs track all property reassessments, discount allowances, and receipt generation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Key Contacts & Quick Verification */}
          <div className="lg:col-span-4 space-y-5">
            {/* Quick Summary Card */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-400" />
                <span>Municipal Registry Details</span>
              </h4>

              <div className="space-y-3 text-xs text-slate-400">
                <div className="flex items-start gap-2.5">
                  <Landmark className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-200">Municipal Revenue Directorate</div>
                    <div className="text-[11px]">Revenue Administration & Tax Assessment Wing</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-200">Data Protection Officer</div>
                    <div className="text-[11px] font-mono text-indigo-400">privacy@gtax.local / support@gtax.local</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-200">Idle Session Timeout</div>
                    <div className="text-[11px] font-mono text-emerald-400">
                      {idleTimeoutMin} minutes inactivity limit
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={handleBack}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isAuthenticated ? "Go to Municipal Dashboard" : "Go to Login Portal"}</span>
                </button>
              </div>
            </div>

            {/* Hosting & Compliance Notice */}
            <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Domain & Hosting Compliance</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                This public endpoint (/privacy, /privacypage, /privacy-policy) is permanently accessible on hosted domain names to satisfy Google OAuth verification, municipal regulatory disclosures, and public citizen rights under the Right to Information (सूचनाको हक) laws.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Gtax Enterprise. All Rights Reserved. Municipal Revenue Platform.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setActiveDoc("privacy")} className="hover:text-white transition-colors">
              Privacy Policy
            </button>
            <span>·</span>
            <button onClick={() => setActiveDoc("terms")} className="hover:text-white transition-colors">
              Terms of Service
            </button>
            <span>·</span>
            <button onClick={() => setActiveDoc("security")} className="hover:text-white transition-colors">
              Security
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
