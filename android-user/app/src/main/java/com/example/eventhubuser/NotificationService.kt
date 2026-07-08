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

class NotificationService : Service() {
    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)
    
    private val FOREGROUND_NOTIF_ID = 9999
    private val GENERAL_NOTIF_ID_START = 10000
    private var notificationIdCounter = GENERAL_NOTIF_ID_START

    private val CHANNEL_ID = "eventhub_user_channel"
    private val FOREGROUND_CHANNEL_ID = "eventhub_sync_channel"

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        startForegroundService()
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
            
            // Sync channel for foreground service
            val syncChannel = NotificationChannel(
                FOREGROUND_CHANNEL_ID,
                "EventHub Sync Status",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps notification syncing active in the background"
            }
            manager.createNotificationChannel(syncChannel)

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

    private fun startForegroundService() {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(this, FOREGROUND_CHANNEL_ID)
            .setContentTitle("EventHub background sync active")
            .setContentText("Checking for new events and news...")
            .setSmallIcon(com.example.eventhubuser.R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                FOREGROUND_NOTIF_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            )
        } else {
            startForeground(FOREGROUND_NOTIF_ID, notification)
        }
    }

    private fun startPolling() {
        serviceScope.launch {
            while (isActive) {
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
            // Filter: we are only interested in new events or news posted by admins
            val type = item.optString("type")
            if (type == "event" || type == "news") {
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
