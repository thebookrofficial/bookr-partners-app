# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Keep BuildConfig so environment variables (like Supabase API keys) aren't stripped in Release
-keep class com.bookrpartners.BuildConfig { *; }

# ==========================================
# Stallion OTA Updates
# ==========================================
-keep class com.stallion.** { *; }
-dontwarn com.stallion.**

# ==========================================
# React Native Vision Camera & Nitro Modules
# ==========================================
-keep class com.margelo.nitro.** { *; }
-keep class com.mrousavy.camera.** { *; }
-keep class com.mrousavy.camera.core.** { *; }

# ==========================================
# React Native Firebase
# ==========================================
-keep class io.invertase.firebase.** { *; }
-keep class com.google.firebase.** { *; }

# ==========================================
# React Native Reanimated & Worklets
# ==========================================
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.worklets.** { *; }
-keep class com.worklets.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# ==========================================
# Sentry
# ==========================================
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**