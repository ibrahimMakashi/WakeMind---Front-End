# Development

## Requirements

- Node.js 22.13 or newer. This machine uses Node 26, which React Native 0.87 accepts.
- JDK 17. `JAVA_HOME` is set. If `java` is not on `PATH`, prepend `%JAVA_HOME%\bin` before Gradle commands.
- Android SDK at `ANDROID_HOME`, with platform 37, build-tools 37.0.0, and NDK 27.1.12297006.
- A phone or emulator. API 24 or newer.

## Install dependencies

```powershell
npm install
```

## Metro

```powershell
npm start
```

A debug build needs Metro to open the home screen and save an alarm. After the alarm is scheduled, Metro can be stopped. The ringing path is Kotlin.

## Android build

```powershell
cd android
.\gradlew.bat :app:assembleDebug :app:testDebugUnitTest
```

Install on a connected device:

```powershell
npm run android
```

## Checks

```powershell
npm test
npm run lint
```

## This phone

Wireless ADB has connected a OnePlus 8 (`IN2011`) running Android 13. Confirm it is still available:

```powershell
adb devices -l
```

The device id looks like `adb-..._adb-tls-connect._tcp`. If the list is empty, turn Wireless debugging back on and pair again. The port can change.

Android 13 will ask for notification permission. Allow it. This phone cannot show the Android 14 full-screen settings page, because that API does not exist yet. Exact alarms use `USE_EXACT_ALARM`, which is granted at install.

## Hello Alarm check

1. Open WakeMind and tap Test Alarm. It is scheduled about 60 seconds ahead.
2. Stop Metro.
3. Swipe WakeMind away from Recents.
4. Lock the phone.
5. The alarm sound should start and the ringing screen should appear.
6. Tap Stop. Sound and vibration should end. The alarm should be off when the app is opened again.

Do not force-stop WakeMind from system Settings. Android cancels scheduled alarms when an app is force-stopped.

## Troubleshooting

- `java` is not recognized: `%JAVA_HOME%\bin` is missing from `PATH`. Gradle still works when `JAVA_HOME` is set.
- SDK platform 37 is missing: install `platforms/android-37` with the Android CLI (`android sdk install`). The older `sdkmanager` on this machine cannot read the current SDK index.
- The alarm does not fire on a OnePlus device: OxygenOS battery controls can block apps after they leave Recents. Confirm `adb logcat -s WakeMindAlarm:I WakeMindAlarm:E` shows `Scheduled` and, at the trigger time, `fired`.
- The screen does not turn on, but the sound does: the ringtone service is running. On Android 14+, check full-screen notification access.
- Debug home screen is blank: Metro is not running, or the phone cannot reach the computer.
