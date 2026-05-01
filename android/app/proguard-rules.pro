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

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# React Native Worklets
-keep class com.worklets.** { *; }

# Vision Camera
-keep class com.mrousavy.camera.** { *; }

# Sentry
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**