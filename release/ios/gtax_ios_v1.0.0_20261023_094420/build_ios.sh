#!/bin/bash
set -e
echo "Building gtax iOS Archive for App Store / TestFlight..."
flutter pub get
cd ios && pod install && cd ..
flutter build ipa --release --export-options-plist=ExportOptions.plist
echo "Build complete: build/ios/ipa/gtax.ipa"
