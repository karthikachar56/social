package com.example.eventhubadmin.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import android.content.Intent
import java.io.*
import java.net.HttpURLConnection
import java.net.URL

object EventHubApi {
    private const val BASE_URL = "https://social-eetirp.vercel.app"
    private const val PREFS_NAME = "EventHubAdminPrefs"
    private const val KEY_TOKEN = "jwt_token"
    private const val KEY_USER_NAME = "user_name"
    private const val KEY_USER_EMAIL = "user_email"
    private const val KEY_USER_PHONE = "user_phone"
    private const val KEY_USER_AVATAR = "user_avatar"
    private const val KEY_USER_OTHER = "user_other_details"

    private var cachedEvents: JSONArray? = null
    private var cachedNews: JSONArray? = null

    fun getCachedEvents(): JSONArray = cachedEvents ?: JSONArray()
    fun getCachedNews(): JSONArray = cachedNews ?: JSONArray()
    fun setCachedEvents(arr: JSONArray) { cachedEvents = arr }
    fun setCachedNews(arr: JSONArray) { cachedNews = arr }

    fun saveSession(
        context: Context,
        token: String,
        name: String,
        email: String,
        phone: String?,
        avatar: String?,
        otherDetails: String?
    ) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString(KEY_TOKEN, token)
            putString(KEY_USER_NAME, name)
            putString(KEY_USER_EMAIL, email)
            putString(KEY_USER_PHONE, phone ?: "")
            putString(KEY_USER_AVATAR, avatar ?: "")
            putString(KEY_USER_OTHER, otherDetails ?: "")
            apply()
        }
    }

    fun getSessionToken(context: Context): String? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_TOKEN, null)
    }

    fun getSessionUser(context: Context): AdminProfile {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return AdminProfile(
            name = prefs.getString(KEY_USER_NAME, "") ?: "",
            email = prefs.getString(KEY_USER_EMAIL, "") ?: "",
            phone = prefs.getString(KEY_USER_PHONE, "") ?: "",
            avatar = prefs.getString(KEY_USER_AVATAR, "") ?: "",
            otherDetails = prefs.getString(KEY_USER_OTHER, "") ?: ""
        )
    }

    fun clearSession(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
    }
 
    // Memory Cache for liked posts
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

    fun toggleLocalLike(context: Context, id: String): Boolean {
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

    suspend fun updateProfile(
        token: String,
        name: String,
        avatar: String,
        phone: String?,
        otherDetails: String?
    ): JSONObject {
        val body = JSONObject().apply {
            put("name", name)
            put("avatar", avatar)
            put("phone", phone ?: "")
            put("otherDetails", otherDetails ?: "")
        }
        return JSONObject(apiRequest("/api/auth/me", "PUT", body, token))
    }

    // Upload photo base64
    suspend fun uploadPhoto(token: String, base64Image: String): String {
        val body = JSONObject().apply {
            put("image", "data:image/jpeg;base64,$base64Image")
        }
        val res = JSONObject(apiRequest("/api/upload", "POST", body, token))
        return res.getString("url")
    }

    // Get posts list
    suspend fun getEvents(force: Boolean = false): JSONArray {
        if (!force && cachedEvents != null) {
            return cachedEvents!!
        }
        val res = JSONArray(apiRequest("/api/events", "GET"))
        cachedEvents = res
        return res
    }

    suspend fun getNews(force: Boolean = false): JSONArray {
        if (!force && cachedNews != null) {
            return cachedNews!!
        }
        val res = JSONArray(apiRequest("/api/news", "GET"))
        cachedNews = res
        return res
    }

    // Admin Events/News Writing
    suspend fun createEvent(token: String, title: String, description: String, date: String, time: String?, location: String?, category: String, image: String?, tags: List<String>): JSONObject {
        val body = JSONObject().apply {
            put("title", title)
            put("description", description)
            put("date", date)
            put("time", time ?: "")
            put("location", location ?: "")
            put("category", category)
            put("image", image ?: "")
            put("tags", JSONArray(tags))
        }
        return JSONObject(apiRequest("/api/events", "POST", body, token))
    }

    suspend fun createNews(token: String, title: String, content: String, summary: String?, category: String, image: String?, tags: List<String>): JSONObject {
        val body = JSONObject().apply {
            put("title", title)
            put("content", content)
            put("summary", summary ?: "")
            put("category", category)
            put("image", image ?: "")
            put("tags", JSONArray(tags))
        }
        return JSONObject(apiRequest("/api/news", "POST", body, token))
    }

    suspend fun editEvent(token: String, id: String, title: String, description: String, date: String, time: String?, location: String?, category: String, image: String?, tags: List<String>): JSONObject {
        val body = JSONObject().apply {
            put("title", title)
            put("description", description)
            put("date", date)
            put("time", time ?: "")
            put("location", location ?: "")
            put("category", category)
            put("image", image ?: "")
            put("tags", JSONArray(tags))
        }
        return JSONObject(apiRequest("/api/events/$id", "PUT", body, token))
    }

    suspend fun editNews(token: String, id: String, title: String, content: String, summary: String?, category: String, image: String?, tags: List<String>): JSONObject {
        val body = JSONObject().apply {
            put("title", title)
            put("content", content)
            put("summary", summary ?: "")
            put("category", category)
            put("image", image ?: "")
            put("tags", JSONArray(tags))
        }
        return JSONObject(apiRequest("/api/news/$id", "PUT", body, token))
    }

    suspend fun deleteEvent(token: String, id: String): JSONObject {
        return JSONObject(apiRequest("/api/events/$id", "DELETE", null, token))
    }

    suspend fun deleteNews(token: String, id: String): JSONObject {
        return JSONObject(apiRequest("/api/news/$id", "DELETE", null, token))
    }

    // Comments management
    suspend fun getComments(postId: String): JSONArray {
        return JSONArray(apiRequest("/api/posts/$postId/comments", "GET"))
    }

    suspend fun deleteComment(token: String, commentId: String): JSONObject {
        return JSONObject(apiRequest("/api/comments/$commentId", "DELETE", null, token))
    }

    suspend fun postComment(token: String, postId: String, content: String, postType: String): JSONObject {
        val body = JSONObject().apply {
            put("content", content)
            put("postType", postType)
        }
        return JSONObject(apiRequest("/api/posts/$postId/comments", "POST", body, token))
    }

    suspend fun toggleLike(token: String, postId: String, postType: String, liked: Boolean): JSONObject {
        val typePath = if (postType == "event") "events" else "news"
        val body = JSONObject().apply {
            put("action", if (liked) "like" else "unlike")
        }
        return JSONObject(apiRequest("/api/$typePath/$postId/like", "POST", body, token))
    }

    // Notifications
    suspend fun getNotifications(token: String): JSONArray {
        return JSONArray(apiRequest("/api/notifications", "GET", null, token))
    }

    // User management
    suspend fun getUsers(token: String): JSONArray {
        return JSONArray(apiRequest("/api/admin/users", "GET", null, token))
    }

    suspend fun toggleUserBan(token: String, userId: String, banned: Boolean): JSONObject {
        val body = JSONObject().apply {
            put("banned", banned)
        }
        return JSONObject(apiRequest("/api/admin/users/$userId", "PUT", body, token))
    }

    suspend fun deleteUser(token: String, userId: String): JSONObject {
        return JSONObject(apiRequest("/api/admin/users/$userId", "DELETE", null, token))
    }

    // Chat management
    suspend fun getAdmins(token: String): JSONArray {
        return JSONArray(apiRequest("/api/admin/list", "GET", null, token))
    }

    suspend fun getChatMessages(token: String, recipientId: String): JSONArray {
        return JSONArray(apiRequest("/api/admin/chat?recipientId=$recipientId", "GET", null, token))
    }

    suspend fun sendChatMessage(token: String, text: String, recipientId: String?, recipientName: String?): JSONObject {
        val body = JSONObject().apply {
            put("text", text)
            put("recipientId", recipientId ?: JSONObject.NULL)
            put("recipientName", recipientName ?: JSONObject.NULL)
        }
        return JSONObject(apiRequest("/api/admin/chat", "POST", body, token))
    }

    suspend fun getUnreadChatsCount(token: String): JSONArray {
        return JSONArray(apiRequest("/api/admin/chat/unread", "GET", null, token))
    }

    fun isDarkTheme(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean("dark_theme", false)
    }

    fun setDarkTheme(context: Context, isDark: Boolean) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putBoolean("dark_theme", isDark).apply()
    }

    suspend fun getLatestVersionInfo(): JSONObject {
        return JSONObject(apiRequest("/version-admin.json", "GET"))
    }

    suspend fun downloadAndInstallApk(context: Context, apkUrl: String) = withContext(Dispatchers.IO) {
        try {
            val url = URL(apkUrl)
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 15000
            connection.readTimeout = 15000
            connection.connect()

            if (connection.responseCode in 200..299) {
                val apkFile = File(context.cacheDir, "eventhub_admin_update.apk")
                connection.inputStream.use { input ->
                    apkFile.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }
                launchApkInstallation(context, apkFile)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun launchApkInstallation(context: Context, apkFile: File) {
        val authority = "${context.packageName}.fileprovider"
        val apkUri = androidx.core.content.FileProvider.getUriForFile(context, authority, apkFile)
        
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
        }
        context.startActivity(intent)
    }
}

data class AdminProfile(
    val name: String,
    val email: String,
    val phone: String,
    val avatar: String,
    val otherDetails: String
)
