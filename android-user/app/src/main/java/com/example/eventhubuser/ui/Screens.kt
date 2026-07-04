package com.example.eventhubuser.ui

import android.content.Context
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
import com.example.eventhubuser.data.EventHubApi
import com.example.eventhubuser.data.UserProfile
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

// Common Theme Gradients & Colors
val PurpleGradient = Brush.linearGradient(listOf(Color(0xFF8B5CF6), Color(0xFFEC4899)))
val BackgroundColor = Color(0xFFF8FAFC)
val CardBorderColor = Color(0xFFE2E8F0)

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
            Text("EventHub", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
            Text("Community Portal", fontSize = 14.sp, color = Color(0xFF64748B))

            Spacer(modifier = Modifier.height(32.dp))

            // Card Form
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp).fillMaxWidth()) {
                    Text("Sign In", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
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
                                        EventHubApi.saveSession(context, token, name, email, phone, avatar)
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
            Text("Create Account", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
            Text("Join the EventHub community", fontSize = 14.sp, color = Color(0xFF64748B))

            Spacer(modifier = Modifier.height(28.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp).fillMaxWidth()) {
                    Text("Register", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
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

                                    EventHubApi.saveSession(context, token, savedName, email.trim(), phone, avatar)
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
            Text("Complete Profile", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
            Text("Add details so other members can reach you", fontSize = 12.sp, color = Color(0xFF64748B))

            Spacer(modifier = Modifier.height(24.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
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

                    // Preset Avatars Selector
                    Text("Select a Profile Photo", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF64748B))
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        presetAvatars.forEach { url ->
                            Box(
                                modifier = Modifier
                                    .size(54.dp)
                                    .clip(CircleShape)
                                    .background(if (avatarUrl == url) Color(0xFF8B5CF6) else Color.Transparent)
                                    .padding(if (avatarUrl == url) 3.dp else 0.dp)
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

                                    EventHubApi.saveSession(
                                        context,
                                        token,
                                        savedName,
                                        user.email,
                                        savedPhone,
                                        savedAvatar
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
                Text("Skip for now", color = Color(0xFF64748B))
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

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.DateRange, contentDescription = "Events") },
                    label = { Text("Events") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.List, contentDescription = "News") },
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
                3 -> ProfileTab(onLogout)
            }
        }
    }
}

@Composable
fun EventsTab(onNavigateToEventDetail: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var events by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val array = EventHubApi.getEvents()
                val list = mutableListOf<JSONObject>()
                for (i in 0 until array.length()) {
                    list.add(array.getJSONObject(i))
                }
                events = list
            } catch (e: Exception) {
                errorMsg = e.message ?: "Failed to load events."
            } finally {
                loading = false
            }
        }
    }

    if (loading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF8B5CF6))
        }
    } else if (errorMsg.isNotEmpty()) {
        Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
            Text(errorMsg, color = Color(0xFFDC2626), textAlign = TextAlign.Center)
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text("Upcoming Events", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                Spacer(modifier = Modifier.height(4.dp))
                Text("Join and participate in active events", fontSize = 12.sp, color = Color(0xFF64748B))
                Spacer(modifier = Modifier.height(12.dp))
            }

            if (events.isEmpty()) {
                item {
                    Text("No events posted yet.", modifier = Modifier.fillMaxWidth().padding(40.dp), textAlign = TextAlign.Center, color = Color(0xFF64748B))
                }
            } else {
                items(events) { ev ->
                    EventCard(ev, onClick = { onNavigateToEventDetail(ev.getString("_id")) })
                }
            }
        }
    }
}

@Composable
fun EventCard(event: JSONObject, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                val imgUrl = event.optString("image", "")
                if (imgUrl.isNotEmpty()) {
                    AsyncImage(
                        model = imgUrl,
                        contentDescription = "Event Cover",
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(8.dp)),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFFF3E8FF)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.DateRange, contentDescription = "Event", tint = Color(0xFF8B5CF6))
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        event.getString("title"),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1E293B)
                    )
                    Text(
                        event.getString("category"),
                        fontSize = 11.sp,
                        color = Color(0xFF8B5CF6),
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Text(
                event.getString("description"),
                fontSize = 13.sp,
                color = Color(0xFF475569),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Place, contentDescription = "Location", tint = Color(0xFF64748B), modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(event.optString("location", "Virtual"), fontSize = 11.sp, color = Color(0xFF64748B))
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Favorite, contentDescription = "Likes", tint = Color(0xFFEC4899), modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("${event.optInt("likes", 0)} Likes", fontSize = 11.sp, color = Color(0xFF64748B))
                }
            }
        }
    }
}

@Composable
fun NewsTab(onNavigateToNewsDetail: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var newsList by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val array = EventHubApi.getNews()
                val list = mutableListOf<JSONObject>()
                for (i in 0 until array.length()) {
                    list.add(array.getJSONObject(i))
                }
                newsList = list
            } catch (e: Exception) {
                errorMsg = e.message ?: "Failed to load news."
            } finally {
                loading = false
            }
        }
    }

    if (loading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF8B5CF6))
        }
    } else if (errorMsg.isNotEmpty()) {
        Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
            Text(errorMsg, color = Color(0xFFDC2626), textAlign = TextAlign.Center)
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text("News Updates", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                Spacer(modifier = Modifier.height(4.dp))
                Text("Stay informed with updates from our admins", fontSize = 12.sp, color = Color(0xFF64748B))
                Spacer(modifier = Modifier.height(12.dp))
            }

            if (newsList.isEmpty()) {
                item {
                    Text("No news updates published yet.", modifier = Modifier.fillMaxWidth().padding(40.dp), textAlign = TextAlign.Center, color = Color(0xFF64748B))
                }
            } else {
                items(newsList) { ns ->
                    NewsCard(ns, onClick = { onNavigateToNewsDetail(ns.getString("_id")) })
                }
            }
        }
    }
}

@Composable
fun NewsCard(news: JSONObject, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                val imgUrl = news.optString("image", "")
                if (imgUrl.isNotEmpty()) {
                    AsyncImage(
                        model = imgUrl,
                        contentDescription = "News Cover",
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(8.dp)),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFFFCE7F3)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Info, contentDescription = "News", tint = Color(0xFFEC4899))
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        news.getString("title"),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1E293B)
                    )
                    Text(
                        news.getString("category"),
                        fontSize = 11.sp,
                        color = Color(0xFFEC4899),
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Text(
                news.optString("summary", "Read detail update..."),
                fontSize = 13.sp,
                color = Color(0xFF475569),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Published by admin",
                    fontSize = 11.sp,
                    color = Color(0xFF64748B)
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Favorite, contentDescription = "Likes", tint = Color(0xFFEC4899), modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("${news.optInt("likes", 0)} Likes", fontSize = 11.sp, color = Color(0xFF64748B))
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
                Text("Activity Alerts", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                Text("Updates on comments and likes", fontSize = 12.sp, color = Color(0xFF64748B))
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
                Text("No recent alerts.", color = Color(0xFF64748B))
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxWidth().weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(notifications) { notif ->
                    val isRead = notif.optBoolean("read", false)
                    Card(
                        modifier = Modifier.fillMaxWidth(),
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
fun ProfileTab(onLogout: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val token = remember { EventHubApi.getSessionToken(context) ?: "" }
    var user by remember { mutableStateOf(EventHubApi.getSessionUser(context)) }

    var nameInput by remember { mutableStateOf(user.name) }
    var phoneInput by remember { mutableStateOf(user.phone) }
    var avatarUrl by remember { mutableStateOf(user.avatar) }
    var msg by remember { mutableStateOf("") }
    var msgType by remember { mutableStateOf("success") }
    var loading by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        item {
            // Profile Card Header
            if (user.avatar.isNotEmpty()) {
                AsyncImage(
                    model = user.avatar,
                    contentDescription = "Avatar",
                    modifier = Modifier
                        .size(84.dp)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(84.dp)
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
            Spacer(modifier = Modifier.height(12.dp))
            Text(user.name, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
            Text("Community Member", fontSize = 11.sp, color = Color(0xFF64748B), fontWeight = FontWeight.SemiBold)
            Spacer(modifier = Modifier.height(24.dp))
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp).fillMaxWidth()) {
                    Text("Edit Profile Details", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
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

                                    EventHubApi.saveSession(
                                        context,
                                        token,
                                        savedName,
                                        user.email,
                                        savedPhone,
                                        savedAvatar
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
                Icon(Icons.Default.ExitToApp, contentDescription = "Log Out")
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
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
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
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            val imgUrl = ev.optString("image", "")
                            if (imgUrl.isNotEmpty()) {
                                AsyncImage(
                                    model = imgUrl,
                                    contentDescription = "Event Cover",
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(140.dp)
                                        .clip(RoundedCornerShape(8.dp)),
                                    contentScale = ContentScale.Crop
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                            }
                            Text(ev.getString("title"), fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                            Text(ev.getString("category"), fontSize = 12.sp, color = Color(0xFF8B5CF6), fontWeight = FontWeight.Bold)

                            Spacer(modifier = Modifier.height(16.dp))

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.DateRange, contentDescription = "Date", tint = Color(0xFF64748B), modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("${ev.getString("date")}${if (ev.has("time")) " at ${ev.getString("time")}" else ""}", fontSize = 13.sp, color = Color(0xFF334155))
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Place, contentDescription = "Location", tint = Color(0xFF64748B), modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(ev.optString("location", "Virtual"), fontSize = 13.sp, color = Color(0xFF334155))
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.AccountBox, contentDescription = "Author", tint = Color(0xFF64748B), modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Posted by ${ev.getString("adminName")}", fontSize = 13.sp, color = Color(0xFF334155))
                            }
                        }
                    }
                }

                item {
                    // Description Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Description", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(ev.getString("description"), fontSize = 13.sp, color = Color(0xFF475569), lineHeight = 20.sp)

                            Spacer(modifier = Modifier.height(16.dp))

                            Button(
                                onClick = {
                                    scope.launch {
                                        try {
                                            EventHubApi.toggleEventLike(token, eventId)
                                            loadDetails()
                                        } catch (e: Exception) {
                                            // Ignore
                                        }
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFCE7F3), contentColor = Color(0xFFEC4899)),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.Favorite, contentDescription = "Like")
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("${ev.optInt("likes", 0)} Likes")
                            }
                        }
                    }
                }

                item {
                    Text("Comments (${comments.size})", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
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
                                        EventHubApi.postComment(token, eventId, text)
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
                        Text("No comments yet. Start the conversation!", modifier = Modifier.fillMaxWidth().padding(24.dp), textAlign = TextAlign.Center, color = Color(0xFF64748B), fontSize = 12.sp)
                    }
                } else {
                    items(comments) { c ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = BorderStroke(1.dp, CardBorderColor)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(c.getString("authorName"), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                                    Text(
                                        "Just now", // Fallback for simple date rendering
                                        fontSize = 10.sp,
                                        color = Color(0xFF64748B)
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(c.getString("content"), fontSize = 12.sp, color = Color(0xFF475569))
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
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
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
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            val imgUrl = ns.optString("image", "")
                            if (imgUrl.isNotEmpty()) {
                                AsyncImage(
                                    model = imgUrl,
                                    contentDescription = "News Cover",
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(140.dp)
                                        .clip(RoundedCornerShape(8.dp)),
                                    contentScale = ContentScale.Crop
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                            }
                            Text(ns.getString("title"), fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                            Text(ns.getString("category"), fontSize = 12.sp, color = Color(0xFFEC4899), fontWeight = FontWeight.Bold)

                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                ns.getString("content"),
                                fontSize = 14.sp,
                                color = Color(0xFF334155),
                                lineHeight = 22.sp
                            )

                            Spacer(modifier = Modifier.height(20.dp))

                            Button(
                                onClick = {
                                    scope.launch {
                                        try {
                                            EventHubApi.toggleNewsLike(token, newsId)
                                            loadDetails()
                                        } catch (e: Exception) {
                                            // Ignore
                                        }
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFCE7F3), contentColor = Color(0xFFEC4899)),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.Favorite, contentDescription = "Like")
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("${ns.optInt("likes", 0)} Likes")
                            }
                        }
                    }
                }

                item {
                    Text("Comments (${comments.size})", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
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
                                        EventHubApi.postComment(token, newsId, text)
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
                        Text("No comments yet. Start the conversation!", modifier = Modifier.fillMaxWidth().padding(24.dp), textAlign = TextAlign.Center, color = Color(0xFF64748B), fontSize = 12.sp)
                    }
                } else {
                    items(comments) { c ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = BorderStroke(1.dp, CardBorderColor)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(c.getString("authorName"), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                                    Text("Just now", fontSize = 10.sp, color = Color(0xFF64748B))
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(c.getString("content"), fontSize = 12.sp, color = Color(0xFF475569))
                            }
                        }
                    }
                }
            }
        }
    }
}
