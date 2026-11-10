# Mentor — the phone app

The same page as [evzomethod.com/mentor](https://evzomethod.com/mentor/), wrapped
in an APK so it sits on the home screen and works with the phone in flight mode.

## Get it on the phone

No computer setup needed — GitHub builds the installable file.

1. Open the **Actions** tab of this repo → **Build Mentor APK** → the newest run.
   (If no run is listed, press **Run workflow** on that page.)
2. Download **Mentor-apk** at the bottom of the run page — a zip holding
   `app-release.apk`.
3. Open that file on the phone and install it. Android warns about installing
   outside the Play Store; that warning is expected for an app you built yourself.
4. It appears as **Mentor**. There is nothing to sign into.

## Only you

- **The app has no permissions at all — not even internet.** Look at
  `AndroidManifest.xml`: there is no `<uses-permission>` line. The page therefore
  *cannot* send anything anywhere, whatever it is asked to do.
- The page and its fonts are bundled inside the APK, so nothing is fetched at
  runtime and nothing appears in anyone's server logs.
- Everything you type — the offer, the pipeline, the money-model figures, the
  notes — is in the WebView's local storage, in the app's private data directory.
- **`allowBackup` is off on purpose**, so Google's backup service never carries
  those figures off the device. The price of that: **a reinstall starts empty.**
  Before reinstalling, use the page's *Copy a brief for Claude* button and paste
  the text somewhere, or you lose the numbers.
- The web copy at `evzomethod.com/mentor` is noindexed, unlinked and `Disallow`ed
  in `robots.txt` — unlisted rather than secret. The APK is the private one.

## How it is put together

| | |
|---|---|
| `mentor/index.html` (repo root) | the page — **the only file to edit** |
| `mentor-app/android` | ~90 lines of Kotlin and a Gradle build, nothing else |
| `.github/workflows/mentor-android.yml` | copies the page + `site/fonts` into `assets/` and builds |

Edit the page, push, and the workflow rebuilds the APK. Install it over the old
one: it is signed with the same checked-in debug key as GrowthLock, which is what
lets Android replace the app **without** wiping what you have stored.

One detail worth knowing: the page is served to the WebView over
`https://appassets.androidplatform.net/` by `WebViewAssetLoader`, not from
`file://`. Only a real origin keeps `localStorage` reliable across launches, and
on this app the local storage *is* the product.
