package com.example.eventhubadmin

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.example.eventhubadmin.data.EventHubApi
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

class NotificationService : Service() {
    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)
    
    private val GENERAL_NOTIF_ID_START = 20000
    private var notificationIdCounter = GENERAL_NOTIF_ID_START

    private val CHANNEL_ID = "eventhub_admin_channel"

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

            // Admin notification channel
            val adminChannel = NotificationChannel(
                CHANNEL_ID,
                "EventHub Admin Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Alerts about new chats and comments"
            }
            manager.createNotificationChannel(adminChannel)
        }
    }

    private fun startPolling() {
        serviceScope.launch {
            while (isActive) {
                try {
                    // Check for updates backgroundly and trigger install right away
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

    private suspend fun checkForUpdates() {
        try {
            val versionInfo = EventHubApi.getLatestVersionInfo()
            val serverVersionCode = versionInfo.optInt("versionCode", 0)
            val currentVersionCode = getAppVersionCode(applicationContext)
            
            if (serverVersionCode > currentVersionCode) {
                val apkUrl = versionInfo.optString("apkUrl", "")
                if (apkUrl.isNotEmpty()) {
                    EventHubApi.downloadAndInstallApk(applicationContext, apkUrl)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
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

        val sharedPrefs = getSharedPreferences("AdminNotificationServicePrefs", Context.MODE_PRIVATE)
        val lastSeenId = sharedPrefs.getString("last_seen_notification_id", null)

        val newestNotificationId = notificationsArray.getJSONObject(0).optString("_id")

        if (lastSeenId == null) {
            sharedPrefs.edit().putString("last_seen_notification_id", newestNotificationId).apply()
            return
        }

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

        for (item in newNotifications.reversed()) {
            val title = item.optString("title")
            val message = item.optString("message")
            triggerSystemNotification(title, message)
        }

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
            .setSmallIcon(com.example.eventhubadmin.R.mipmap.ic_launcher)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        manager.notify(notificationIdCounter++, notification)
    }
}
