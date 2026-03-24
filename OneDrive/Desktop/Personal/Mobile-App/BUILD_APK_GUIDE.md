# 🚀 Quick Start: Build Your Scanni APK

## TL;DR - Build APK Now!

**If you already have Android SDK installed:**
```powershell
cd "C:\Users\yassi\OneDrive\Desktop\Personal\Mobile-App"
.\flutter\bin\flutter.bat build apk --release
```

Your APK will be at: `build\app\outputs\flutter-apk\app-release.apk` 🎉

---

## Don't Have Android SDK? Follow These Steps:

### Option 1: Install Android Studio (Easiest - 10 minutes)

1. **Download Android Studio**  
   👉 https://developer.android.com/studio

2. **Install it**
   - Run the installer
   - Check all boxes (SDK, Platform Tools, etc.)
   - Let it download everything (~2-3 GB)

3. **Set Environment Variable**
   ```powershell
   # Run as Administrator
   setx ANDROID_HOME "C:\Users\yassi\AppData\Local\Android\Sdk" /M
   setx PATH "%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin" /M
   ```

4. **Restart PowerShell** (important!)

5. **Verify**
   ```powershell
   flutter doctor
   ```
   You should see ✓ for Android toolchain

6. **Accept Licenses**
   ```powershell
   flutter doctor --android-licenses
   ```
   Press 'y' for each one

7. **Build APK!**
   ```powershell
   cd "C:\Users\yassi\OneDrive\Desktop\Personal\Mobile-App"
   .\flutter\bin\flutter.bat build apk --release
   ```

---

### Option 2: Command Line Tools Only (Advanced - Smaller Download)

1. **Download Command Line Tools**  
   👉 https://developer.android.com/studio#command-line-tools-only
   - Download "commandlinetools-win-11076708_latest.zip"

2. **Extract to specific location**
   ```powershell
   # Create directory structure
   New-Item -ItemType Directory -Path "C:\Android\cmdline-tools\latest" -Force
   
   # Extract downloaded ZIP contents to:
   # C:\Android\cmdline-tools\latest\
   # (should have bin, lib folders inside latest)
   ```

3. **Set Environment Variables**
   ```powershell
   # Run as Administrator
   setx ANDROID_HOME "C:\Android" /M
   setx PATH "%PATH%;C:\Android\cmdline-tools\latest\bin;C:\Android\platform-tools" /M
   ```

4. **Restart PowerShell**

5. **Install SDK Components**
   ```powershell
   cd C:\Android\cmdline-tools\latest\bin
   .\sdkmanager.bat "platform-tools"
   .\sdkmanager.bat "platforms;android-34"
   .\sdkmanager.bat "build-tools;34.0.0"
   .\sdkmanager.bat "cmdline-tools;latest"
   ```

6. **Accept Licenses**
   ```powershell
   cd "C:\Users\yassi\OneDrive\Desktop\Personal\Mobile-App"
   .\flutter\bin\flutter.bat doctor --android-licenses
   ```
   Press 'y' for all

7. **Build APK!**
   ```powershell
   .\flutter\bin\flutter.bat build apk --release
   ```

---

## 📱 Install APK on Your Phone

### Method 1: USB Cable
1. Connect phone to PC
2. Copy `build\app\outputs\flutter-apk\app-release.apk` to phone's Downloads folder
3. On phone, open Files app → Downloads
4. Tap `app-release.apk` → Install

### Method 2: Google Drive / Email
1. Upload `app-release.apk` to Google Drive
2. Open on phone
3. Download and install

### Method 3: ADB (If connected via USB)
```powershell
adb install build\app\outputs\flutter-apk\app-release.apk
```

---

## ⚠️ Troubleshooting

### "Android SDK not found"
- Make sure you set ANDROID_HOME environment variable
- **Restart PowerShell after setting variables!**
- Run `$Env:ANDROID_HOME` to verify it's set

### "Unable to install APK on phone"
- Enable "Install from Unknown Sources" in phone settings
- Or: Settings → Apps → Special Access → Install unknown apps → Enable for your file manager

### Build fails with "license not accepted"
```powershell
.\flutter\bin\flutter.bat doctor --android-licenses
```
Press 'y' for all licenses

### "Command not found"
- Close and reopen PowerShell/Terminal
- Environment variables need a restart to take effect

---

## 🎯 What You'll Get

Once installed, you'll have:
- ✅ **Beautiful orange/red gradient icon**
- ✅ **"Scanni" app name**
- ✅ **Fully rounded modern dark UI**
- ✅ **Document scanning with camera**
- ✅ **OCR text recognition**
- ✅ **PDF generation**
- ✅ **Document library with search**
- ✅ **Share documents as PDF or JPEG**

---

## 📦 App Details

| Property | Value |
|----------|-------|
| App Name | Scanni |
| Package | com.scanni.app |
| Version | 1.0.0 |
| Min Android | API 21 (Android 5.0) |
| Target Android | API 34 (Android 14) |
| APK Size | ~25-30 MB |
| Permissions | Camera, Storage |

---

## Need Help?

1. Check `PROJECT_STATUS.md` for complete details
2. Check `ANDROID_SETUP_GUIDE.md` for detailed SDK setup
3. Run `.\flutter\bin\flutter.bat doctor -v` for diagnostics

---

**You're almost there! Just install Android SDK and build! 🚀**
