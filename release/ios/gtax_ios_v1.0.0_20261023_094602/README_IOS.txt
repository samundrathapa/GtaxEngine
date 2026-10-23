=========================================================================
gtax Mobile - iOS Release Package
Version: 1.0.0  |  Build Timestamp: 20261023_094602
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
=========================================================================