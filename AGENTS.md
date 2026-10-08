# WakeMind agent guide

WakeMind is an Android-first alarm app. JavaScript is the app layer. Kotlin is the alarm engine. Do not convert the app to TypeScript.

## Alarm reliability

- Schedule with `AlarmManager`. Do not use `setTimeout`, `setInterval`, push notifications, or a backend job as the alarm.
- After an alarm is scheduled, it must fire if the React Native process is dead and Metro is stopped.
- Removing the app from Recents must not cancel the alarm. Force-stop does, because Android cancels alarms then.
- The ringing screen, audio, and vibration stay in Kotlin. Future puzzle UI can mount inside that host. Do not move the trigger back into JavaScript.
- Alarm data used at ring time is local. Do not make a network call to dismiss or complete an alarm.
- Keep `SCHEDULE_EXACT_ALARM` limited with `android:maxSdkVersion="32"`. Use `USE_EXACT_ALARM` on API 33+. Do not open the Android 12 exact-alarm settings page on API 33+.
- Open full-screen intent settings only on API 34+ when `canUseFullScreenIntent()` is false.
- The ringtone service is `mediaPlayback`. Call `startForeground` with that type before playing audio. Do not start that service from the boot receiver.

## Scope

Do not add puzzle, questions, auth, billing, backend, AI, SQLite, MMKV, Redux, or React Navigation unless the task asks for that milestone.

Do not add a dependency without saying why it is required. Prefer Android platform APIs for the alarm path.

## Code

- Keep files small and name them for the one job they do.
- Put reusable numbers in constants.
- Log and surface failures. Do not swallow exceptions.
- Do not commit secrets or keystores.
- Run `npm test`, `npm run lint`, and `gradlew :app:assembleDebug` after alarm or app changes. Fix failures before calling the work done.
