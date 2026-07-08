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

class NotificationService : Service() {
    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)
    
    private val FOREGROUND_NOTIF_ID = 9998
    private val GENERAL_NOTIF_ID_START = 20000
    private var notificationIdCounter = GENERAL_NOTIF_ID_START

    private val CHANNEL_ID = "eventhub_admin_channel"
    private val FOREGROUND_CHANNEL_ID = "eventhub_admin_sync_channel"

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
                "EventHub Admin Sync",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps admin notification syncing active in the background"
            }
            manager.createNotificationChannel(syncChannel)

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

    private fun startForegroundService() {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(this, FOREGROUND_CHANNEL_ID)
            .setContentTitle("EventHub admin sync active")
            .setContentText("Checking for new messages and comments...")
            .setSmallIcon(com.example.eventhubadmin.R.mipmap.ic_launcher)
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
                        checkForNewComments(token)
                        checkForNewChats(token)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                delay(15000) // Poll every 15 seconds
            }
        }
    }

    private suspend fun checkForNewComments(token: String) {
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
            newNotifications.add(item)
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

    private suspend fun checkForNewChats(token: String) {
        val unreadChatsArray = EventHubApi.getUnreadChatsCount(token)
        if (unreadChatsArray.length() == 0) return

        val sharedPrefs = getSharedPreferences("AdminNotificationServicePrefs", Context.MODE_PRIVATE)
        val lastSeenChatId = sharedPrefs.getString("last_seen_chat_message_id", null)

        val newestMessageId = unreadChatsArray.getJSONObject(unreadChatsArray.length() - 1).optString("_id")

        if (lastSeenChatId == null) {
            sharedPrefs.edit().putString("last_seen_chat_message_id", newestMessageId).apply()
            return
        }

        val newChats = mutableListOf<JSONObject>()
        for (i in (unreadChatsArray.length() - 1) downTo 0) {
            val item = unreadChatsArray.getJSONObject(i)
            val id = item.optString("_id")
            if (id == lastSeenChatId) {
                break
            }
            newChats.add(item)
        }

        for (item in newChats.reversed()) {
            val senderName = item.optString("senderName")
            val text = item.optString("text")
            triggerSystemNotification("New Message from $senderName", text)
        }

        if (newestMessageId.isNotEmpty()) {
            sharedPrefs.edit().putString("last_seen_chat_message_id", newestMessageId).apply()
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
