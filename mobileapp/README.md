# gtax Mobile - iOS & Android Flutter Application

Cross-platform mobile application for **gtax Enterprise Municipal Property & Tax Liabilities Engine**, built with **Flutter 3.x** and ready to deploy to **iOS** and **Android**.

---

## 🏗️ 4-Tier Restructured Architecture

The platform is structured into four distinct, cohesive tiers with a **Single Common Entry Point**:

```
├── client/     # React 19 + Vite SPA (Web portal)
├── server/     # Node.js Express + Multi-Jurisdiction Engine + Unified Entry Point
├── ai/         # Google Gemini 2.5/3.8 Flash + Voice Assistant + LLM Rules Engine
└── mobileapp/  # Flutter iOS & Android Multi-Platform Application
```

### Single Common Entry Point
Both the **Web Client** and the **Flutter Mobile App (iOS & Android)** connect to the same unified entry point:
- Base URL: `http://<HOST>:3000/api/v1`
- Entry Point Manifest: `/api/v1/entry/manifest`
- Mobile Boot Config: `/api/v1/mobile/boot-config`
- AI Assistant: `/api/v1/ai/chat` & `/api/v1/ai/voice-intent`
- Taxpayer Dossier & Workflow: `/api/v1/taxpayer/:id/dossier`

---

## 📱 Mobile App Features

1. **Frontend & Manual Calculation Engine (5-Step Valuation Matrix)**:
   - **Step 1 - Land Parcel Valuation**: Dynamic selection between Municipal Land Rate (`tbl_land_rate`) and Malpot Statutory Rate (`tbl_malpot_rate`), aana conversion, and real-time adjustment sliders (-50% to +50%).
   - **Step 2 - House & Floor Valuation**: RCC structural rates (NPR 2,800/sqft) with age depreciation schedule (5%, 10%) per floor slab and structure adjustment sliders.
   - **Step 3 - Progressive Tax Slabs**: Automated progressive slab brackets (0.05% to 0.20%) with manual override tax rate slider.
   - **Step 4 - Early Rebates & Penalties**: 10% early payment discount, standard, and late payment fine tiers (10%, 20%).
   - **Step 5 - Levies & DB Persistence**: Sanitation & infrastructure service cess, grand total tax, and direct save to backend municipal ledger (`calc_master`, `calc_land`, `calc_house`, `calc_floor`, `calc_additional`) with a saved calculation history viewer.
2. **AI Tax Advisor & Automated Voice Assistant**:
   - Voice commands with instant auto-execution:
     - `"open taxpayer"`: Auto-navigates to 1-Door citizen registration.
     - `"list taxpayer today registered"`: Fetches today's registered citizens and renders interactive cards.
     - `"add landrate 1 to land rate"`: Auto-inserts Land Rate 1 into `tbl_land_rate`.
     - `"calculate tax"` / `"open calculation"`: Launches the calculation engine.
3. **Dashboard & Municipal Revenue Counters**:
   - Total taxpayers, registered properties, pending valuations, active ward filters.
4. **Taxpayer Registry & Search**:
   - Fast autocomplete search by Name, PAN, Citizenship, Kitta number.
5. **Property Portfolio Dossier**:
   - Tabbed view: Valuation Summary, Multi-land parcels, Multi-house structures (single/dual land linked), Floor slabs with depreciation.
6. **1-Door Continuous Mobile Registration**:
   - Sequential non-modal wizard: Taxpayer details $\rightarrow$ Lands $\rightarrow$ Houses $\rightarrow$ Floors $\rightarrow$ Formula Evaluation & Tax calculation.

---

## 🚀 Deployment Guide

### Prerequisites
- Flutter SDK `>=3.2.0 <4.0.0`
- Dart SDK `>=3.2.0`
- Android Studio / Android SDK (API 34)
- Xcode 15+ (for iOS build on macOS)

### 1. Install Dependencies
```bash
cd mobileapp
flutter pub get
```

### 2. Configure Backend Host
Edit `lib/config/app_config.dart` or change it dynamically in the app's **Settings** screen:
- Local Android Emulator: `http://10.0.2.2:3000`
- Local iOS Simulator: `http://127.0.0.1:3000`
- Cloud Production: `https://your-cloud-run-domain.app`

---

### 🤖 Deploy to Android

#### Test on Android Emulator or Physical Device
```bash
flutter run -d android
```

#### Build Release APK
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

#### Build Android App Bundle (Google Play Store)
```bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

#### Signing (Optional for production store upload)
1. Generate keystore:
   ```bash
   keytool -genkey -v -keystore ./android/app/gtax-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias gtax
   ```
2. Reference keystore in `android/key.properties` and `android/app/build.gradle`.

---

### 🍎 Deploy to iOS

#### Test on iOS Simulator
```bash
flutter run -d ios
```

#### Build iOS Archive (.ipa for TestFlight & App Store)
```bash
flutter build ipa --release
# Output: build/ios/archive/Runner.xcarchive
```

#### Open in Xcode for Apple Developer Provisioning
```bash
open ios/Runner.xcworkspace
```
1. Select **Runner** in project navigator.
2. Under **Signing & Capabilities**, select your **Apple Developer Team**.
3. Set your Bundle Identifier (e.g. `com.gtax.enterprise`).
4. Click **Product $\rightarrow$ Archive** to upload to App Store Connect / TestFlight.

---

## 🌐 Multi-Language Synchronization
Translations are unified across Web and Mobile:
- English (`eng`)
- Nepali (`nep`)
- Hindi (`ind`)
Mapped directly to database columns according to `src/i18n/db_column_mapping.json`.
