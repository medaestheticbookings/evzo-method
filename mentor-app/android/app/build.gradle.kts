plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.evzomethod.mentor"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.evzomethod.mentor"
        minSdk = 26
        targetSdk = 34
        // every CI build gets a higher number, which is what lets Android
        // install it over the previous one without losing stored work
        versionCode = (System.getenv("BUILD_NUMBER") ?: "1").toInt()
        versionName = "1." + (System.getenv("BUILD_NUMBER") ?: "1")
    }

    // Android's standard debug key, the same one GrowthLock is signed with, so
    // every build installs over the last. A different key per build would make
    // Android refuse the update, and everything typed into the app lives in the
    // WebView's local storage - a refused update means losing it.
    signingConfigs {
        getByName("debug") {
            storeFile = file("../debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("debug")
        }
        debug {
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    // woff2 is already compressed; letting aapt squeeze it again only costs
    // build time, and leaving the assets uncompressed makes them mmap-able
    androidResources {
        noCompress += listOf("woff2")
    }

    packaging {
        resources.excludes += setOf(
            "META-INF/*.version",
            "META-INF/**.kotlin_module",
            "kotlin/**",
            "DebugProbesKt.bin"
        )
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    // WebViewAssetLoader: it serves the bundled page over an https:// origin
    // instead of file://, which is the only reliable way to get localStorage to
    // persist. On a file:// page some WebView versions hand back an empty store
    // on the next launch, and the whole app is local storage.
    implementation("androidx.webkit:webkit:1.11.0")

    // NotificationCompat, for the daily reminders: the channel, permission and
    // builder rules differ on every Android version from 8 to 14, and this is
    // the one place where writing that by hand buys nothing.
    implementation("androidx.core:core:1.13.1")
}
