package com.example.eventhubuser.ui

import android.content.Context
import android.util.Base64
import java.io.InputStream
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import coil.compose.AsyncImage
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.eventhubuser.ThemeState
import com.example.eventhubuser.data.EventHubApi
import com.example.eventhubuser.data.UserProfile
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

// Common Theme Gradients & Colors
val PurpleGradient = Brush.linearGradient(listOf(Color(0xFF8B5CF6), Color(0xFFEC4899)))

val BackgroundColor: Color
    @Composable
    get() = if (ThemeState.isDarkTheme) Color(0xFF0F172A) else Color(0xFFF8FAFC)

val CardBorderColor: Color
    @Composable
    get() = if (ThemeState.isDarkTheme) Color(0xFF334155) else Color(0xFFE2E8F0)

val ContentTextColor: Color
    @Composable
    get() = if (ThemeState.isDarkTheme) Color.White else Color(0xFF0F172A)

val SubtitleTextColor: Color
    @Composable
    get() = if (ThemeState.isDarkTheme) Color(0xFF94A3B8) else Color(0xFF64748B)

val CardBgColor: Color
    @Composable
    get() = if (ThemeState.isDarkTheme) Color(0xFF1E293B) else Color.White

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onNavigateToRegister: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf("") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundColor)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // App Branding
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(PurpleGradient),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Star, contentDescription = "Logo", tint = Color.White, modifier = Modifier.size(36.dp))
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text("EventHub", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
            Text("Community Portal", fontSize = 14.sp, color = SubtitleTextColor)

            Spacer(modifier = Modifier.height(32.dp))

            // Card Form
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = CardBgColor),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp).fillMaxWidth()) {
                    Text("Sign In", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
                    Spacer(modifier = Modifier.height(16.dp))

                    if (errorMsg.isNotEmpty()) {
                        Text(
                            errorMsg,
                            color = Color(0xFFDC2626),
                            fontSize = 12.sp,
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFFEF2F2))
                                .padding(10.dp)
                                .clip(RoundedCornerShape(8.dp))
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email Address") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF8B5CF6))
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF8B5CF6))
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    Button(
                        onClick = {
                            if (email.isBlank() || password.isBlank()) {
                                errorMsg = "All fields are required."
                                return@Button
                            }
                            scope.launch {
                                loading = true
                                errorMsg = ""
                                try {
                                    val res = EventHubApi.login(email.trim(), password)
                                    val token = res.getString("token")
                                    val role = res.getString("role")
                                    val userObj = res.getJSONObject("user")
                                    val name = userObj.getString("name")
                                    val phone = userObj.optString("phone", "")
                                    val avatar = userObj.optString("avatar", "")

                                    if (role != "user") {
                                        errorMsg = "Access denied. Use Admin app for Administrator login."
                                    } else {
                                        val id = userObj.getString("id")
                                        val savedEvs = userObj.optJSONArray("savedEvents")?.toString() ?: "[]"
                                        val savedNws = userObj.optJSONArray("savedNews")?.toString() ?: "[]"
                                        EventHubApi.saveSession(context, token, id, name, email, phone, avatar, savedEvs, savedNws)
                                        onLoginSuccess()
                                    }
                                } catch (e: Exception) {
                                    errorMsg = e.message ?: "Authentication failed."
                                } finally {
                                    loading = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                        enabled = !loading
                    ) {
                        if (loading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                        } else {
                            Text("Sign In", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            Text(
                "Don't have an account? Sign Up",
                color = Color(0xFF8B5CF6),
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
                modifier = Modifier.clickable { onNavigateToRegister() }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    onRegisterSuccess: () -> Unit,
    onNavigateToLogin: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf("") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundColor)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(PurpleGradient),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Add, contentDescription = "Logo", tint = Color.White, modifier = Modifier.size(36.dp))
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text("Create Account", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
            Text("Join the EventHub community", fontSize = 14.sp, color = SubtitleTextColor)

            Spacer(modifier = Modifier.height(28.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = CardBgColor),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp).fillMaxWidth()) {
                    Text("Register", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
                    Spacer(modifier = Modifier.height(16.dp))

                    if (errorMsg.isNotEmpty()) {
                        Text(
                            errorMsg,
                            color = Color(0xFFDC2626),
                            fontSize = 12.sp,
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFFEF2F2))
                                .padding(10.dp)
                                .clip(RoundedCornerShape(8.dp))
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Display Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF8B5CF6))
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email Address") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF8B5CF6))
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF8B5CF6))
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    Button(
                        onClick = {
                            if (name.isBlank() || email.isBlank() || password.isBlank()) {
                                errorMsg = "All fields are required."
                                return@Button
                            }
                            scope.launch {
                                loading = true
                                errorMsg = ""
                                try {
                                    val res = EventHubApi.signup(name.trim(), email.trim(), password)
                                    val token = res.getString("token")
                                    val userObj = res.getJSONObject("user")
                                    val savedName = userObj.getString("name")
                                    val phone = userObj.optString("phone", "")
                                    val avatar = userObj.optString("avatar", "")

                                    val id = userObj.getString("id")
                                    val savedEvs = userObj.optJSONArray("savedEvents")?.toString() ?: "[]"
                                    val savedNws = userObj.optJSONArray("savedNews")?.toString() ?: "[]"
                                    EventHubApi.saveSession(context, token, id, savedName, email.trim(), phone, avatar, savedEvs, savedNws)
                                    onRegisterSuccess()
                                } catch (e: Exception) {
                                    errorMsg = e.message ?: "Registration failed."
                                } finally {
                                    loading = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                        enabled = !loading
                    ) {
                        if (loading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                        } else {
                            Text("Register", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            Text(
                "Already have an account? Sign In",
                color = Color(0xFF8B5CF6),
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
                modifier = Modifier.clickable { onNavigateToLogin() }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileSetupScreen(
    onSetupComplete: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val token = remember { EventHubApi.getSessionToken(context) ?: "" }
    val user = remember { EventHubApi.getSessionUser(context) }

    var displayName by remember { mutableStateOf(user.name) }
    var phone by remember { mutableStateOf("") }
    var avatarUrl by remember { mutableStateOf("") }
    var errorMsg by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }

    val presetAvatars = listOf(
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
        "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundColor)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Complete Profile", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
            Text("Add details so other members can reach you", fontSize = 12.sp, color = SubtitleTextColor)

            Spacer(modifier = Modifier.height(24.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = CardBgColor),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp).fillMaxWidth()) {
                    if (errorMsg.isNotEmpty()) {
                        Text(
                            errorMsg,
                            color = Color(0xFFDC2626),
                            fontSize = 12.sp,
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFFEF2F2))
                                .padding(8.dp)
                                .clip(RoundedCornerShape(6.dp))
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    val galleryLauncher = rememberLauncherForActivityResult(
                        contract = ActivityResultContracts.GetContent()
                    ) { uri: android.net.Uri? ->
                        if (uri != null) {
                            scope.launch {
                                try {
                                    loading = true
                                    val base64 = uriToCompressedBase64(context, uri)
                                    val cloudUrl = EventHubApi.uploadPhoto(token, base64)
                                    avatarUrl = cloudUrl
                                    errorMsg = ""
                                } catch (e: Exception) {
                                    errorMsg = e.message ?: "Failed to upload custom photo."
                                } finally {
                                    loading = false
                                }
                            }
                        }
                    }

                    // Preset Avatars Selector
                    Text("Select a Profile Photo", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = SubtitleTextColor)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        presetAvatars.forEach { url ->
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(CircleShape)
                                    .background(if (avatarUrl == url) Color(0xFF8B5CF6) else Color.Transparent)
                                    .padding(if (avatarUrl == url) 2.dp else 0.dp)
                                    .clip(CircleShape)
                                    .clickable { avatarUrl = url }
                            ) {
                                AsyncImage(
                                    model = url,
                                    contentDescription = "Preset Avatar",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                            }
                        }

                        val isCustomSelected = avatarUrl.isNotEmpty() && !presetAvatars.contains(avatarUrl)
                        Box(
                            modifier = Modifier
                                .size(46.dp)
                                .clip(CircleShape)
                                .background(if (isCustomSelected) Color(0xFF8B5CF6) else Color(0xFFEEF2F6))
                                .padding(if (isCustomSelected) 2.dp else 0.dp)
                                .clip(CircleShape)
                                .clickable { galleryLauncher.launch("image/*") },
                            contentAlignment = Alignment.Center
                        ) {
                            if (isCustomSelected) {
                                AsyncImage(
                                    model = EventHubApi.formatImageUrl(avatarUrl),
                                    contentDescription = "Custom Avatar",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                Icon(Icons.Default.CameraAlt, contentDescription = "Upload Custom", tint = Color(0xFF8B5CF6), modifier = Modifier.size(20.dp))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = displayName,
                        onValueChange = { displayName = it },
                        label = { Text("Display Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF8B5CF6))
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Phone Number") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF8B5CF6))
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    Button(
                        onClick = {
                            if (displayName.isBlank() || phone.isBlank()) {
                                errorMsg = "Display Name and Phone Number are required."
                                return@Button
                            }
                            scope.launch {
                                loading = true
                                errorMsg = ""
                                try {
                                    val res = EventHubApi.updateProfile(
                                        token = token,
                                        name = displayName.trim(),
                                        avatar = avatarUrl,
                                        phone = phone.trim()
                                    )
                                    val userObj = res.getJSONObject("user")
                                    val savedName = userObj.getString("name")
                                    val savedPhone = userObj.getString("phone")
                                    val savedAvatar = userObj.getString("avatar")

                                    val id = userObj.getString("id")
                                    val savedEvs = userObj.optJSONArray("savedEvents")?.toString() ?: "[]"
                                    val savedNws = userObj.optJSONArray("savedNews")?.toString() ?: "[]"
                                    EventHubApi.saveSession(
                                        context,
                                        token,
                                        id,
                                        savedName,
                                        user.email,
                                        savedPhone,
                                        savedAvatar,
                                        savedEvs,
                                        savedNws
                                    )
                                    onSetupComplete()
                                } catch (e: Exception) {
                                    errorMsg = e.message ?: "Failed to update profile."
                                } finally {
                                    loading = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                        enabled = !loading
                    ) {
                        if (loading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                        } else {
                            Text("Save Profile", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))
            TextButton(onClick = { onSetupComplete() }) {
                Text("Skip for now", color = SubtitleTextColor)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToEventDetail: (String) -> Unit,
    onNavigateToNewsDetail: (String) -> Unit,
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    var selectedTab by remember { mutableStateOf(0) }
    val token = remember { EventHubApi.getSessionToken(context) ?: "" }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        if (token.isNotEmpty()) {
            scope.launch {
                try {
                    val profileJson = EventHubApi.getProfile(token)
                    val userObj = profileJson.getJSONObject("user")
                    if (userObj.optBoolean("banned", false)) {
                        android.widget.Toast.makeText(
                            context,
                            "Your account has been suspended by an administrator.",
                            android.widget.Toast.LENGTH_LONG
                        ).show()
                        EventHubApi.clearSession(context)
                        onLogout()
                    }
                } catch (e: Exception) {
                    val msg = e.message ?: ""
                    if (msg.contains("suspended", ignoreCase = true) || msg.contains("403")) {
                        android.widget.Toast.makeText(
                            context,
                            "Your account has been suspended by an administrator.",
                            android.widget.Toast.LENGTH_LONG
                        ).show()
                        EventHubApi.clearSession(context)
                        onLogout()
                    }
                }
            }
        }
    }

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = CardBgColor) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.DateRange, contentDescription = "Events") },
                    label = { Text("Events") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.AutoMirrored.Filled.List, contentDescription = "News") },
                    label = { Text("News") }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Notifications, contentDescription = "Alerts") },
                    label = { Text("Alerts") }
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                    label = { Text("Profile") }
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(BackgroundColor)
        ) {
            when (selectedTab) {
                0 -> EventsTab(onNavigateToEventDetail)
                1 -> NewsTab(onNavigateToNewsDetail)
                2 -> AlertsTab()
                3 -> ProfileTab(onNavigateToEventDetail, onNavigateToNewsDetail, onLogout)
            }
        }
    }
}

@Composable
fun EventsTab(onNavigateToEventDetail: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var events by remember { mutableStateOf<List<JSONObject>>(EventHubApi.getCachedEvents()) }
    var loading by remember { mutableStateOf(events.isEmpty()) }
    var errorMsg by remember { mutableStateOf("") }

    // Filters states matching web
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("All") }
    val categories = listOf("All", "General", "Academic", "Cultural", "Sports", "Tech")

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val array = EventHubApi.getEvents(force = true)
                val list = mutableListOf<JSONObject>()
                for (i in 0 until array.length()) {
                    list.add(array.getJSONObject(i))
                }
                events = list
                errorMsg = ""
            } catch (e: Exception) {
                if (events.isEmpty()) {
                    errorMsg = e.message ?: "Failed to load events."
                }
            } finally {
                loading = false
            }
        }
    }

    if (loading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF8B5CF6))
        }
    } else if (errorMsg.isNotEmpty() && events.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
            Text(errorMsg, color = Color(0xFFDC2626), textAlign = TextAlign.Center)
        }
    } else {
        // Filter events
        val filteredEvents = events.filter {
            (selectedCategory == "All" || it.getString("category").equals(selectedCategory, ignoreCase = true)) &&
            (it.getString("title").contains(searchQuery, ignoreCase = true) || it.getString("description").contains(searchQuery, ignoreCase = true))
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                EventHubHeroHeader(
                    title = "Discover Events\n& Latest News",
                    subtitle = "Your central hub for everything happening. Stay informed with events and updates posted by our team of admins.",
                    eventsCount = events.size,
                    newsCount = 0
                )
                Spacer(modifier = Modifier.height(16.dp))

                // Search Bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search events...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = Color.Gray) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF8B5CF6))
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Scrollable category row
                androidx.compose.foundation.lazy.LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(categories) { cat ->
                        CategoryChip(
                            text = cat,
                            selected = selectedCategory == cat,
                            onClick = { selectedCategory = cat }
                        )
                    }
                }
            }

            if (filteredEvents.isEmpty()) {
                item {
                    Text("No events match your criteria.", modifier = Modifier.fillMaxWidth().padding(40.dp), textAlign = TextAlign.Center, color = SubtitleTextColor)
                }
            } else {
                items(filteredEvents) { ev ->
                    EventCard(ev, onClick = { onNavigateToEventDetail(ev.getString("_id")) })
                }
            }
        }
    }
}

@Composable
fun EventCard(event: JSONObject, onClick: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val eventId = event.getString("_id")
    val title = event.getString("title")
    val category = event.getString("category")
    val description = event.getString("description")
    val adminName = event.getString("adminName")
    val commentsCount = event.optInt("commentsCount", 0)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardBgColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column {
            val imgUrl = event.optString("image", "")
            if (imgUrl.isNotEmpty()) {
                AsyncImage(
                    model = EventHubApi.formatImageUrl(imgUrl),
                    contentDescription = "Event Cover",
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp),
                    contentScale = ContentScale.Crop
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp)
                        .background(Brush.linearGradient(listOf(Color(0xFF8B5CF6).copy(alpha = 0.2f), Color(0xFFEC4899).copy(alpha = 0.1f)))),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.DateRange,
                        contentDescription = "Event",
                        tint = Color(0xFF8B5CF6),
                        modifier = Modifier.size(48.dp)
                    )
                }
            }

            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFF3E8FF))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                            .clip(RoundedCornerShape(4.dp))
                    ) {
                        Text("EVENT", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8B5CF6))
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFF1F5F9))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                            .clip(RoundedCornerShape(4.dp))
                    ) {
                        Text(category.uppercase(), fontSize = 9.sp, fontWeight = FontWeight.Bold, color = SubtitleTextColor)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    title,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = ContentTextColor,
                    lineHeight = 22.sp
                )

                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    description,
                    fontSize = 13.sp,
                    color = SubtitleTextColor,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(12.dp))
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Place, contentDescription = "Location", tint = SubtitleTextColor, modifier = Modifier.size(13.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(event.optString("location", "Virtual"), fontSize = 11.sp, color = SubtitleTextColor)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Person, contentDescription = "Author", tint = SubtitleTextColor, modifier = Modifier.size(13.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Posted by $adminName", fontSize = 11.sp, color = SubtitleTextColor)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Color(0xFFF1F5F9))
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val isLiked = remember { mutableStateOf(EventHubApi.isLiked(context, eventId)) }
                    val likesCount = remember { mutableStateOf(event.optInt("likes", 0)) }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(
                            onClick = {
                                val token = EventHubApi.getSessionToken(context) ?: return@IconButton
                                scope.launch {
                                    val likedNow = EventHubApi.toggleLike(context, eventId)
                                    isLiked.value = likedNow
                                    try {
                                        val res = EventHubApi.toggleEventLike(token, eventId)
                                        likesCount.value = res.getInt("likes")
                                    } catch (e: Exception) {
                                        likesCount.value = likesCount.value + if (likedNow) 1 else -1
                                    }
                                }
                            },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = if (isLiked.value) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                contentDescription = "Like",
                                tint = if (isLiked.value) Color(0xFFEC4899) else Color(0xFF64748B),
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Text("${likesCount.value}", fontSize = 11.sp, color = SubtitleTextColor)

                        Spacer(modifier = Modifier.width(16.dp))

                        IconButton(
                            onClick = onClick,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Comment,
                                contentDescription = "Comments",
                                tint = SubtitleTextColor,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Text("$commentsCount", fontSize = 11.sp, color = SubtitleTextColor)
                    }

                    Row {
                        IconButton(
                            onClick = {
                                val token = EventHubApi.getSessionToken(context) ?: return@IconButton
                                scope.launch {
                                    try {
                                        EventHubApi.trackPostAction(token, eventId, "download", "event")
                                    } catch (e: Exception) {}
                                    val detailsStr = "Title: $title\nCategory: $category\nDescription: $description\nPosted by: $adminName"
                                    EventHubApi.downloadPostLocally(context, title, detailsStr, imgUrl)
                                    android.widget.Toast.makeText(context, "Details downloaded!", android.widget.Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ArrowDownward,
                                contentDescription = "Download",
                                tint = SubtitleTextColor,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        IconButton(
                            onClick = {
                                val token = EventHubApi.getSessionToken(context) ?: return@IconButton
                                scope.launch {
                                    try {
                                        EventHubApi.trackPostAction(token, eventId, "share", "event")
                                    } catch (e: Exception) {}
                                    val shareIntent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
                                        type = "text/plain"
                                        putExtra(android.content.Intent.EXTRA_SUBJECT, title)
                                        putExtra(android.content.Intent.EXTRA_TEXT, "Check out this event on EventHub: $title\nhttps://social-eetirp.vercel.app/events/$eventId")
                                    }
                                    context.startActivity(android.content.Intent.createChooser(shareIntent, "Share via"))
                                }
                            },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Share,
                                contentDescription = "Share",
                                tint = SubtitleTextColor,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        IconButton(
                            onClick = {
                                val token = EventHubApi.getSessionToken(context) ?: return@IconButton
                                scope.launch {
                                    try {
                                        val res = EventHubApi.toggleSavePost(token, eventId, "event")
                                        val updatedUser = res.getJSONObject("user")
                                        val savedEvs = updatedUser.optJSONArray("savedEvents")?.toString() ?: "[]"
                                        val savedNws = updatedUser.optJSONArray("savedNews")?.toString() ?: "[]"
                                        val curUser = EventHubApi.getSessionUser(context)
                                        EventHubApi.saveSession(
                                            context, token, curUser.id, curUser.name, curUser.email, curUser.phone, curUser.avatar, savedEvs, savedNws
                                        )
                                        android.widget.Toast.makeText(context, if (res.getBoolean("saved")) "Saved to bookmarks!" else "Removed from bookmarks!", android.widget.Toast.LENGTH_SHORT).show()
                                    } catch (e: Exception) {
                                        android.widget.Toast.makeText(context, "Error saving post.", android.widget.Toast.LENGTH_SHORT).show()
                                    }
                                }
                            },
                            modifier = Modifier.size(32.dp)
                        ) {
                            val curUser = EventHubApi.getSessionUser(context)
                            val isSaved = remember(curUser.savedEventsJson) {
                                try {
                                    val arr = JSONArray(curUser.savedEventsJson)
                                    var found = false
                                    for (i in 0 until arr.length()) {
                                        val item = arr.get(i)
                                        val idStr = if (item is JSONObject) item.optString("_id", "") else item.toString()
                                        if (idStr == eventId) found = true
                                    }
                                    found
                                } catch (e: Exception) {
                                    false
                                }
                            }
                            Icon(
                                imageVector = if (isSaved) Icons.Default.Bookmark else Icons.Outlined.BookmarkBorder,
                                contentDescription = "Save",
                                tint = if (isSaved) Color(0xFFF59E0B) else Color(0xFF64748B),
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun NewsTab(onNavigateToNewsDetail: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var newsList by remember { mutableStateOf<List<JSONObject>>(EventHubApi.getCachedNews()) }
    var loading by remember { mutableStateOf(newsList.isEmpty()) }
    var errorMsg by remember { mutableStateOf("") }

    // Filters states matching web
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("All") }
    val categories = listOf("All", "General", "Announcement", "Urgent")

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val array = EventHubApi.getNews(force = true)
                val list = mutableListOf<JSONObject>()
                for (i in 0 until array.length()) {
                    list.add(array.getJSONObject(i))
                }
                newsList = list
                errorMsg = ""
            } catch (e: Exception) {
                if (newsList.isEmpty()) {
                    errorMsg = e.message ?: "Failed to load news."
                }
            } finally {
                loading = false
            }
        }
    }

    if (loading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF8B5CF6))
        }
    } else if (errorMsg.isNotEmpty() && newsList.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
            Text(errorMsg, color = Color(0xFFDC2626), textAlign = TextAlign.Center)
        }
    } else {
        // Filter news list
        val filteredNews = newsList.filter {
            (selectedCategory == "All" || it.getString("category").equals(selectedCategory, ignoreCase = true)) &&
            (it.getString("title").contains(searchQuery, ignoreCase = true) || it.optString("summary", "").contains(searchQuery, ignoreCase = true))
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                EventHubHeroHeader(
                    title = "Discover Events\n& Latest News",
                    subtitle = "Your central hub for everything happening. Stay informed with events and updates posted by our team of admins.",
                    eventsCount = 0,
                    newsCount = newsList.size
                )
                Spacer(modifier = Modifier.height(16.dp))

                // Search Bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search news...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = Color.Gray) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF8B5CF6))
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Scrollable category row
                androidx.compose.foundation.lazy.LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(categories) { cat ->
                        CategoryChip(
                            text = cat,
                            selected = selectedCategory == cat,
                            onClick = { selectedCategory = cat }
                        )
                    }
                }
            }

            if (filteredNews.isEmpty()) {
                item {
                    Text("No news match your criteria.", modifier = Modifier.fillMaxWidth().padding(40.dp), textAlign = TextAlign.Center, color = SubtitleTextColor)
                }
            } else {
                items(filteredNews) { ns ->
                    NewsCard(ns, onClick = { onNavigateToNewsDetail(ns.getString("_id")) })
                }
            }
        }
    }
}

@Composable
fun NewsCard(news: JSONObject, onClick: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val newsId = news.getString("_id")
    val title = news.getString("title")
    val category = news.getString("category")
    val summary = news.optString("summary", "Read details...")
    val content = news.optString("content", "")
    val adminName = news.optString("adminName", "Admin")
    val commentsCount = news.optInt("commentsCount", 0)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardBgColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column {
            val imgUrl = news.optString("image", "")
            if (imgUrl.isNotEmpty()) {
                AsyncImage(
                    model = EventHubApi.formatImageUrl(imgUrl),
                    contentDescription = "News Cover",
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp),
                    contentScale = ContentScale.Crop
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp)
                        .background(Brush.linearGradient(listOf(Color(0xFFEC4899).copy(alpha = 0.2f), Color(0xFF8B5CF6).copy(alpha = 0.1f)))),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Info,
                        contentDescription = "News",
                        tint = Color(0xFFEC4899),
                        modifier = Modifier.size(48.dp)
                    )
                }
            }

            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFFCE7F3))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                            .clip(RoundedCornerShape(4.dp))
                    ) {
                        Text("NEWS", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEC4899))
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFF1F5F9))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                            .clip(RoundedCornerShape(4.dp))
                    ) {
                        Text(category.uppercase(), fontSize = 9.sp, fontWeight = FontWeight.Bold, color = SubtitleTextColor)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    title,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = ContentTextColor,
                    lineHeight = 22.sp
                )

                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    summary,
                    fontSize = 13.sp,
                    color = SubtitleTextColor,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Person, contentDescription = "Author", tint = SubtitleTextColor, modifier = Modifier.size(13.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Published by $adminName", fontSize = 11.sp, color = SubtitleTextColor)
                }

                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Color(0xFFF1F5F9))
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val isLiked = remember { mutableStateOf(EventHubApi.isLiked(context, newsId)) }
                    val likesCount = remember { mutableStateOf(news.optInt("likes", 0)) }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(
                            onClick = {
                                val token = EventHubApi.getSessionToken(context) ?: return@IconButton
                                scope.launch {
                                    val likedNow = EventHubApi.toggleLike(context, newsId)
                                    isLiked.value = likedNow
                                    try {
                                        val res = EventHubApi.toggleNewsLike(token, newsId)
                                        likesCount.value = res.getInt("likes")
                                    } catch (e: Exception) {
                                        likesCount.value = likesCount.value + if (likedNow) 1 else -1
                                    }
                                }
                            },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = if (isLiked.value) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                contentDescription = "Like",
                                tint = if (isLiked.value) Color(0xFFEC4899) else Color(0xFF64748B),
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Text("${likesCount.value}", fontSize = 11.sp, color = SubtitleTextColor)

                        Spacer(modifier = Modifier.width(16.dp))

                        IconButton(
                            onClick = onClick,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Comment,
                                contentDescription = "Comments",
                                tint = SubtitleTextColor,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Text("$commentsCount", fontSize = 11.sp, color = SubtitleTextColor)
                    }

                    Row {
                        IconButton(
                            onClick = {
                                val token = EventHubApi.getSessionToken(context) ?: return@IconButton
                                scope.launch {
                                    try {
                                        EventHubApi.trackPostAction(token, newsId, "download", "news")
                                    } catch (e: Exception) {}
                                    val detailsStr = "Title: $title\nCategory: $category\nSummary: $summary\nContent: $content\nPublished by: $adminName"
                                    EventHubApi.downloadPostLocally(context, title, detailsStr, imgUrl)
                                    android.widget.Toast.makeText(context, "Details downloaded!", android.widget.Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ArrowDownward,
                                contentDescription = "Download",
                                tint = SubtitleTextColor,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        IconButton(
                            onClick = {
                                val token = EventHubApi.getSessionToken(context) ?: return@IconButton
                                scope.launch {
                                    try {
                                        EventHubApi.trackPostAction(token, newsId, "share", "news")
                                    } catch (e: Exception) {}
                                    val shareIntent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
                                        type = "text/plain"
                                        putExtra(android.content.Intent.EXTRA_SUBJECT, title)
                                        putExtra(android.content.Intent.EXTRA_TEXT, "Check out this news on EventHub: $title\nhttps://social-eetirp.vercel.app/news/$newsId")
                                    }
                                    context.startActivity(android.content.Intent.createChooser(shareIntent, "Share via"))
                                }
                            },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Share,
                                contentDescription = "Share",
                                tint = SubtitleTextColor,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        IconButton(
                            onClick = {
                                val token = EventHubApi.getSessionToken(context) ?: return@IconButton
                                scope.launch {
                                    try {
                                        val res = EventHubApi.toggleSavePost(token, newsId, "news")
                                        val updatedUser = res.getJSONObject("user")
                                        val savedEvs = updatedUser.optJSONArray("savedEvents")?.toString() ?: "[]"
                                        val savedNws = updatedUser.optJSONArray("savedNews")?.toString() ?: "[]"
                                        val curUser = EventHubApi.getSessionUser(context)
                                        EventHubApi.saveSession(
                                            context, token, curUser.id, curUser.name, curUser.email, curUser.phone, curUser.avatar, savedEvs, savedNws
                                        )
                                        android.widget.Toast.makeText(context, if (res.getBoolean("saved")) "Saved to bookmarks!" else "Removed from bookmarks!", android.widget.Toast.LENGTH_SHORT).show()
                                    } catch (e: Exception) {
                                        android.widget.Toast.makeText(context, "Error saving post.", android.widget.Toast.LENGTH_SHORT).show()
                                    }
                                }
                            },
                            modifier = Modifier.size(32.dp)
                        ) {
                            val curUser = EventHubApi.getSessionUser(context)
                            val isSaved = remember(curUser.savedNewsJson) {
                                try {
                                    val arr = JSONArray(curUser.savedNewsJson)
                                    var found = false
                                    for (i in 0 until arr.length()) {
                                        val item = arr.get(i)
                                        val idStr = if (item is JSONObject) item.optString("_id", "") else item.toString()
                                        if (idStr == newsId) found = true
                                    }
                                    found
                                } catch (e: Exception) {
                                    false
                                }
                            }
                            Icon(
                                imageVector = if (isSaved) Icons.Default.Bookmark else Icons.Outlined.BookmarkBorder,
                                contentDescription = "Save",
                                tint = if (isSaved) Color(0xFFF59E0B) else Color(0xFF64748B),
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AlertsTab() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val token = remember { EventHubApi.getSessionToken(context) ?: "" }
    var notifications by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf("") }

    val fetchNotifications = {
        scope.launch {
            try {
                val array = EventHubApi.getNotifications(token)
                val list = mutableListOf<JSONObject>()
                for (i in 0 until array.length()) {
                    list.add(array.getJSONObject(i))
                }
                notifications = list
            } catch (e: Exception) {
                errorMsg = e.message ?: "Failed to load notifications."
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        fetchNotifications()
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Activity Alerts", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
                Text("Updates on comments and likes", fontSize = 12.sp, color = SubtitleTextColor)
            }
            if (notifications.any { !it.optBoolean("read", false) }) {
                TextButton(
                    onClick = {
                        scope.launch {
                            try {
                                EventHubApi.markAllNotificationsRead(token)
                                fetchNotifications()
                            } catch (e: Exception) {
                                // Ignore
                            }
                        }
                    }
                ) {
                    Text("Clear All", color = Color(0xFF8B5CF6), fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (loading) {
            Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF8B5CF6))
            }
        } else if (errorMsg.isNotEmpty()) {
            Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                Text(errorMsg, color = Color(0xFFDC2626))
            }
        } else if (notifications.isEmpty()) {
            Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                Text("No recent alerts.", color = SubtitleTextColor)
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxWidth().weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(notifications) { notif ->
                    val isRead = notif.optBoolean("read", false)
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (!isRead) {
                                    scope.launch {
                                        try {
                                            EventHubApi.markNotificationRead(token, notif.getString("_id"))
                                            fetchNotifications()
                                        } catch (e: Exception) {
                                            // Ignore
                                        }
                                    }
                                }
                            },
                        colors = CardDefaults.cardColors(
                            containerColor = if (isRead) Color.White else Color(0xFFF5F3FF)
                        ),
                        border = BorderStroke(1.dp, if (isRead) CardBorderColor else Color(0xFFDDD6FE)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(if (isRead) Color.Transparent else Color(0xFF8B5CF6))
                             )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                notif.getString("message"),
                                fontSize = 13.sp,
                                color = if (isRead) Color(0xFF475569) else Color(0xFF1E293B),
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileTab(
    onNavigateToEventDetail: (String) -> Unit,
    onNavigateToNewsDetail: (String) -> Unit,
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val token = remember { EventHubApi.getSessionToken(context) ?: "" }
    var user by remember { mutableStateOf(EventHubApi.getSessionUser(context)) }

    var nameInput by remember(user) { mutableStateOf(user.name) }
    var phoneInput by remember(user) { mutableStateOf(user.phone) }
    var avatarUrl by remember(user) { mutableStateOf(user.avatar) }
    var msg by remember { mutableStateOf("") }
    var msgType by remember { mutableStateOf("success") }
    var loading by remember { mutableStateOf(false) }

    var activeSubTab by remember { mutableStateOf("saved") } // "saved" or "details"
    var savedTypeTab by remember { mutableStateOf("events") } // "events" or "news"

    var currentPass by remember { mutableStateOf("") }
    var newPass by remember { mutableStateOf("") }
    var confirmNewPass by remember { mutableStateOf("") }
    var showCurrentPass by remember { mutableStateOf(false) }
    var showNewPass by remember { mutableStateOf(false) }
    var showConfirmPass by remember { mutableStateOf(false) }
    var passwordMsg by remember { mutableStateOf("") }
    var passwordMsgType by remember { mutableStateOf("success") }
    var passwordLoading by remember { mutableStateOf(false) }

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: android.net.Uri? ->
        if (uri != null) {
            scope.launch {
                try {
                    loading = true
                    msg = ""
                    val base64 = uriToCompressedBase64(context, uri)
                    val cloudUrl = EventHubApi.uploadPhoto(token, base64)
                    avatarUrl = cloudUrl
                    
                    val res = EventHubApi.updateProfile(
                        token = token,
                        name = nameInput.trim(),
                        avatar = cloudUrl,
                        phone = if (user.phone.isEmpty()) phoneInput.trim() else user.phone
                    )
                    val userObj = res.getJSONObject("user")
                    val savedName = userObj.getString("name")
                    val savedPhone = userObj.optString("phone", "")
                    val savedAvatar = userObj.optString("avatar", "")
                    val savedEvs = userObj.optJSONArray("savedEvents")?.toString() ?: "[]"
                    val savedNws = userObj.optJSONArray("savedNews")?.toString() ?: "[]"

                    EventHubApi.saveSession(
                        context,
                        token,
                        userObj.getString("id"),
                        savedName,
                        user.email,
                        savedPhone,
                        savedAvatar,
                        savedEvs,
                        savedNws
                    )
                    user = EventHubApi.getSessionUser(context)
                    msg = "Photo uploaded and profile updated! ✓"
                    msgType = "success"
                } catch (e: Exception) {
                    msg = e.message ?: "Failed to upload custom photo."
                    msgType = "error"
                } finally {
                    loading = false
                }
            }
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        item {
            Box(
                modifier = Modifier
                    .size(84.dp)
                    .clickable { galleryLauncher.launch("image/*") },
                contentAlignment = Alignment.BottomEnd
            ) {
                if (user.avatar.isNotEmpty()) {
                    AsyncImage(
                        model = EventHubApi.formatImageUrl(user.avatar),
                        contentDescription = "Avatar",
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                            .background(PurpleGradient),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            if (user.name.isNotEmpty()) user.name[0].uppercaseChar().toString() else "U",
                            fontSize = 36.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                    }
                }
                Box(
                    modifier = Modifier
                        .size(24.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF8B5CF6))
                        .padding(4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CameraAlt,
                        contentDescription = "Edit photo",
                        tint = Color.White,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(user.name, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
            Text("Community Member", fontSize = 11.sp, color = SubtitleTextColor, fontWeight = FontWeight.SemiBold)
            Spacer(modifier = Modifier.height(16.dp))

            // Tab Selector Row
            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Button(
                    onClick = { activeSubTab = "saved" },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (activeSubTab == "saved") Color(0xFF8B5CF6) else Color(0xFFEEF2F6),
                        contentColor = if (activeSubTab == "saved") Color.White else Color(0xFF475569)
                    ),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 4.dp)
                ) {
                    Text("Saved Items", fontWeight = FontWeight.Bold, fontSize = 11.sp)
                }
                Button(
                    onClick = { activeSubTab = "details" },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (activeSubTab == "details") Color(0xFF8B5CF6) else Color(0xFFEEF2F6),
                        contentColor = if (activeSubTab == "details") Color.White else Color(0xFF475569)
                    ),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 4.dp)
                ) {
                    Text("Edit Details", fontWeight = FontWeight.Bold, fontSize = 11.sp)
                }
                Button(
                    onClick = { activeSubTab = "password" },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (activeSubTab == "password") Color(0xFF8B5CF6) else Color(0xFFEEF2F6),
                        contentColor = if (activeSubTab == "password") Color.White else Color(0xFF475569)
                    ),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 4.dp)
                ) {
                    Text("Security", fontWeight = FontWeight.Bold, fontSize = 11.sp)
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        if (activeSubTab == "details") {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = CardBgColor),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp).fillMaxWidth()) {
                        Text("Edit Profile Details", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
                        Spacer(modifier = Modifier.height(16.dp))

                        if (msg.isNotEmpty()) {
                            Text(
                                msg,
                                color = if (msgType == "success") Color(0xFF065F46) else Color(0xFFDC2626),
                                fontSize = 12.sp,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(if (msgType == "success") Color(0xFFD1FAE5) else Color(0xFFFEF2F2))
                                    .padding(10.dp)
                                    .clip(RoundedCornerShape(8.dp))
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                        }

                        OutlinedTextField(
                            value = nameInput,
                            onValueChange = { nameInput = it },
                            label = { Text("Display Name") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = user.email,
                            onValueChange = {},
                            label = { Text("Email Address (Locked)") },
                            enabled = false,
                            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = "Locked", tint = Color.Gray) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = phoneInput,
                            onValueChange = { if (user.phone.isEmpty()) phoneInput = it },
                            label = { Text(if (user.phone.isNotEmpty()) "Phone Number (Locked)" else "Phone Number") },
                            enabled = user.phone.isEmpty(),
                            leadingIcon = if (user.phone.isNotEmpty()) {
                                { Icon(Icons.Default.Lock, contentDescription = "Locked", tint = Color.Gray) }
                            } else null,
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = {
                                if (nameInput.isBlank()) {
                                    msg = "Name is required."
                                    msgType = "error"
                                    return@Button
                                }
                                scope.launch {
                                    loading = true
                                    msg = ""
                                    try {
                                        val res = EventHubApi.updateProfile(
                                            token = token,
                                            name = nameInput.trim(),
                                            avatar = avatarUrl,
                                            phone = if (user.phone.isEmpty()) phoneInput.trim() else user.phone
                                        )
                                        val userObj = res.getJSONObject("user")
                                        val savedName = userObj.getString("name")
                                        val savedPhone = userObj.getString("phone")
                                        val savedAvatar = userObj.getString("avatar")
                                        val savedEvs = userObj.optJSONArray("savedEvents")?.toString() ?: "[]"
                                        val savedNws = userObj.optJSONArray("savedNews")?.toString() ?: "[]"

                                        val id = userObj.getString("id")
                                        EventHubApi.saveSession(
                                            context,
                                            token,
                                            id,
                                            savedName,
                                            user.email,
                                            savedPhone,
                                            savedAvatar,
                                            savedEvs,
                                            savedNws
                                        )
                                        user = EventHubApi.getSessionUser(context)
                                        msg = "Profile updated successfully! 🎉"
                                        msgType = "success"
                                    } catch (e: Exception) {
                                        msg = e.message ?: "Failed to update profile."
                                        msgType = "error"
                                    } finally {
                                        loading = false
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                            enabled = !loading
                        ) {
                            if (loading) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                            } else {
                                Text("Save Changes")
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(16.dp)) }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = CardBgColor),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, CardBorderColor)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Dark Theme Mode", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
                            Text("Adjust system visual theme style", fontSize = 11.sp, color = SubtitleTextColor)
                        }
                        Switch(
                            checked = ThemeState.isDarkTheme,
                            onCheckedChange = { isChecked ->
                                ThemeState.isDarkTheme = isChecked
                                EventHubApi.setDarkTheme(context, isChecked)
                            }
                        )
                    }
                }
            }
        }

        if (activeSubTab == "password") {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = CardBgColor),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, CardBorderColor)
                ) {
                    Column(modifier = Modifier.padding(20.dp).fillMaxWidth()) {
                        Text("Change Password", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
                        Text("Update your account credentials securely", fontSize = 11.sp, color = SubtitleTextColor)
                        Spacer(modifier = Modifier.height(16.dp))

                        if (passwordMsg.isNotEmpty()) {
                            Text(
                                passwordMsg,
                                color = if (passwordMsgType == "success") Color(0xFF065F46) else Color(0xFFDC2626),
                                fontSize = 12.sp,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(if (passwordMsgType == "success") Color(0xFFD1FAE5) else Color(0xFFFEF2F2))
                                    .padding(10.dp)
                                    .clip(RoundedCornerShape(8.dp))
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                        }

                        OutlinedTextField(
                            value = currentPass,
                            onValueChange = { currentPass = it },
                            label = { Text("Current Password") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            visualTransformation = if (showCurrentPass) androidx.compose.ui.text.input.VisualTransformation.None else PasswordVisualTransformation(),
                            trailingIcon = {
                                IconButton(onClick = { showCurrentPass = !showCurrentPass }) {
                                    Icon(
                                        imageVector = if (showCurrentPass) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                        contentDescription = "Toggle Visibility",
                                        tint = SubtitleTextColor
                                    )
                                }
                            }
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = newPass,
                            onValueChange = { newPass = it },
                            label = { Text("New Password") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            visualTransformation = if (showNewPass) androidx.compose.ui.text.input.VisualTransformation.None else PasswordVisualTransformation(),
                            trailingIcon = {
                                IconButton(onClick = { showNewPass = !showNewPass }) {
                                    Icon(
                                        imageVector = if (showNewPass) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                        contentDescription = "Toggle Visibility",
                                        tint = SubtitleTextColor
                                    )
                                }
                            }
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = confirmNewPass,
                            onValueChange = { confirmNewPass = it },
                            label = { Text("Retype New Password") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            visualTransformation = if (showConfirmPass) androidx.compose.ui.text.input.VisualTransformation.None else PasswordVisualTransformation(),
                            trailingIcon = {
                                IconButton(onClick = { showConfirmPass = !showConfirmPass }) {
                                    Icon(
                                        imageVector = if (showConfirmPass) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                        contentDescription = "Toggle Visibility",
                                        tint = SubtitleTextColor
                                    )
                                }
                            }
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = {
                                if (currentPass.isEmpty() || newPass.isEmpty()) {
                                    passwordMsg = "All fields are required."
                                    passwordMsgType = "error"
                                    return@Button
                                }
                                if (newPass.length < 6) {
                                    passwordMsg = "New password must be at least 6 characters long."
                                    passwordMsgType = "error"
                                    return@Button
                                }
                                if (newPass != confirmNewPass) {
                                    passwordMsg = "Passwords do not match."
                                    passwordMsgType = "error"
                                    return@Button
                                }

                                scope.launch {
                                    passwordLoading = true
                                    passwordMsg = ""
                                    try {
                                        EventHubApi.changePassword(token, currentPass, newPass)
                                        passwordMsg = "Password changed successfully! 🎉"
                                        passwordMsgType = "success"
                                        currentPass = ""
                                        newPass = ""
                                        confirmNewPass = ""
                                    } catch (e: Exception) {
                                        passwordMsg = e.message ?: "Failed to update password."
                                        passwordMsgType = "error"
                                    } finally {
                                        passwordLoading = false
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                            enabled = !passwordLoading
                        ) {
                            if (passwordLoading) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                            } else {
                                Text("Update Password")
                            }
                        }
                    }
                }
            }
        }

        if (activeSubTab == "saved") {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val isEvents = savedTypeTab == "events"
                    val isNews = savedTypeTab == "news"
                    Button(
                        onClick = { savedTypeTab = "events" },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isEvents) Color(0xFF8B5CF6).copy(alpha = 0.15f) else Color.Transparent,
                            contentColor = if (isEvents) Color(0xFF8B5CF6) else Color(0xFF64748B)
                        ),
                        border = BorderStroke(1.dp, if (isEvents) Color(0xFF8B5CF6) else Color(0xFFCBD5E1)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Events", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                    Button(
                        onClick = { savedTypeTab = "news" },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isNews) Color(0xFFEC4899).copy(alpha = 0.15f) else Color.Transparent,
                            contentColor = if (isNews) Color(0xFFEC4899) else Color(0xFF64748B)
                        ),
                        border = BorderStroke(1.dp, if (isNews) Color(0xFFEC4899) else Color(0xFFCBD5E1)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("News", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }

            val savedEventsArray = try { JSONArray(user.savedEventsJson) } catch (e: Exception) { JSONArray() }
            val savedNewsArray = try { JSONArray(user.savedNewsJson) } catch (e: Exception) { JSONArray() }

            val savedList = if (savedTypeTab == "events") {
                val list = mutableListOf<JSONObject>()
                for (i in 0 until savedEventsArray.length()) {
                    list.add(savedEventsArray.getJSONObject(i))
                }
                list
            } else {
                val list = mutableListOf<JSONObject>()
                for (i in 0 until savedNewsArray.length()) {
                    list.add(savedNewsArray.getJSONObject(i))
                }
                list
            }

            if (savedList.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 48.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No saved ${savedTypeTab} yet.", color = SubtitleTextColor, fontSize = 14.sp)
                    }
                }
            } else {
                items(savedList) { itemObj ->
                    val itemId = itemObj.optString("_id", "")
                    val itemTitle = itemObj.optString("title", "No Title")
                    val itemCategory = itemObj.optString("category", "General")
                    val itemImageUrl = itemObj.optString("image", "")

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp)
                            .clickable {
                                if (savedTypeTab == "events") {
                                    onNavigateToEventDetail(itemId)
                                } else {
                                    onNavigateToNewsDetail(itemId)
                                }
                            },
                        colors = CardDefaults.cardColors(containerColor = CardBgColor),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, CardBorderColor)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp).fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            if (itemImageUrl.isNotEmpty()) {
                                AsyncImage(
                                    model = EventHubApi.formatImageUrl(itemImageUrl),
                                    contentDescription = "Cover Image",
                                    modifier = Modifier
                                        .size(52.dp)
                                        .clip(RoundedCornerShape(8.dp)),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(52.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFF8B5CF6).copy(alpha = 0.1f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = if (savedTypeTab == "events") Icons.Default.DateRange else Icons.Default.Info,
                                        contentDescription = "Cover Placeholder",
                                        tint = Color(0xFF8B5CF6),
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    itemTitle,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ContentTextColor,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    itemCategory,
                                    fontSize = 11.sp,
                                    color = if (savedTypeTab == "events") Color(0xFF8B5CF6) else Color(0xFFEC4899),
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                            IconButton(
                                onClick = {
                                    scope.launch {
                                        try {
                                            val res = EventHubApi.toggleSavePost(token, itemId, if (savedTypeTab == "events") "event" else "news")
                                            val updatedUser = res.getJSONObject("user")
                                            val savedEvs = updatedUser.optJSONArray("savedEvents")?.toString() ?: "[]"
                                            val savedNws = updatedUser.optJSONArray("savedNews")?.toString() ?: "[]"
                                            EventHubApi.saveSession(
                                                context, token, user.id, user.name, user.email, user.phone, user.avatar, savedEvs, savedNws
                                            )
                                            user = EventHubApi.getSessionUser(context)
                                        } catch (e: Exception) {
                                            e.printStackTrace()
                                        }
                                    }
                                }
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Bookmark,
                                    contentDescription = "Unsave",
                                    tint = Color(0xFFF59E0B)
                                )
                            }
                        }
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(24.dp))
            OutlinedButton(
                onClick = {
                    EventHubApi.clearSession(context)
                    onLogout()
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFDC2626)),
                border = BorderStroke(1.dp, Color(0xFFFCA5A5))
            ) {
                Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Log Out")
                Spacer(modifier = Modifier.width(8.dp))
                Text("Log Out", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventDetailScreen(
    eventId: String,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val token = remember { EventHubApi.getSessionToken(context) ?: "" }
    var event by remember { mutableStateOf<JSONObject?>(null) }
    var comments by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var commentInput by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf("") }

    val loadDetails = {
        scope.launch {
            try {
                // Fetch events to find this specific one
                val array = EventHubApi.getEvents()
                var match: JSONObject? = null
                for (i in 0 until array.length()) {
                    val current = array.getJSONObject(i)
                    if (current.getString("_id") == eventId) {
                        match = current
                        break
                    }
                }
                event = match

                // Fetch comments
                val commentsArray = EventHubApi.getComments(eventId)
                val commentsList = mutableListOf<JSONObject>()
                for (i in 0 until commentsArray.length()) {
                    commentsList.add(commentsArray.getJSONObject(i))
                }
                comments = commentsList
            } catch (e: Exception) {
                errorMsg = e.message ?: "Failed to load event details."
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadDetails()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Event Details", fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CardBgColor)
            )
        }
    ) { innerPadding ->
        if (loading) {
            Box(modifier = Modifier.fillMaxSize().padding(innerPadding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF8B5CF6))
            }
        } else if (errorMsg.isNotEmpty() || event == null) {
            Box(modifier = Modifier.fillMaxSize().padding(innerPadding).padding(16.dp), contentAlignment = Alignment.Center) {
                Text(errorMsg.ifEmpty { "Event not found." }, color = Color(0xFFDC2626), textAlign = TextAlign.Center)
            }
        } else {
            val ev = event!!
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(BackgroundColor),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    // Title Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = CardBgColor),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            val imgUrl = ev.optString("image", "")
                            if (imgUrl.isNotEmpty()) {
                                AsyncImage(
                                    model = EventHubApi.formatImageUrl(imgUrl),
                                    contentDescription = "Event Cover",
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(140.dp)
                                        .clip(RoundedCornerShape(8.dp)),
                                    contentScale = ContentScale.Crop
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                            }
                            Text(ev.getString("title"), fontSize = 20.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
                            Text(ev.getString("category"), fontSize = 12.sp, color = Color(0xFF8B5CF6), fontWeight = FontWeight.Bold)

                            Spacer(modifier = Modifier.height(16.dp))

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.DateRange, contentDescription = "Date", tint = SubtitleTextColor, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("${ev.getString("date")}${if (ev.has("time")) " at ${ev.getString("time")}" else ""}", fontSize = 13.sp, color = ContentTextColor)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Place, contentDescription = "Location", tint = SubtitleTextColor, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(ev.optString("location", "Virtual"), fontSize = 13.sp, color = ContentTextColor)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.AccountBox, contentDescription = "Author", tint = SubtitleTextColor, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Posted by ${ev.getString("adminName")}", fontSize = 13.sp, color = ContentTextColor)
                            }
                        }
                    }
                }

                item {
                    // Description Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = CardBgColor),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Description", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(ev.getString("description"), fontSize = 13.sp, color = SubtitleTextColor, lineHeight = 20.sp)

                            Spacer(modifier = Modifier.height(16.dp))

                            val isLiked = EventHubApi.isLiked(context, eventId)
                            val title = ev.getString("title")
                            val category = ev.getString("category")
                            val description = ev.getString("description")
                            val adminName = ev.getString("adminName")
                            val imgUrl = ev.optString("image", "")
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = {
                                        scope.launch {
                                            try {
                                                EventHubApi.toggleLike(context, eventId)
                                                EventHubApi.toggleEventLike(token, eventId)
                                                loadDetails()
                                            } catch (e: Exception) {
                                                // Ignore
                                            }
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (isLiked) Color(0xFFFCE7F3) else Color(0xFFF1F5F9),
                                        contentColor = if (isLiked) Color(0xFFEC4899) else Color(0xFF64748B)
                                    ),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        imageVector = if (isLiked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                        contentDescription = "Like"
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("${ev.optInt("likes", 0)}")
                                }

                                Button(
                                    onClick = {
                                        scope.launch {
                                            try {
                                                EventHubApi.trackPostAction(token, eventId, "download", "event")
                                            } catch (e: Exception) {}
                                            val detailsStr = "Title: $title\nCategory: $category\nDescription: $description\nPosted by: $adminName"
                                            EventHubApi.downloadPostLocally(context, title, detailsStr, imgUrl)
                                            android.widget.Toast.makeText(context, "Details downloaded!", android.widget.Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFFEEF2F6),
                                        contentColor = SubtitleTextColor
                                    ),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(Icons.Default.ArrowDownward, contentDescription = "Download")
                                }

                                Button(
                                    onClick = {
                                        scope.launch {
                                            try {
                                                EventHubApi.trackPostAction(token, eventId, "share", "event")
                                            } catch (e: Exception) {}
                                            val shareIntent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
                                                type = "text/plain"
                                                putExtra(android.content.Intent.EXTRA_SUBJECT, title)
                                                putExtra(android.content.Intent.EXTRA_TEXT, "Check out this event on EventHub: $title\nhttps://social-eetirp.vercel.app/events/$eventId")
                                            }
                                            context.startActivity(android.content.Intent.createChooser(shareIntent, "Share via"))
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFFEEF2F6),
                                        contentColor = SubtitleTextColor
                                    ),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(Icons.Default.Share, contentDescription = "Share")
                                }

                                Button(
                                    onClick = {
                                        scope.launch {
                                            try {
                                                val res = EventHubApi.toggleSavePost(token, eventId, "event")
                                                val updatedUser = res.getJSONObject("user")
                                                val savedEvs = updatedUser.optJSONArray("savedEvents")?.toString() ?: "[]"
                                                val savedNws = updatedUser.optJSONArray("savedNews")?.toString() ?: "[]"
                                                val curUser = EventHubApi.getSessionUser(context)
                                                EventHubApi.saveSession(
                                                    context, token, curUser.id, curUser.name, curUser.email, curUser.phone, curUser.avatar, savedEvs, savedNws
                                                )
                                                val saved = res.getBoolean("saved")
                                                android.widget.Toast.makeText(context, if (saved) "Saved to bookmarks!" else "Removed from bookmarks!", android.widget.Toast.LENGTH_SHORT).show()
                                            } catch (e: Exception) {
                                                android.widget.Toast.makeText(context, "Error saving post.", android.widget.Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFFEEF2F6),
                                        contentColor = SubtitleTextColor
                                    ),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    val curUser = EventHubApi.getSessionUser(context)
                                    val isSaved = remember(curUser.savedEventsJson) {
                                        try {
                                            val arr = JSONArray(curUser.savedEventsJson)
                                            var found = false
                                            for (i in 0 until arr.length()) {
                                                val item = arr.get(i)
                                                val idStr = if (item is JSONObject) item.optString("_id", "") else item.toString()
                                                if (idStr == eventId) found = true
                                            }
                                            found
                                        } catch (e: Exception) {
                                            false
                                        }
                                    }
                                    Icon(
                                        imageVector = if (isSaved) Icons.Default.Bookmark else Icons.Outlined.BookmarkBorder,
                                        contentDescription = "Save",
                                        tint = if (isSaved) Color(0xFFF59E0B) else Color(0xFF475569)
                                    )
                                }
                            }
                        }
                    }
                }

                item {
                    Text("Comments (${comments.size})", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
                }

                // Add Comment Box
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = commentInput,
                            onValueChange = { commentInput = it },
                            placeholder = { Text("Write a comment...", fontSize = 12.sp) },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF8B5CF6))
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                if (commentInput.isBlank()) return@Button
                                val text = commentInput.trim()
                                commentInput = ""
                                scope.launch {
                                    try {
                                        EventHubApi.postComment(token, eventId, text, "event")
                                        loadDetails()
                                    } catch (e: Exception) {
                                        // Ignore
                                    }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Post")
                        }
                    }
                }

                if (comments.isEmpty()) {
                    item {
                        Text("No comments yet. Start the conversation!", modifier = Modifier.fillMaxWidth().padding(24.dp), textAlign = TextAlign.Center, color = SubtitleTextColor, fontSize = 12.sp)
                    }
                } else {
                    items(comments) { c ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = CardBgColor),
                            border = BorderStroke(1.dp, CardBorderColor)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(c.getString("authorName"), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
                                    Text(
                                        "Just now", // Fallback for simple date rendering
                                        fontSize = 10.sp,
                                        color = SubtitleTextColor
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(c.getString("content"), fontSize = 12.sp, color = SubtitleTextColor)
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewsDetailScreen(
    newsId: String,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val token = remember { EventHubApi.getSessionToken(context) ?: "" }
    var news by remember { mutableStateOf<JSONObject?>(null) }
    var comments by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var commentInput by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf("") }

    val loadDetails = {
        scope.launch {
            try {
                // Fetch news list to find this specific one
                val array = EventHubApi.getNews()
                var match: JSONObject? = null
                for (i in 0 until array.length()) {
                    val current = array.getJSONObject(i)
                    if (current.getString("_id") == newsId) {
                        match = current
                        break
                    }
                }
                news = match

                // Fetch comments
                val commentsArray = EventHubApi.getComments(newsId)
                val commentsList = mutableListOf<JSONObject>()
                for (i in 0 until commentsArray.length()) {
                    commentsList.add(commentsArray.getJSONObject(i))
                }
                comments = commentsList
            } catch (e: Exception) {
                errorMsg = e.message ?: "Failed to load news details."
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadDetails()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("News Update", fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CardBgColor)
            )
        }
    ) { innerPadding ->
        if (loading) {
            Box(modifier = Modifier.fillMaxSize().padding(innerPadding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF8B5CF6))
            }
        } else if (errorMsg.isNotEmpty() || news == null) {
            Box(modifier = Modifier.fillMaxSize().padding(innerPadding).padding(16.dp), contentAlignment = Alignment.Center) {
                Text(errorMsg.ifEmpty { "Article not found." }, color = Color(0xFFDC2626), textAlign = TextAlign.Center)
            }
        } else {
            val ns = news!!
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(BackgroundColor),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    // Content Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = CardBgColor),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            val imgUrl = ns.optString("image", "")
                            if (imgUrl.isNotEmpty()) {
                                AsyncImage(
                                    model = EventHubApi.formatImageUrl(imgUrl),
                                    contentDescription = "News Cover",
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(140.dp)
                                        .clip(RoundedCornerShape(8.dp)),
                                    contentScale = ContentScale.Crop
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                            }
                            Text(ns.getString("title"), fontSize = 20.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
                            Text(ns.getString("category"), fontSize = 12.sp, color = Color(0xFFEC4899), fontWeight = FontWeight.Bold)

                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                ns.getString("content"),
                                fontSize = 14.sp,
                                color = ContentTextColor,
                                lineHeight = 22.sp
                            )

                            Spacer(modifier = Modifier.height(20.dp))

                            val isLiked = EventHubApi.isLiked(context, newsId)
                            val title = ns.getString("title")
                            val category = ns.getString("category")
                            val summary = ns.optString("summary", "Read details...")
                            val content = ns.optString("content", "")
                            val adminName = ns.optString("adminName", "Admin")
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = {
                                        scope.launch {
                                            try {
                                                EventHubApi.toggleLike(context, newsId)
                                                EventHubApi.toggleNewsLike(token, newsId)
                                                loadDetails()
                                            } catch (e: Exception) {
                                                // Ignore
                                            }
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (isLiked) Color(0xFFFCE7F3) else Color(0xFFF1F5F9),
                                        contentColor = if (isLiked) Color(0xFFEC4899) else Color(0xFF64748B)
                                    ),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        imageVector = if (isLiked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                        contentDescription = "Like"
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("${ns.optInt("likes", 0)}")
                                }

                                Button(
                                    onClick = {
                                        scope.launch {
                                            try {
                                                EventHubApi.trackPostAction(token, newsId, "download", "news")
                                            } catch (e: Exception) {}
                                            val detailsStr = "Title: $title\nCategory: $category\nSummary: $summary\nContent: $content\nPublished by: $adminName"
                                            EventHubApi.downloadPostLocally(context, title, detailsStr, imgUrl)
                                            android.widget.Toast.makeText(context, "Details downloaded!", android.widget.Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFFEEF2F6),
                                        contentColor = SubtitleTextColor
                                    ),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(Icons.Default.ArrowDownward, contentDescription = "Download")
                                }

                                Button(
                                    onClick = {
                                        scope.launch {
                                            try {
                                                EventHubApi.trackPostAction(token, newsId, "share", "news")
                                            } catch (e: Exception) {}
                                            val shareIntent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
                                                type = "text/plain"
                                                putExtra(android.content.Intent.EXTRA_SUBJECT, title)
                                                putExtra(android.content.Intent.EXTRA_TEXT, "Check out this news on EventHub: $title\nhttps://social-eetirp.vercel.app/news/$newsId")
                                            }
                                            context.startActivity(android.content.Intent.createChooser(shareIntent, "Share via"))
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFFEEF2F6),
                                        contentColor = SubtitleTextColor
                                    ),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(Icons.Default.Share, contentDescription = "Share")
                                }

                                Button(
                                    onClick = {
                                        scope.launch {
                                            try {
                                                val res = EventHubApi.toggleSavePost(token, newsId, "news")
                                                val updatedUser = res.getJSONObject("user")
                                                val savedEvs = updatedUser.optJSONArray("savedEvents")?.toString() ?: "[]"
                                                val savedNws = updatedUser.optJSONArray("savedNews")?.toString() ?: "[]"
                                                val curUser = EventHubApi.getSessionUser(context)
                                                EventHubApi.saveSession(
                                                    context, token, curUser.id, curUser.name, curUser.email, curUser.phone, curUser.avatar, savedEvs, savedNws
                                                )
                                                val saved = res.getBoolean("saved")
                                                android.widget.Toast.makeText(context, if (saved) "Saved to bookmarks!" else "Removed from bookmarks!", android.widget.Toast.LENGTH_SHORT).show()
                                            } catch (e: Exception) {
                                                android.widget.Toast.makeText(context, "Error saving post.", android.widget.Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFFEEF2F6),
                                        contentColor = SubtitleTextColor
                                    ),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    val curUser = EventHubApi.getSessionUser(context)
                                    val isSaved = remember(curUser.savedNewsJson) {
                                        try {
                                            val arr = JSONArray(curUser.savedNewsJson)
                                            var found = false
                                            for (i in 0 until arr.length()) {
                                                val item = arr.get(i)
                                                val idStr = if (item is JSONObject) item.optString("_id", "") else item.toString()
                                                if (idStr == newsId) found = true
                                            }
                                            found
                                        } catch (e: Exception) {
                                            false
                                        }
                                    }
                                    Icon(
                                        imageVector = if (isSaved) Icons.Default.Bookmark else Icons.Outlined.BookmarkBorder,
                                        contentDescription = "Save",
                                        tint = if (isSaved) Color(0xFFF59E0B) else Color(0xFF475569)
                                    )
                                }
                            }
                        }
                    }
                }

                item {
                    Text("Comments (${comments.size})", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
                }

                // Add Comment Box
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = commentInput,
                            onValueChange = { commentInput = it },
                            placeholder = { Text("Write a comment...", fontSize = 12.sp) },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF8B5CF6))
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                if (commentInput.isBlank()) return@Button
                                val text = commentInput.trim()
                                commentInput = ""
                                scope.launch {
                                    try {
                                        EventHubApi.postComment(token, newsId, text, "news")
                                        loadDetails()
                                    } catch (e: Exception) {
                                        // Ignore
                                    }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Post")
                        }
                    }
                }

                if (comments.isEmpty()) {
                    item {
                        Text("No comments yet. Start the conversation!", modifier = Modifier.fillMaxWidth().padding(24.dp), textAlign = TextAlign.Center, color = SubtitleTextColor, fontSize = 12.sp)
                    }
                } else {
                    items(comments) { c ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = CardBgColor),
                            border = BorderStroke(1.dp, CardBorderColor)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(c.getString("authorName"), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ContentTextColor)
                                    Text("Just now", fontSize = 10.sp, color = SubtitleTextColor)
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(c.getString("content"), fontSize = 12.sp, color = SubtitleTextColor)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EventHubHeroHeader(
    title: String,
    subtitle: String,
    eventsCount: Int,
    newsCount: Int
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardBgColor),
        border = BorderStroke(1.dp, CardBorderColor)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF8B5CF6).copy(alpha = 0.05f),
                            Color.Transparent
                        )
                    )
                )
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .background(Color(0xFFF3E8FF))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
                    .clip(RoundedCornerShape(12.dp))
            ) {
                Text("LIVE COMMUNITY PLATFORM", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF8B5CF6))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                title,
                fontSize = 24.sp,
                fontWeight = FontWeight.Black,
                color = ContentTextColor,
                textAlign = TextAlign.Center,
                lineHeight = 30.sp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                subtitle,
                fontSize = 12.sp,
                color = SubtitleTextColor,
                textAlign = TextAlign.Center,
                lineHeight = 18.sp,
                modifier = Modifier.padding(horizontal = 12.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            HorizontalDivider(color = Color(0xFFF1F5F9))
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFF22C55E)))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Live Updates", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = SubtitleTextColor)
                }
                Text("•", color = Color(0xFFCBD5E1))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Person, contentDescription = "Admins", tint = Color(0xFF8B5CF6), modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("6 Admins", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = SubtitleTextColor)
                }
                Text("•", color = Color(0xFFCBD5E1))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.DateRange, contentDescription = "Stats", tint = Color(0xFFEC4899), modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(if (eventsCount > 0) "$eventsCount Events" else "$newsCount Articles", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = SubtitleTextColor)
                }
            }
        }
    }
}

@Composable
fun CategoryChip(
    text: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        color = if (selected) Color(0xFF8B5CF6) else Color(0xFFEEF2F6),
        contentColor = if (selected) Color.White else Color(0xFF475569),
        shape = RoundedCornerShape(20.dp),
        modifier = Modifier.clickable { onClick() }
    ) {
        Text(
            text = text,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
        )
    }
}

fun uriToCompressedBase64(context: Context, uri: android.net.Uri): String {
    val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
    val options = android.graphics.BitmapFactory.Options().apply {
        inJustDecodeBounds = true
    }
    android.graphics.BitmapFactory.decodeStream(inputStream, null, options)
    inputStream?.close()

    var scale = 1
    val maxDimension = 1024
    if (options.outWidth > maxDimension || options.outHeight > maxDimension) {
        val maxVal = Math.max(options.outWidth, options.outHeight).toDouble()
        scale = Math.pow(2.0, Math.ceil(Math.log(maxVal / maxDimension.toDouble()) / Math.log(2.0))).toInt()
    }

    val compressOptions = android.graphics.BitmapFactory.Options().apply {
        inSampleSize = scale
    }
    
    val inputStream2 = context.contentResolver.openInputStream(uri)
    val bitmap = android.graphics.BitmapFactory.decodeStream(inputStream2, null, compressOptions)
    inputStream2?.close()

    if (bitmap == null) return ""

    val outputStream = java.io.ByteArrayOutputStream()
    bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 80, outputStream)
    val bytes = outputStream.toByteArray()
    bitmap.recycle()
    
    return Base64.encodeToString(bytes, Base64.NO_WRAP)
}

