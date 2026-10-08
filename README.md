# WakeMind

WakeMind is an Android-first alarm app. The alarm is scheduled on the device. It does not depend on a server, Metro, or the React Native process staying alive.

This repository is the Hello Alarm milestone: create an alarm, schedule it with Android, and stop the sound from a lock-screen screen.

## Docs

- [PRODUCT.md](PRODUCT.md) — product vision and roadmap
- [ARCHITECTURE.md](ARCHITECTURE.md) — React Native and Kotlin boundary
- [DEVELOPMENT.md](DEVELOPMENT.md) — how to run, test, and install on a phone
- [AGENTS.md](AGENTS.md) — rules for future coding sessions

## Current milestone

Hello Alarm includes:

- a home screen and a time editor
- a 60-second test alarm
- local alarm storage owned by Kotlin
- `AlarmManager.setAlarmClock`
- alarm sound, vibration, and a native stop screen

Puzzle, questions, accounts, billing, and cloud sync are not in this milestone.
