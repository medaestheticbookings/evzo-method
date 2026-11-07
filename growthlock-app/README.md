# GrowthLock — the native blocker

The web version at [evzomethod.com/growthlock](https://evzomethod.com/growthlock/) can time you and
notice when you leave, but a browser is not allowed to touch other apps. This repo is the part that
actually blocks.

## Android — works, build it here

No computer setup needed. GitHub builds the installable file for you.

1. Open the **Actions** tab of this repo → **Build APK** → the newest run.
2. Download **GrowthLock-apk** at the bottom of the run page (it is a zip holding `app-debug.apk`).
3. Open that file on the phone and install it. Android will warn about installing outside the Play
   Store; that warning is expected for an app you built yourself.
4. Open GrowthLock → **Allow blocking** → switch GrowthLock on in the list Android shows.
5. Pick 15 / 25 / 45 / 90 and press **Start the block**.

From then on, opening Instagram, TikTok, YouTube and the rest bounces straight back to a black screen
with your countdown. Calls, the dialler and emergency are never blocked.

### What it does and does not do

| | |
|---|---|
| Opening a blocked app from the home screen | Blocked |
| Switching to it through recent apps | Blocked |
| Opening it from a notification or a link | Blocked |
| A different browser | Blocked when "everything except calls" is on |
| Restarting the phone | Session survives; blocking resumes |
| Changing the clock | The end time is absolute, so winding the clock forward ends it early — a known hole |
| Turning the accessibility service off in Settings | Possible. Android gives no way to stop this on a normal phone |
| Uninstalling GrowthLock | Possible, same reason |
| New apps installed during a block | Blocked while "everything except calls" is on |

Nothing leaves the phone. The app reads the package name of whatever is in front, and nothing else.

## iPhone — written, needs a Mac and Apple's permission

`ios/GrowthLock/GrowthLockApp.swift` is the whole app, using Apple's real blocking frameworks
(FamilyControls, ManagedSettings, DeviceActivity). It cannot be built or installed from Windows.

To ship it you need:

1. A Mac with Xcode.
2. An Apple Developer account (99 EUR a year).
3. The **Family Controls** entitlement, which Apple grants on request:
   developer.apple.com → Support → Request Family Controls entitlement. Apps like Opal and one sec
   all run on this. Without it the app builds but the shield does nothing.

Then: new Xcode project (SwiftUI, iOS 16+), drop the file in, add the Family Controls capability,
run it on the phone.

## Layout

```
android/   Kotlin app — accessibility-service blocker, countdown notification, reboot recovery
ios/       SwiftUI app — Family Controls shield
.github/   Builds the Android APK on every push
```
