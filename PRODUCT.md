# Product

WakeMind wakes someone by making them mentally active, not by playing a sound they can dismiss half-asleep. The people it is for care about work, study, training, and long-term discipline. The app should feel calm, precise, and reliable.

The phone is the source of truth at alarm time. A missing network, a stopped backend, or a killed app process must not stop the alarm from firing.

## Hello Alarm

The first milestone proves the Android alarm path:

1. Create or test an alarm in the app.
2. Android schedules it locally.
3. The alarm still fires if the app is backgrounded or removed from Recents.
4. Sound and vibration start.
5. A lock-screen screen appears.
6. Stop ends the sound and vibration, and a one-time alarm turns off.

Image puzzles, reflection questions, accounts, subscriptions, and sync come later. They must not become a dependency of this alarm path.

## Roadmap

1. Project foundation and Hello Alarm.
2. Alarm reliability: boot, time changes, lock screen, sound, vibration.
3. Alarm management: edit, delete, enable, and repeat schedules.
4. Solvable image puzzles, prepared before the alarm fires.
5. Reflection questions with a local word-count check. No network call is required to finish an alarm.
6. Default images and the Android photo picker, with resized local copies.
7. Default sounds, a local sound choice, and preview.
8. Google and phone sign-in.
9. Node, Express, MongoDB, and Mongoose.
10. Cloud backup and sync. The server does not fire the alarm.
11. Google Play Billing, with the backend as the entitlement source after verification.
12. Wake-up history.
13. Production hardening.
14. Play Store release.
15. An iOS alarm implementation behind the same service boundary. iOS is not part of the current build.
