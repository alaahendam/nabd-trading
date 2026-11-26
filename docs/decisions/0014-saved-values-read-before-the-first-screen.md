# 0014. The saved values are read before the first screen

- Status: accepted
- Date: 2026-11-26

## Context

The mobile app saves three small values: the client ID, the theme and the language. The stores and the API client ask for them synchronously, and AsyncStorage, the only storage that ships with Expo, is asynchronous. If a store started with a default and loaded its value later, the first frame would show the wrong theme or the wrong language and then switch (the plan calls this the "wrong-theme flash").

## Decision

`StartupStorage` (`apps/mobile/src/lib/storage/startup-storage.ts`) reads all three values with one `multiGet` while the splash screen is held, and keeps them in memory. After that, reads are synchronous and writes go through to AsyncStorage without being awaited. Storage that cannot be read starts the app with empty values, and a write that fails is kept for the session only: storage never stops the app.

One method does wait. `saveItem` awaits the write and says whether it reached storage, for a change that is followed by a reload (ADR 0015), which would otherwise cut the write short.

## Alternatives considered

- **MMKV.** Synchronous by nature, but it needs a native module and a development build, and Expo Go cannot run it. Three small values do not justify that (`docs/MOBILE-PLAN.md`).
- **Each store loads its own value asynchronously.** Simpler to write, but every store then needs a loading state, and the first frame is wrong.
- **Expo SecureStore.** Meant for secrets; none of these values is one.

## Consequences

- The splash screen is held for one storage read. It is short, but a storage that hangs would hold the app; the read is not given a timeout.
- Tests need no mocks of the stores: they pass an in-memory `AsyncKeyValueStore` to `StartupStorage.load` (STO-01 to STO-08 in `docs/testing/mobile-foundation.md` and `mobile-polish.md`).
- A value changed from another place while the app runs would not be seen. Nothing does that today.
