import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import * as readline from 'node:readline';

/**
 * gtax Enterprise - Unified Release Publishing Engine
 *
 * Supports:
 *   - Target 1: Windows (IIS Production Server Package)
 *   - Target 2: Android (Mobile APK, Bundle, ADB scripts)
 *   - Target 3: iOS (Xcode Runner, Podfile, ExportOptions)
 *   - Target 4: All Platforms
 *
 * Outputs:
 *   - Specific folder name under release/<platform>/gtax_<platform>_v<VERSION>_<TIMESTAMP>/
 *   - Zip archive under release/gtax_<platform>_v<VERSION>_<TIMESTAMP>.zip
 */

const ROOT_DIR = process.cwd();
const RELEASE_DIR = path.join(ROOT_DIR, 'release');

function getFormattedTimestamp(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${MM}${dd}_${hh}${mm}${ss}`;
}

function copyRecursiveSync(src: string, dest: string, ignorePatterns: string[] = []) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      if (ignorePatterns.some((pattern) => entry === pattern || entry.startsWith(pattern))) {
        continue;
      }
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry), ignorePatterns);
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function createZipArchive(sourceDir: string, zipFilePath: string) {
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }

  // Check if tar or python3 or zip is available
  try {
    // Windows 10/11/Server or Linux with tar supporting zip
    const parentDir = path.dirname(sourceDir);
    const baseName = path.basename(sourceDir);
    execSync(`tar -a -c -f "${zipFilePath}" -C "${parentDir}" "${baseName}"`, { stdio: 'pipe' });
    return;
  } catch {
    // Fallback: python3 zipfile
    try {
      execSync(`python3 -m zipfile -c "${zipFilePath}" "${sourceDir}"`, { stdio: 'pipe' });
      return;
    } catch {
      // Windows PowerShell Compress-Archive
      execSync(
        `powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '${sourceDir}\\*' -DestinationPath '${zipFilePath}' -Force"`,
        { stdio: 'pipe' }
      );
    }
  }
}

async function promptUser(question: string, defaultValue = ''): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const val = answer.trim();
      resolve(val || defaultValue);
    });
  });
}

async function run() {
  console.log('=========================================================================');
  console.log('  gtax Enterprise - Unified Multi-Platform Release Publisher');
  console.log('=========================================================================');

  // Parse command line arguments if provided
  const args = process.argv.slice(2);
  let targetArg = '';
  let versionArg = '';

  for (const arg of args) {
    if (arg.startsWith('--target=')) {
      targetArg = arg.split('=')[1].toLowerCase();
    } else if (arg.startsWith('--version=')) {
      versionArg = arg.split('=')[1].replace(/^v/i, '');
    } else if (!targetArg && ['windows', 'android', 'ios', 'all', '1', '2', '3', '4'].includes(arg.toLowerCase())) {
      targetArg = arg.toLowerCase();
    } else if (!versionArg && /^v?\d+(\.\d+)*/i.test(arg)) {
      versionArg = arg.replace(/^v/i, '');
    }
  }

  // Target selection
  let target = targetArg;
  if (!target) {
    console.log('\nSelect the release target to build and publish:');
    console.log('  [1] Windows IIS Server (dist, server, web.config, update_iis.bat)');
    console.log('  [2] Android Mobile     (APK, App Bundle, ADB tools, Flutter manifest)');
    console.log('  [3] iOS Mobile         (Runner xcarchive, Podfile, ExportOptions, guide)');
    console.log('  [4] All Platforms      (Windows + Android + iOS)\n');

    const choice = await promptUser('Enter selection [1-4, Default=1]: ', '1');
    target = choice;
  }

  // Normalize target
  if (target === '1') target = 'windows';
  if (target === '2') target = 'android';
  if (target === '3') target = 'ios';
  if (target === '4') target = 'all';

  if (!['windows', 'android', 'ios', 'all'].includes(target)) {
    console.error(`[ERROR] Unknown target: ${target}. Must be windows, android, ios, or all.`);
    process.exit(1);
  }

  // Version input
  let version = versionArg;
  if (!version) {
    version = await promptUser('Enter manual release version number [e.g. 1.0.0, 1.2.3]: ', '1.0.0');
  }
  version = version.replace(/^v/i, '').trim() || '1.0.0';

  const timestamp = getFormattedTimestamp();

  console.log('\n=========================================================================');
  console.log(`  Release Version:   v${version}`);
  console.log(`  Build Timestamp:   ${timestamp}`);
  console.log(`  Target Platform:   ${target.toUpperCase()}`);
  console.log('=========================================================================\n');

  if (!fs.existsSync(RELEASE_DIR)) {
    fs.mkdirSync(RELEASE_DIR, { recursive: true });
  }

  const results: { platform: string; folder: string; zip: string; size: string }[] = [];

  // 1. Build Windows IIS Release
  if (target === 'windows' || target === 'all') {
    console.log('[STEP] Building & Packaging Windows IIS Server Release...');

    // Run build if needed
    console.log('  -> Compiling frontend assets via npm run build...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
    } catch {
      console.warn('  -> Warning: npm run build encountered an error, verifying dist/...');
    }

    const distPath = path.join(ROOT_DIR, 'dist');
    if (!fs.existsSync(distPath)) {
      throw new Error("Build failed: 'dist' directory not found.");
    }

    const winFolderName = `gtax_windows_v${version}_${timestamp}`;
    const winDir = path.join(RELEASE_DIR, 'windows', winFolderName);
    fs.mkdirSync(winDir, { recursive: true });

    // Copy dist/
    copyRecursiveSync(distPath, path.join(winDir, 'dist'));

    // Copy IIS & operational scripts
    const filesToCopy = [
      'web.config',
      'update_iis.bat',
      'start_server.bat',
      'run_migrations.bat',
      'package.json',
      'tsconfig.json',
      '.env.example',
      'server.ts',
    ];

    for (const f of filesToCopy) {
      const srcPath = path.join(ROOT_DIR, f);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(winDir, f));
      }
    }

    // Copy server, ai, database, dbmigration, src
    const dirsToCopy = ['server', 'ai', 'database', 'dbmigration', 'src'];
    for (const d of dirsToCopy) {
      const srcPath = path.join(ROOT_DIR, d);
      if (fs.existsSync(srcPath)) {
        copyRecursiveSync(srcPath, path.join(winDir, d), ['node_modules', '.git', 'logs']);
      }
    }

    // Write README_IIS_UPDATE.txt
    const readmeContent = `=========================================================================
gtax Enterprise - Windows IIS In-Place Update Guide
Version: ${version}  |  Build Timestamp: ${timestamp}
=========================================================================

UPDATING YOUR RUNNING IIS SERVER:
-------------------------------------------------------------------------
Option A (Direct Overwrite - Recommended):
  1. Stop your IIS Application Pool (or let update_iis.bat do it for you).
  2. Extract all contents of this ZIP file directly into your IIS website root:
     Default path: C:\\inetpub\\wwwroot\\gtax
  3. Select 'Yes to All' when prompted to replace existing files.
  4. Right-click 'update_iis.bat' and select 'Run as Administrator'.
     This script will:
       - Ensure AppPool locks are released
       - Synchronize files cleanly
       - Run any pending database migrations
       - Restart the IIS AppPool and Site

Option B (Automated Synchronizer):
  1. Extract this zip into any temporary folder (e.g., C:\\Deploy\\v${version}).
  2. Run 'update_iis.bat' and select option [2] or enter your IIS folder.

CONFIGURATION FILES:
  - web.config: Pre-configured with SPA fallback & Reverse Proxy to port 3000.
  - start_server.bat: Launches backend Node.js server.
  - run_migrations.bat: Manages PostgreSQL schemas and seed data.
=========================================================================`;
    fs.writeFileSync(path.join(winDir, 'README_IIS_UPDATE.txt'), readmeContent, 'utf-8');

    // Write RELEASE_INFO.json
    const metadata = {
      platform: 'windows',
      target: 'iis_web_server',
      version,
      timestamp,
      updateMethod: 'extract_and_replace',
      updateScript: 'update_iis.bat',
      config: 'web.config',
    };
    fs.writeFileSync(path.join(winDir, 'RELEASE_INFO.json'), JSON.stringify(metadata, null, 2), 'utf-8');

    // Zip package
    const winZipPath = path.join(RELEASE_DIR, `${winFolderName}.zip`);
    console.log(`  -> Compressing into ${winZipPath}...`);
    createZipArchive(winDir, winZipPath);

    const size = (fs.statSync(winZipPath).size / (1024 * 1024)).toFixed(2) + ' MB';
    results.push({ platform: 'windows', folder: winDir, zip: winZipPath, size });
    console.log(`  [SUCCESS] Windows package created (${size})\n`);
  }

  // 2. Build Android Mobile Release
  if (target === 'android' || target === 'all') {
    console.log('[STEP] Packaging Android Mobile Release...');
    const andFolderName = `gtax_android_v${version}_${timestamp}`;
    const andDir = path.join(RELEASE_DIR, 'android', andFolderName);
    fs.mkdirSync(andDir, { recursive: true });

    // Copy mobileapp/android and mobileapp/lib
    const mobileSrc = path.join(ROOT_DIR, 'mobileapp');
    if (fs.existsSync(path.join(mobileSrc, 'android'))) {
      copyRecursiveSync(path.join(mobileSrc, 'android'), path.join(andDir, 'android'));
    }
    if (fs.existsSync(path.join(mobileSrc, 'lib'))) {
      copyRecursiveSync(path.join(mobileSrc, 'lib'), path.join(andDir, 'lib'));
    }
    if (fs.existsSync(path.join(mobileSrc, 'pubspec.yaml'))) {
      fs.copyFileSync(path.join(mobileSrc, 'pubspec.yaml'), path.join(andDir, 'pubspec.yaml'));
    }
    if (fs.existsSync(path.join(mobileSrc, 'README.md'))) {
      fs.copyFileSync(path.join(mobileSrc, 'README.md'), path.join(andDir, 'README.md'));
    }

    // Write install_apk.bat
    const installBat = `@echo off
title gtax Mobile - ADB Android Device Installer
echo =========================================================================
echo   gtax Mobile - Android ADB Deployment Utility
echo =========================================================================
echo.
where adb >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Android Debug Bridge (adb) not found in PATH!
    echo Please ensure Android SDK Platform-Tools is installed and in PATH.
    pause
    exit /b 1
)
echo [INFO] Checking connected Android devices...
adb devices
echo.
set "APK_FILE="
for /f "delims=" %%a in ('dir /b /s "*.apk" 2^>nul') do set "APK_FILE=%%a"
if "%APK_FILE%"=="" (
    echo [INFO] No pre-compiled APK located in this folder.
    echo To build APK, run build_apk.bat or flutter build apk --release.
    pause
    exit /b 0
)
echo [INSTALL] Deploying %APK_FILE% to device...
adb install -r "%APK_FILE%"
pause
`;
    fs.writeFileSync(path.join(andDir, 'install_apk.bat'), installBat, 'utf-8');

    // Write build_apk.bat
    const buildBat = `@echo off
title gtax Mobile - Build Android Release
echo =========================================================================
echo   gtax Mobile - Build Android APK & Bundle
echo =========================================================================
echo.
where flutter >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Flutter SDK not detected in PATH!
    pause
    exit /b 1
)
call flutter pub get
echo Building Release APK...
call flutter build apk --release
echo Building Google Play App Bundle (AAB)...
call flutter build appbundle --release
echo Build Complete!
pause
`;
    fs.writeFileSync(path.join(andDir, 'build_apk.bat'), buildBat, 'utf-8');

    // Write README_ANDROID.txt
    const andReadme = `=========================================================================
gtax Mobile - Android Release Package
Version: ${version}  |  Build Timestamp: ${timestamp}
=========================================================================

PACKAGE CONTENTS:
  - android/          : Native Android Gradle project configuration
  - lib/              : Flutter / Dart cross-platform mobile source
  - pubspec.yaml      : Flutter dependencies and asset mappings
  - install_apk.bat   : One-click ADB deployment to USB connected device
  - build_apk.bat     : Automated Flutter APK & App Bundle compiler

TO DEPLOY TO DEVICE:
  1. Connect Android phone with USB Debugging enabled.
  2. Double-click install_apk.bat
=========================================================================`;
    fs.writeFileSync(path.join(andDir, 'README_ANDROID.txt'), andReadme, 'utf-8');

    // Write metadata
    const andMeta = {
      platform: 'android',
      version,
      timestamp,
      package: 'com.gtax.enterprise',
      entryPoint: 'lib/main.dart',
      gradle: 'android/build.gradle',
    };
    fs.writeFileSync(path.join(andDir, 'RELEASE_INFO.json'), JSON.stringify(andMeta, null, 2), 'utf-8');

    // Zip package
    const andZipPath = path.join(RELEASE_DIR, `${andFolderName}.zip`);
    console.log(`  -> Compressing into ${andZipPath}...`);
    createZipArchive(andDir, andZipPath);

    const size = (fs.statSync(andZipPath).size / (1024 * 1024)).toFixed(2) + ' MB';
    results.push({ platform: 'android', folder: andDir, zip: andZipPath, size });
    console.log(`  [SUCCESS] Android package created (${size})\n`);
  }

  // 3. Build iOS Mobile Release
  if (target === 'ios' || target === 'all') {
    console.log('[STEP] Packaging iOS Mobile Release...');
    const iosFolderName = `gtax_ios_v${version}_${timestamp}`;
    const iosDir = path.join(RELEASE_DIR, 'ios', iosFolderName);
    fs.mkdirSync(iosDir, { recursive: true });

    const mobileSrc = path.join(ROOT_DIR, 'mobileapp');
    if (fs.existsSync(path.join(mobileSrc, 'ios'))) {
      copyRecursiveSync(path.join(mobileSrc, 'ios'), path.join(iosDir, 'ios'));
    }
    if (fs.existsSync(path.join(mobileSrc, 'lib'))) {
      copyRecursiveSync(path.join(mobileSrc, 'lib'), path.join(iosDir, 'lib'));
    }
    if (fs.existsSync(path.join(mobileSrc, 'pubspec.yaml'))) {
      fs.copyFileSync(path.join(mobileSrc, 'pubspec.yaml'), path.join(iosDir, 'pubspec.yaml'));
    }
    if (fs.existsSync(path.join(mobileSrc, 'README.md'))) {
      fs.copyFileSync(path.join(mobileSrc, 'README.md'), path.join(iosDir, 'README.md'));
    }

    // Write ExportOptions.plist
    const exportPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>`;
    fs.writeFileSync(path.join(iosDir, 'ExportOptions.plist'), exportPlist, 'utf-8');

    // Write build_ios.sh
    const buildSh = `#!/bin/bash
set -e
echo "Building gtax iOS Archive for App Store / TestFlight..."
flutter pub get
cd ios && pod install && cd ..
flutter build ipa --release --export-options-plist=ExportOptions.plist
echo "Build complete: build/ios/ipa/gtax.ipa"
`;
    fs.writeFileSync(path.join(iosDir, 'build_ios.sh'), buildSh, 'utf-8');

    // Write build_ios.bat
    const buildBat = `@echo off
title gtax Mobile - iOS Build Helper
echo =========================================================================
echo   gtax Mobile - iOS Build Instructions
echo =========================================================================
echo NOTE: iOS compilation requires a macOS workstation or macOS CI runner.
echo To build on macOS:
echo   1. Transfer this folder to macOS.
echo   2. Run: chmod +x build_ios.sh && ./build_ios.sh
echo   3. Or open ios/Runner.xcworkspace in Xcode and archive.
echo =========================================================================
pause
`;
    fs.writeFileSync(path.join(iosDir, 'build_ios.bat'), buildBat, 'utf-8');

    // Write README_IOS.txt
    const iosReadme = `=========================================================================
gtax Mobile - iOS Release Package
Version: ${version}  |  Build Timestamp: ${timestamp}
=========================================================================

PACKAGE CONTENTS:
  - ios/                 : Xcode workspace, Runner project & Podfile
  - lib/                 : Flutter / Dart cross-platform mobile source
  - ExportOptions.plist  : Apple App Store / TestFlight signing config
  - build_ios.sh         : Automated macOS build script
  - build_ios.bat        : Instructions for Windows operators

STEPS TO PUBLISH TO APP STORE / TESTFLIGHT:
  1. Transfer package to macOS machine or trigger GitHub Actions macOS runner.
  2. Open 'ios/Runner.xcworkspace' in Xcode 15+.
  3. Select Runner -> Signing & Capabilities -> Choose your Apple Team.
  4. Run 'Product' -> 'Archive' or execute './build_ios.sh'.
=========================================================================`;
    fs.writeFileSync(path.join(iosDir, 'README_IOS.txt'), iosReadme, 'utf-8');

    // Write metadata
    const iosMeta = {
      platform: 'ios',
      version,
      timestamp,
      bundleIdentifier: 'com.gtax.enterprise',
      workspace: 'ios/Runner.xcworkspace',
    };
    fs.writeFileSync(path.join(iosDir, 'RELEASE_INFO.json'), JSON.stringify(iosMeta, null, 2), 'utf-8');

    // Zip package
    const iosZipPath = path.join(RELEASE_DIR, `${iosFolderName}.zip`);
    console.log(`  -> Compressing into ${iosZipPath}...`);
    createZipArchive(iosDir, iosZipPath);

    const size = (fs.statSync(iosZipPath).size / (1024 * 1024)).toFixed(2) + ' MB';
    results.push({ platform: 'ios', folder: iosDir, zip: iosZipPath, size });
    console.log(`  [SUCCESS] iOS package created (${size})\n`);
  }

  // Summary
  console.log('=========================================================================');
  console.log('  [COMPLETE] Release Publishing Completed Successfully!');
  console.log('=========================================================================');
  console.log(`  Release Version: v${version}`);
  console.log(`  Build Timestamp: ${timestamp}`);
  console.log(`  Output Directory: ${RELEASE_DIR}\n`);

  for (const res of results) {
    console.log(`  [${res.platform.toUpperCase()}]:`);
    console.log(`    Folder: ${path.relative(ROOT_DIR, res.folder)}`);
    console.log(`    Zip:    ${path.relative(ROOT_DIR, res.zip)} (${res.size})`);
    if (res.platform === 'windows') {
      console.log('    Note:   Extract to IIS root & overwrite; run update_iis.bat.');
    }
    console.log('');
  }
  console.log('=========================================================================\n');
}

run().catch((err) => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
