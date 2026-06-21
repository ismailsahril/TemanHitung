# TemanHitung (Mental Math Training App)

A mobile-first Mental Math Training application built with React, TypeScript, Tailwind CSS, Framer Motion, and Capacitor, specifically customized for adults, parents, and non-technical users in Indonesia.

## Features
- **Arithmetic Practice**: Select and practice Addition, Subtraction, Multiplication, and Division.
- **Three Difficulties**: Easy (small numbers), Medium (medium numbers), and Hard (large numbers).
- **Companion Pet System**: Adopt learning buddies (Kiko the Cat, Hami the Hamster, etc.) that earn EXP and level up as you train.
- **Kasir Warung Mode**: Interactive roleplay cashier simulation to calculate multi-item total bills and correct customer change with realistic Indonesian market prices and space-optimized layouts.
- **Intelligent Strategies (Quick Tips)**: Concrete step-by-step calculation techniques in Indonesian for each generated question.
- **Accurate Statistics & Charting**: Accuracy tracker table per operation/difficulty combo and a responsive custom SVG line chart of recent scores.
- **Full Customizability**: Segmented theme switching (Light / Dark / Follow System), text size adjustments, high-contrast accessible mode, haptic and sound feedbacks.
- **System Back Button Interceptor**: Prevents immediate application termination on Android hardware back button click, routing between screens instead.
- **Security-First Engine**: Recomputes answers on the fly to prevent browser state manipulation.


---

## Development Setup

Install dependencies:
```bash
npm install
```

Run the local web development server:
```bash
npm run dev
```

Build the production app:
```bash
npm run build
```

---

## Android Build

Follow these steps to deploy and test on Android:

### Prerequisites
- Node.js 18+
- Java 17 (JDK)
- Android Studio with Android SDK API 24+ installed
- A physical Android device with USB debugging enabled, or an Android emulator

### Build Steps

1. **Build the web application**
   ```bash
   npm run build
   ```

2. **Sync configurations with Capacitor**
   ```bash
   npx cap sync android
   ```

3. **Open the project in Android Studio** (Opens the native project directory for compiling)
   ```bash
   npx cap open android
   ```
   In Android Studio, you can build the APK via the main menu: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

4. **Compile the APK directly via Command Line (CLI)**
   - On Windows (PowerShell/CMD):
     ```powershell
     cd android
     .\gradlew.bat assembleDebug
     ```
   - On macOS/Linux:
     ```bash
     cd android
     ./gradlew assembleDebug
     ```
   Once completed, the installable APK file will be located at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

5. **Or run directly on your connected device or emulator**
   ```bash
   npx cap run android
   ```
