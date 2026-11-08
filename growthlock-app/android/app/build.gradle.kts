plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.evzomethod.growthlock"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.evzomethod.growthlock"
        minSdk = 26
        targetSdk = 34
        // every CI build gets a higher number, which is what lets Android
        // install it over the previous one
        versionCode = (System.getenv("BUILD_NUMBER") ?: "3").toInt()
        versionName = "1." + (System.getenv("BUILD_NUMBER") ?: "3")
    }

    // Android's standard debug key, checked in so that every build is signed
    // identically. Without one fixed key, a new build will not install over the
    // old app and the player would lose their progress on every update.
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
            // R8 strips the code and resources nothing reaches, which is most
            // of what a Kotlin app drags in by default
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("debug")
        }
        debug {
            signingConfig = signingConfigs.getByName("debug")
        }
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

// No AppCompat and no KTX: this app is four plain Activities and a service, and
// those libraries were the bulk of the download.
dependencies {
    // the only library left: FileProvider, for handing an update to the installer
    implementation("androidx.core:core:1.13.1")
}
