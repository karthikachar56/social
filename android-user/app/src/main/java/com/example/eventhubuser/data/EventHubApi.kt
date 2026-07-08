package com.example.eventhubuser.data

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.*
import java.net.HttpURLConnection
import java.net.URL

object EventHubApi {
    private const val BASE_URL = "https://social-eetirp.vercel.app"
    private const val PREFS_NAME = "EventHubPrefs"
    private const val KEY_TOKEN = "jwt_token"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_USER_NAME = "user_name"
    private const val KEY_USER_EMAIL = "user_email"
    private const val KEY_USER_PHONE = "user_phone"
    private const val KEY_USER_AVATAR = "user_avatar"
    private const val KEY_SAVED_EVENTS = "user_saved_events"
    private const val KEY_SAVED_NEWS = "user_saved_news"

    // SharedPreferences access
    fun saveSession(context: Context, token: String, id: String, name: String, email: String, phone: String?, avatar: String?, savedEventsJson: String? = null, savedNewsJson: String? = null) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString(KEY_TOKEN, token)
            putString(KEY_USER_ID, id)
            putString(KEY_USER_NAME, name)
            putString(KEY_USER_EMAIL, email)
            putString(KEY_USER_PHONE, phone ?: "")
            putString(KEY_USER_AVATAR, avatar ?: "")
            putString(KEY_SAVED_EVENTS, savedEventsJson ?: "[]")
            putString(KEY_SAVED_NEWS, savedNewsJson ?: "[]")
            apply()
        }
    }

    fun getSessionToken(context: Context): String? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_TOKEN, null)
    }

    fun getSessionUser(context: Context): UserProfile {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return UserProfile(
            id = prefs.getString(KEY_USER_ID, "") ?: "",
            name = prefs.getString(KEY_USER_NAME, "") ?: "",
            email = prefs.getString(KEY_USER_EMAIL, "") ?: "",
            phone = prefs.getString(KEY_USER_PHONE, "") ?: "",
            avatar = prefs.getString(KEY_USER_AVATAR, "") ?: "",
            savedEventsJson = prefs.getString(KEY_SAVED_EVENTS, "[]") ?: "[]",
            savedNewsJson = prefs.getString(KEY_SAVED_NEWS, "[]") ?: "[]"
        )
    }

    fun clearSession(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
    }

    // Memory Cache for liked posts to eliminate disk read lags during list scrolls
    private var likedPostsCache: MutableSet<String>? = null

    private fun getLikedPosts(context: Context): Set<String> {
        if (likedPostsCache == null) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            likedPostsCache = (prefs.getStringSet("liked_posts", emptySet()) ?: emptySet()).toMutableSet()
        }
        return likedPostsCache!!
    }

    fun isLiked(context: Context, id: String): Boolean {
        return getLikedPosts(context).contains(id)
    }

    fun toggleLike(context: Context, id: String): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val set = getLikedPosts(context).toMutableSet()
        val liked: Boolean
        if (set.contains(id)) {
            set.remove(id)
            liked = false
        } else {
            set.add(id)
            liked = true
        }
        likedPostsCache = set
        prefs.edit().putStringSet("liked_posts", set).apply()
        return liked
    }

    // Generic Request helper using HttpURLConnection
    private suspend fun apiRequest(
        path: String,
        method: String,
        body: JSONObject? = null,
        token: String? = null
    ): String = withContext(Dispatchers.IO) {
        val url = URL("$BASE_URL$path")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = method
        conn.connectTimeout = 15000
        conn.readTimeout = 15000
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("Accept", "application/json")
        if (token != null) {
            conn.setRequestProperty("Authorization", "Bearer $token")
        }

        if (body != null) {
            conn.doOutput = true
            val os = conn.outputStream
            val writer = BufferedWriter(OutputStreamWriter(os, "UTF-8"))
            writer.write(body.toString())
            writer.flush()
            writer.close()
            os.close()
        }

        val responseCode = conn.responseCode
        val stream = if (responseCode in 200..299) conn.inputStream else conn.errorStream ?: conn.inputStream
        val reader = BufferedReader(InputStreamReader(stream))
        val response = StringBuilder()
        var line: String?
        while (reader.readLine().also { line = it } != null) {
            response.append(line)
        }
        reader.close()

        if (responseCode in 200..299) {
            response.toString()
        } else {
            val errJson = try { JSONObject(response.toString()) } catch (e: Exception) { null }
            throw Exception(errJson?.optString("error") ?: "Server returned error: $responseCode")
        }
    }

    // Auth Calls
    suspend fun login(email: String, password: String): JSONObject {
        val body = JSONObject().apply {
            put("email", email)
            put("password", password)
        }
        return JSONObject(apiRequest("/api/auth/login", "POST", body))
    }

    suspend fun signup(name: String, email: String, password: String): JSONObject {
        val body = JSONObject().apply {
            put("name", name)
            put("email", email)
            put("password", password)
        }
        return JSONObject(apiRequest("/api/auth/signup", "POST", body))
    }

    suspend fun updateProfile(token: String, name: String, avatar: String, phone: String?): JSONObject {
        val body = JSONObject().apply {
            put("name", name)
            put("avatar", avatar)
            put("phone", phone ?: "")
        }
        return JSONObject(apiRequest("/api/auth/me", "PUT", body, token))
    }

    suspend fun getProfile(token: String): JSONObject {
        return JSONObject(apiRequest("/api/auth/me", "GET", null, token))
    }

    suspend fun changePassword(token: String, currentPass: String, newPass: String): JSONObject {
        val body = JSONObject().apply {
            put("currentPassword", currentPass)
            put("newPassword", newPass)
        }
        return JSONObject(apiRequest("/api/auth/change-password", "POST", body, token))
    }



    // Upload image base64
    suspend fun uploadPhoto(token: String, base64Image: String): String {
        val body = JSONObject().apply {
            put("image", "data:image/jpeg;base64,$base64Image")
        }
        val res = JSONObject(apiRequest("/api/upload", "POST", body, token))
        return res.getString("url")
    }

    // Memory caches for news and events to enable instant offline state loading
    private var eventsCache: JSONArray? = null
    private var newsCache: JSONArray? = null

    fun getCachedEvents(): List<JSONObject> {
        val list = mutableListOf<JSONObject>()
        val array = eventsCache ?: return emptyList()
        for (i in 0 until array.length()) {
            list.add(array.getJSONObject(i))
        }
        return list
    }

    fun getCachedNews(): List<JSONObject> {
        val list = mutableListOf<JSONObject>()
        val array = newsCache ?: return emptyList()
        for (i in 0 until array.length()) {
            list.add(array.getJSONObject(i))
        }
        return list
    }

    suspend fun getEvents(force: Boolean = false): JSONArray {
        if (eventsCache == null || force) {
            eventsCache = JSONArray(apiRequest("/api/events", "GET"))
        }
        return eventsCache!!
    }

    suspend fun getNews(force: Boolean = false): JSONArray {
        if (newsCache == null || force) {
            newsCache = JSONArray(apiRequest("/api/news", "GET"))
        }
        return newsCache!!
    }

    suspend fun toggleEventLike(token: String, eventId: String, liked: Boolean): JSONObject {
        val body = JSONObject().apply {
            put("action", if (liked) "like" else "unlike")
        }
        return JSONObject(apiRequest("/api/events/$eventId/like", "POST", body, token))
    }

    suspend fun toggleNewsLike(token: String, newsId: String, liked: Boolean): JSONObject {
        val body = JSONObject().apply {
            put("action", if (liked) "like" else "unlike")
        }
        return JSONObject(apiRequest("/api/news/$newsId/like", "POST", body, token))
    }

    // Comments
    suspend fun getComments(postId: String): JSONArray {
        return JSONArray(apiRequest("/api/posts/$postId/comments", "GET"))
    }

    suspend fun postComment(token: String, postId: String, text: String, postType: String): JSONObject {
        val body = JSONObject().apply {
            put("content", text)
            put("postType", postType)
        }
        return JSONObject(apiRequest("/api/posts/$postId/comments", "POST", body, token))
    }

    suspend fun toggleSavePost(token: String, postId: String, postType: String): JSONObject {
        val body = JSONObject().apply {
            put("postType", postType)
        }
        return JSONObject(apiRequest("/api/posts/$postId/save", "POST", body, token))
    }

    // Notifications
    suspend fun getNotifications(token: String): JSONArray {
        return JSONArray(apiRequest("/api/notifications", "GET", null, token))
    }

    suspend fun markAllNotificationsRead(token: String): JSONObject {
        val body = JSONObject().apply { put("markAll", true) }
        return JSONObject(apiRequest("/api/notifications", "PUT", body, token))
    }

    suspend fun markNotificationRead(token: String, notificationId: String): JSONObject {
        val body = JSONObject().apply { put("id", notificationId) }
        return JSONObject(apiRequest("/api/notifications", "PUT", body, token))
    }

    // Track Post Interaction (Share / Download)
    suspend fun trackPostAction(token: String, postId: String, type: String, postType: String): JSONObject {
        val body = JSONObject().apply {
            put("type", type)
            put("postType", postType)
        }
        return JSONObject(apiRequest("/api/posts/$postId/track", "POST", body, token))
    }

    // Helper to save files to the public shared Downloads folder
    private fun saveFileToPublicDownloads(
        context: Context,
        filename: String,
        mimeType: String,
        writeBlock: (OutputStream) -> Unit
    ) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val resolver = context.contentResolver
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
                put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
            }
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
            if (uri != null) {
                try {
                    resolver.openOutputStream(uri)?.use { outputStream ->
                        writeBlock(outputStream)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        } else {
            val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            if (!dir.exists()) dir.mkdirs()
            val file = File(dir, filename)
            try {
                FileOutputStream(file).use { outputStream ->
                    writeBlock(outputStream)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    // Permission-free Android file download helper that saves to public Downloads directory
    suspend fun downloadPostLocally(context: Context, title: String, content: String, imageUrl: String? = null): String = withContext(Dispatchers.IO) {
        val sanitizedTitle = title.replace("\\s+".toRegex(), "_")
        
        // Write text details to public Downloads
        saveFileToPublicDownloads(context, "$sanitizedTitle.txt", "text/plain") { output ->
            output.write(content.toByteArray(Charsets.UTF_8))
        }
        
        if (!imageUrl.isNullOrBlank()) {
            try {
                if (imageUrl.startsWith("data:image/") && imageUrl.contains(";base64,")) {
                    val base64String = imageUrl.substringAfter(";base64,")
                    val imageBytes = Base64.decode(base64String, Base64.DEFAULT)
                    val ext = if (imageUrl.contains("image/png")) "png" else "jpg"
                    val mime = if (imageUrl.contains("image/png")) "image/png" else "image/jpeg"
                    saveFileToPublicDownloads(context, "${sanitizedTitle}_image.$ext", mime) { output ->
                        output.write(imageBytes)
                    }
                } else {
                    val fullUrl = if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
                        imageUrl
                    } else {
                        val cleanUrl = if (imageUrl.startsWith("/")) imageUrl else "/$imageUrl"
                        "$BASE_URL$cleanUrl"
                    }
                    val url = URL(fullUrl)
                    val conn = url.openConnection() as HttpURLConnection
                    conn.connectTimeout = 15000
                    conn.readTimeout = 15000
                    conn.requestMethod = "GET"
                    val responseCode = conn.responseCode
                    if (responseCode in 200..299) {
                        val contentType = conn.contentType ?: ""
                        val ext = if (contentType.contains("png")) "png" else "jpg"
                        val mime = if (contentType.contains("png")) "image/png" else "image/jpeg"
                        saveFileToPublicDownloads(context, "${sanitizedTitle}_image.$ext", mime) { output ->
                            conn.inputStream.use { input ->
                                input.copyTo(output)
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        "Downloads/$sanitizedTitle.txt"
    }

    // Resolves relative URLs to absolute HTTP/HTTPS URLs or decodes Base64 data URLs
    fun formatImageUrl(url: String): Any? {
        if (url.isBlank()) return ""
        if (url.startsWith("data:image/") && url.contains(";base64,")) {
            return try {
                val base64String = url.substringAfter(";base64,")
                Base64.decode(base64String, Base64.DEFAULT)
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
            return url
        }
        val cleanUrl = if (url.startsWith("/")) url else "/$url"
        return "$BASE_URL$cleanUrl"
    }

    fun isDarkTheme(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean("dark_theme", false)
    }

    fun setDarkTheme(context: Context, isDark: Boolean) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putBoolean("dark_theme", isDark).apply()
    }
}

data class UserProfile(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val avatar: String,
    val savedEventsJson: String = "[]",
    val savedNewsJson: String = "[]"
)
