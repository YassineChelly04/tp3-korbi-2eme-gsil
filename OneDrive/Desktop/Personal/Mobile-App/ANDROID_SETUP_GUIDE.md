# Android SDK Setup Guide for Building Scanni APK

## Quick Setup Option 1: Android Studio (Recommended)

1. **Download Android Studio**
   - Visit: https://developer.android.com/studio
   - Download and install Android Studio

2. **During Installation**
   - Check "Android SDK"
   - Check "Android SDK Platform"
   - Check "Android Virtual Device"

3. **After Installation**
   - Open Android Studio
   - Go to: Tools → SDK Manager
   - Install:
     * Android SDK Platform 34 (or latest)
     * Android SDK Build-Tools
     * Android SDK Command-line Tools
     * Android SDK Platform-Tools

4. **Set Environment Variables**
   ```powershell
   # Add to System Environment Variables:
   ANDROID_HOME = C:\Users\yassi\AppData\Local\Android\Sdk
   
   # Add to Path:
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\cmdline-tools\latest\bin
   ```

5. **Verify**
   ```powershell
   flutter doctor
   ```

## Quick Setup Option 2: Command Line Tools Only (Smaller Download)

1. **Download Command Line Tools**
   - Visit: https://developer.android.com/studio#command-line-tools-only
   - Download "Command line tools only" for Windows
   - Extract to: `C:\Android\cmdline-tools\latest\`

2. **Install SDK Components**
   ```powershell
   cd C:\Android\cmdline-tools\latest\bin
   .\sdkmanager.bat "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   ```

3. **Set Environment Variables**
   ```powershell
   setx ANDROID_HOME "C:\Android"
   setx PATH "%PATH%;C:\Android\platform-tools;C:\Android\cmdline-tools\latest\bin"
   ```

4. **Accept Licenses**
   ```powershell
   flutter doctor --android-licenses
   ```

## After SDK Setup - Build APK

1. **Navigate to project**
   ```powershell
   cd "C:\Users\yassi\OneDrive\Desktop\Personal\Mobile-App"
   ```

2. **Build APK**
   ```powershell
   .\flutter\bin\flutter.bat build apk --release
   ```

3. **Find your APK**
   - Location: `build\app\outputs\flutter-apk\app-release.apk`
   - Transfer this file to your phone!

## Installing APK on Your Phone

1. **Enable Unknown Sources**
   - On your phone: Settings → Security → Unknown Sources (Enable)
   - Or: Settings → Apps → Special Access → Install unknown apps

2. **Transfer APK**
   - Use USB cable and copy to Downloads folder
   - Or email it to yourself
   - Or use Google Drive / Dropbox

3. **Install**
   - Open file manager on phone
   - Navigate to Downloads
   - Tap on `app-release.apk`
   - Tap "Install"

## Current Project Status

✅ App code is ready
✅ All bugs fixed
✅ UI fully modernized with rounded design
✅ App icon created (orange/red gradient)
✅ App renamed to "Scanni"
✅ OpenCV edge detection implemented

⏳ Waiting for Android SDK installation to build APK
