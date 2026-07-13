package com.bookrpartners

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.stallion.Stallion

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED

        override fun getJSBundleFile(): String? {
            return Stallion.getJSBundleFile(applicationContext)
        }
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  private fun createNotificationChannel() {
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      val channelId = "booking_alerts_v2"
      val channelName = "Booking Alerts"
      val channelDescription = "Notifications for new bookings"
      
      val importance = android.app.NotificationManager.IMPORTANCE_HIGH
      val channel = android.app.NotificationChannel(channelId, channelName, importance).apply {
        description = channelDescription
        // Use the explicit string path which is more reliable across Android versions
        val soundUri = android.content.ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + packageName + "/raw/notification_audio"
        val audioAttributes = android.media.AudioAttributes.Builder()
          .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION)
          .build()
        setSound(android.net.Uri.parse(soundUri), audioAttributes)
      }
      val notificationManager = getSystemService(android.app.NotificationManager::class.java)
      notificationManager?.createNotificationChannel(channel)
    }
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    loadReactNative(this)
  }
}