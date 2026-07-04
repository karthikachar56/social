package com.example.eventhubuser.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
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
    private const val KEY_USER_NAME = "user_name"
    private const val KEY_USER_EMAIL = "user_email"
    private const val KEY_USER_PHONE = "user_phone"
    private const val KEY_USER_AVATAR = "user_avatar"

    // SharedPreferences access
    fun saveSession(context: Context, token: String, name: String, email: String, phone: String?, avatar: String?) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString(KEY_TOKEN, token)
            putString(KEY_USER_NAME, name)
            putString(KEY_USER_EMAIL, email)
            putString(KEY_USER_PHONE, phone ?: "")
            putString(KEY_USER_AVATAR, avatar ?: "")
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
            name = prefs.getString(KEY_USER_NAME, "") ?: "",
            email = prefs.getString(KEY_USER_EMAIL, "") ?: "",
            phone = prefs.getString(KEY_USER_PHONE, "") ?: "",
            avatar = prefs.getString(KEY_USER_AVATAR, "") ?: ""
        )
    }

    fun clearSession(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
    }

    // Like local states mimicking web app localStorage
    fun isLiked(context: Context, id: String): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val set = prefs.getStringSet("liked_posts", emptySet()) ?: emptySet()
        return set.contains(id)
    }

    fun toggleLike(context: Context, id: String): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val set = prefs.getStringSet("liked_posts", emptySet()) ?: emptySet()
        val newSet = set.toMutableSet()
        val liked: Boolean
        if (newSet.contains(id)) {
            newSet.remove(id)
            liked = false
        } else {
            newSet.add(id)
            liked = true
        }
        prefs.edit().putStringSet("liked_posts", newSet).apply()
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

    // Upload image base64
    suspend fun uploadPhoto(token: String, base64Image: String): String {
        val body = JSONObject().apply {
            put("image", "data:image/jpeg;base64,$base64Image")
        }
        val res = JSONObject(apiRequest("/api/upload", "POST", body, token))
        return res.getString("url")
    }

    // Events and News
    suspend fun getEvents(): JSONArray {
        return JSONArray(apiRequest("/api/events", "GET"))
    }

    suspend fun getNews(): JSONArray {
        return JSONArray(apiRequest("/api/news", "GET"))
    }

    suspend fun toggleEventLike(token: String, eventId: String): JSONObject {
        return JSONObject(apiRequest("/api/events/$eventId/like", "POST", null, token))
    }

    suspend fun toggleNewsLike(token: String, newsId: String): JSONObject {
        return JSONObject(apiRequest("/api/news/$newsId/like", "POST", null, token))
    }

    // Comments
    suspend fun getComments(postId: String): JSONArray {
        return JSONArray(apiRequest("/api/posts/$postId/comments", "GET"))
    }

    suspend fun postComment(token: String, postId: String, text: String): JSONObject {
        val body = JSONObject().apply {
            put("content", text)
        }
        return JSONObject(apiRequest("/api/posts/$postId/comments", "POST", body, token))
    }

    // Notifications
    suspend fun getNotifications(token: String): JSONArray {
        return JSONArray(apiRequest("/api/notifications", "GET", null, token))
    }

    suspend fun markAllNotificationsRead(token: String): JSONObject {
        return JSONObject(apiRequest("/api/notifications", "PUT", null, token))
    }
}

data class UserProfile(
    val name: String,
    val email: String,
    val phone: String,
    val avatar: String
)
