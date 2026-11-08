# The page talks to the app through these methods by name, so R8 must not
# rename or remove them.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.evzomethod.growthlock.MainActivity$Bridge { *; }

# Entry points Android itself creates by name from the manifest.
-keep class com.evzomethod.growthlock.MainActivity
-keep class com.evzomethod.growthlock.BlockActivity
-keep class com.evzomethod.growthlock.LockService
-keep class com.evzomethod.growthlock.BootReceiver
