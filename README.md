
Site Marketplace - Expo React Native Demo
========================================

What this app does
- Import a CSV with rows: URL,Price,Traffic,DA,Email
- Stores listings locally on the device
- Search, filter, view details, add to cart, wallet top-up
- Simple demo that you can build into an APK

How to build (recommended: use Expo / EAS)
1. Install Node.js and Yarn or npm.
2. Install Expo CLI:
   npm install -g expo-cli
3. From the project folder:
   npm install
4. Start testing locally:
   expo start
   - Open with Expo Go on Android for quick testing.
5. To build a standalone Android APK using EAS (recommended):
   - Install EAS CLI: npm install -g eas-cli
   - Login: eas login
   - Configure: eas build:configure
   - Build: eas build -p android --profile production
   - Follow EAS instructions to get your APK/AAB download link.

Alternative: Use "expo build:android" (legacy, may be deprecated).

Notes
- This demo uses AsyncStorage to persist data locally.
- To import CSV on device, use Document Picker and choose a .csv file. CSV rows must be:
  URL,Price,Traffic,DA,Email (no header required).
