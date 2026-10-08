# Architecture

React Native owns the alarm list and editor. Kotlin owns storage, scheduling, sound, vibration, and the ringing screen.

```text
Home and editor
        |
        v
alarmService.js
        |
        v
AlarmModule.kt
        |
        +-- AlarmStore.kt          private JSON file
        +-- AlarmScheduler.kt      AlarmManager.setAlarmClock
                |
                v
        AlarmReceiver.kt
                |
                +-- AlarmRingtoneService.kt   mediaPlayback foreground service
                +-- RingingActivity.kt        lock screen, Stop
```

After `setAlarmClock` returns, Android holds the trigger. Metro and the JavaScript process are not required for it to ring. Swiping the app out of Recents does not cancel the alarm. Force-stop in system Settings does, because Android cancels alarms when an app is force-stopped.

## Exact alarms

The manifest does not enable both exact-alarm permissions on the same OS version.

- API 31–32: `SCHEDULE_EXACT_ALARM` with `android:maxSdkVersion="32"`. If it is not granted, the app can open the Android 12 Alarms & reminders screen. A grant broadcast reschedules enabled alarms.
- API 33+: `USE_EXACT_ALARM`. It is granted at install for this alarm-clock app and is not a user setting. The Android 12 settings screen is not opened. If `canScheduleExactAlarms()` is still false, scheduling fails with an error.
- API 24–30: no special exact-alarm permission.

## Ringing

`AlarmRingtoneService` is a `mediaPlayback` foreground service:

- `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_MEDIA_PLAYBACK`
- `android:foregroundServiceType="mediaPlayback"`
- `startForeground` with `FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK` before audio starts
- an ongoing alarm notification with a full-screen intent
- system alarm audio on `USAGE_ALARM`, plus vibration when enabled

`BootReceiver` only reschedules alarms. It does not start the ringtone service. Android 15 does not allow a `mediaPlayback` foreground service to be started from boot.

On Android 13 and earlier, full-screen intent is granted with the manifest permission. On Android 14 and later, the app checks `canUseFullScreenIntent()` and opens the system page only when that returns false.

The alarm record lives in app-private storage read by Kotlin. JavaScript does not keep a second database. There is no SQLite, MMKV, Redux, or React Navigation in this milestone.

## Later boundaries

`alarmService.js` is the platform boundary. A future iOS implementation can replace the native side without changing the screens. Auth, billing, and sync services should be added only when those features are built. The backend will synchronize data. It will not schedule the wake-up.
