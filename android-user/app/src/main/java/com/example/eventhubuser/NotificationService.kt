package com.example.eventhubuser

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.example.eventhubuser.data.EventHubApi
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

class NotificationService : Service() {
    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)
    
    private val GENERAL_NOTIF_ID_START = 10000
    private var notificationIdCounter = GENERAL_NOTIF_ID_START

    private val CHANNEL_ID = "eventhub_user_channel"

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        startPolling()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        serviceJob.cancel()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // User notification channel
            val userChannel = NotificationChannel(
                CHANNEL_ID,
                "EventHub Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Announcements about new events and news articles"
            }
            manager.createNotificationChannel(userChannel)
        }
    }

    private fun startPolling() {
        serviceScope.launch {
            while (isActive) {
                try {
                    // Check for updates backgroundly without notifications
                    checkForUpdates()
                } catch (e: Exception) {
                    e.printStackTrace()
                }

                try {
                    val token = EventHubApi.getSessionToken(applicationContext)
                    if (token != null) {
                        checkForNewNotifications(token)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                delay(15000) // Poll every 15 seconds
            }
        }
    }

    private val UPDATE_NOTIF_ID = 8888

    private suspend fun checkForUpdates() {
        try {
            val versionInfo = EventHubApi.getLatestVersionInfo()
            val serverVersionCode = versionInfo.optInt("versionCode", 0)
            val currentVersionCode = getAppVersionCode(applicationContext)
            
            if (serverVersionCode > currentVersionCode) {
                val apkUrl = versionInfo.optString("apkUrl", "")
                EventHubApi.setUpdateAvailable(applicationContext, true, apkUrl)
                triggerUpdateSystemNotification()
            } else {
                EventHubApi.setUpdateAvailable(applicationContext, false)
                val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                manager.cancel(UPDATE_NOTIF_ID)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun triggerUpdateSystemNotification() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("App Update Required")
            .setContentText("A new version of EventHub is available. Tap to install.")
            .setSmallIcon(com.example.eventhubuser.R.mipmap.ic_launcher)
            .setAutoCancel(false)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()

        manager.notify(UPDATE_NOTIF_ID, notification)
    }

    private fun getAppVersionCode(context: Context): Int {
        return try {
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                pInfo.longVersionCode.toInt()
            } else {
                pInfo.versionCode
            }
        } catch (e: Exception) {
            1
        }
    }

    private suspend fun checkForNewNotifications(token: String) {
        val notificationsArray = EventHubApi.getNotifications(token)
        if (notificationsArray.length() == 0) return

        val sharedPrefs = getSharedPreferences("NotificationServicePrefs", Context.MODE_PRIVATE)
        val lastSeenId = sharedPrefs.getString("last_seen_notification_id", null)

        // Find the newest notification ID to save for the next run
        val newestNotificationId = notificationsArray.getJSONObject(0).optString("_id")

        if (lastSeenId == null) {
            // First run: just initialize the last seen ID to prevent spamming old notifications
            sharedPrefs.edit().putString("last_seen_notification_id", newestNotificationId).apply()
            return
        }

        // Process notifications from oldest to newest
        val newNotifications = mutableListOf<JSONObject>()
        for (i in 0 until notificationsArray.length()) {
            val item = notificationsArray.getJSONObject(i)
            val id = item.optString("_id")
            if (id == lastSeenId) {
                break
            }
            // Filter: we are only interested in new events
            val type = item.optString("type")
            if (type == "event") {
                newNotifications.add(item)
            }
        }

        // Trigger notifications for new items (in chronological order, so reverse back)
        for (item in newNotifications.reversed()) {
            val title = item.optString("title")
            val message = item.optString("message")
            triggerSystemNotification(title, message)
        }

        // Update last seen ID
        if (newestNotificationId.isNotEmpty()) {
            sharedPrefs.edit().putString("last_seen_notification_id", newestNotificationId).apply()
        }
    }

    private fun triggerSystemNotification(title: String, message: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, notificationIdCounter, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(com.example.eventhubuser.R.mipmap.ic_launcher)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        manager.notify(notificationIdCounter++, notification)
    }
}
