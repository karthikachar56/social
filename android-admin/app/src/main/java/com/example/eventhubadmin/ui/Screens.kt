package com.example.eventhubadmin.ui

import android.content.Context
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.eventhubadmin.data.EventHubApi
import com.example.eventhubadmin.data.AdminProfile
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

val PurpleGradient = Brush.linearGradient(listOf(Color(0xFF6366F1), Color(0xFFA855F7)))
val BackgroundColor = Color(0xFFF8FAFC)
val CardBorderColor = Color(0xFFE2E8F0)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit
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
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(PurpleGradient),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Lock, contentDescription = "Logo", tint = Color.White, modifier = Modifier.size(36.dp))
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text("EventHub Admin", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
            Text("Secure Management Console", fontSize = 14.sp, color = Color(0xFF64748B))

            Spacer(modifier = Modifier.height(32.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp).fillMaxWidth()) {
                    Text("Admin Login", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
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
                        label = { Text("Admin Email") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF6366F1))
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF6366F1))
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
                                    val other = userObj.optString("otherDetails", "")

                                    if (role != "admin") {
                                        errorMsg = "Access denied. Login reserved for administrators."
                                    } else {
                                        EventHubApi.saveSession(context, token, name, email, phone, avatar, other)
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
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                        enabled = !loading
                    ) {
                        if (loading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                        } else {
                            Text("Log In", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onLogout: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.AddCircle, contentDescription = "Create") },
                    label = { Text("Create") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.List, contentDescription = "Posts") },
                    label = { Text("Posts") }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Users") },
                    label = { Text("Users") }
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.Send, contentDescription = "Chat") },
                    label = { Text("Chat") }
                )
                NavigationBarItem(
                    selected = selectedTab == 4,
                    onClick = { selectedTab = 4 },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Profile") },
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
                0 -> CreateTab()
                1 -> ManagePostsTab()
                2 -> ManageUsersTab()
                3 -> AdminChatTab()
                4 -> AdminProfileTab(onLogout)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateTab() {
    var activeFormType by remember { mutableStateOf(0) } // 0 = Event, 1 = News
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val token = remember { EventHubApi.getSessionToken(context) ?: "" }

    // Forms fields
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var date by remember { mutableStateOf("") }
    var time by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("General") }
    var image by remember { mutableStateOf("") }
    var tagsInput by remember { mutableStateOf("") }

    var msg by remember { mutableStateOf("") }
    var msgType by remember { mutableStateOf("success") }
    var loading by remember { mutableStateOf(false) }

    val presetAvatars = listOf(
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=120&h=120&q=80",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=120&h=120&q=80",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=120&h=120&q=80"
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Publish Content", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
            Text("Post announcement alerts directly to community portal", fontSize = 12.sp, color = Color(0xFF64748B))

            Spacer(modifier = Modifier.height(8.dp))

            TabRow(selectedTabIndex = activeFormType, containerColor = Color.Transparent) {
                Tab(selected = activeFormType == 0, onClick = { activeFormType = 0; msg = "" }, text = { Text("Event Post") })
                Tab(selected = activeFormType == 1, onClick = { activeFormType = 1; msg = "" }, text = { Text("News Update") })
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
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
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Title") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    if (activeFormType == 0) {
                        OutlinedTextField(
                            value = description,
                            onValueChange = { description = it },
                            label = { Text("Description") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 3
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedTextField(
                            value = date,
                            onValueChange = { date = it },
                            label = { Text("Date (e.g. Jul 12, 2026)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedTextField(
                            value = time,
                            onValueChange = { time = it },
                            label = { Text("Time (optional)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedTextField(
                            value = location,
                            onValueChange = { location = it },
                            label = { Text("Location (optional)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    } else {
                        OutlinedTextField(
                            value = description, // Reuse field as content
                            onValueChange = { description = it },
                            label = { Text("Content Body") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 4
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedTextField(
                            value = location, // Reuse field as summary
                            onValueChange = { location = it },
                            label = { Text("Short Summary (optional)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Preset Cover Image Selector
                    Text("Select Preset Cover Image", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        presetAvatars.forEach { url ->
                            Box(
                                modifier = Modifier
                                    .size(64.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (image == url) Color(0xFF6366F1) else Color.LightGray)
                                    .padding(if (image == url) 2.dp else 0.dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .clickable { image = url }
                            ) {
                                Box(
                                    modifier = Modifier.fillMaxSize().background(Color(0xFFE2E8F0)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("Image", fontSize = 10.sp, color = Color(0xFF475569))
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = category,
                        onValueChange = { category = it },
                        label = { Text("Category (e.g. Technology, General)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = tagsInput,
                        onValueChange = { tagsInput = it },
                        label = { Text("Tags (comma separated, e.g. tech, coding)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    Button(
                        onClick = {
                            if (title.isBlank() || description.isBlank() || (activeFormType == 0 && date.isBlank())) {
                                msg = "Title and Body/Description are required."
                                msgType = "error"
                                return@Button
                            }
                            val tagList = tagsInput.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                            scope.launch {
                                loading = true
                                msg = ""
                                try {
                                    if (activeFormType == 0) {
                                        EventHubApi.createEvent(
                                            token = token,
                                            title = title.trim(),
                                            description = description.trim(),
                                            date = date.trim(),
                                            time = time.trim().ifEmpty { null },
                                            location = location.trim().ifEmpty { null },
                                            category = category.trim(),
                                            image = image.ifEmpty { null },
                                            tags = tagList
                                        )
                                    } else {
                                        EventHubApi.createNews(
                                            token = token,
                                            title = title.trim(),
                                            content = description.trim(),
                                            summary = location.trim().ifEmpty { null },
                                            category = category.trim(),
                                            image = image.ifEmpty { null },
                                            tags = tagList
                                        )
                                    }
                                    msg = "Content published successfully! 🎉"
                                    msgType = "success"
                                    title = ""
                                    description = ""
                                    date = ""
                                    time = ""
                                    location = ""
                                    image = ""
                                    tagsInput = ""
                                } catch (e: Exception) {
                                    msg = e.message ?: "Publication failed."
                                    msgType = "error"
                                } finally {
                                    loading = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                        enabled = !loading
                    ) {
                        if (loading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                        } else {
                            Text("Publish Now", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ManagePostsTab() {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val token = remember { EventHubApi.getSessionToken(context) ?: "" }
    var events by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var newsList by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf("") }

    val fetchPosts = {
        scope.launch {
            try {
                val evArray = EventHubApi.getEvents()
                val evs = mutableListOf<JSONObject>()
                for (i in 0 until evArray.length()) {
                    evs.add(evArray.getJSONObject(i))
                }
                events = evs

                val nwArray = EventHubApi.getNews()
                val nws = mutableListOf<JSONObject>()
                for (i in 0 until nwArray.length()) {
                    nws.add(nwArray.getJSONObject(i))
                }
                newsList = nws
            } catch (e: Exception) {
                errorMsg = e.message ?: "Failed to load posts."
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        fetchPosts()
    }

    if (loading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF6366F1))
        }
    } else if (errorMsg.isNotEmpty()) {
        Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
            Text(errorMsg, color = Color(0xFFDC2626))
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text("Manage Content", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                Text("Delete posts and delete comments", fontSize = 12.sp, color = Color(0xFF64748B))
            }

            item {
                Text("Events (${events.size})", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
            }

            if (events.isEmpty()) {
                item {
                    Text("No events published yet.", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(8.dp))
                }
            } else {
                items(events) { ev ->
                    AdminPostCard(
                        title = ev.getString("title"),
                        category = ev.getString("category"),
                        type = "Event",
                        likes = ev.optInt("likes", 0),
                        onDelete = {
                            scope.launch {
                                try {
                                    EventHubApi.deleteEvent(token, ev.getString("_id"))
                                    fetchPosts()
                                } catch (e: Exception) {
                                    // Ignore
                                }
                            }
                        }
                    )
                }
            }

            item {
                Text("News Updates (${newsList.size})", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
            }

            if (newsList.isEmpty()) {
                item {
                    Text("No news updates published yet.", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(8.dp))
                }
            } else {
                items(newsList) { ns ->
                    AdminPostCard(
                        title = ns.getString("title"),
                        category = ns.getString("category"),
                        type = "News",
                        likes = ns.optInt("likes", 0),
                        onDelete = {
                            scope.launch {
                                try {
                                    EventHubApi.deleteNews(token, ns.getString("_id"))
                                    fetchPosts()
                                } catch (e: Exception) {
                                    // Ignore
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun AdminPostCard(
    title: String,
    category: String,
    type: String,
    likes: Int,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, CardBorderColor)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        type.uppercase(),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (type == "Event") Color(0xFF6366F1) else Color(0xFFEC4899),
                        modifier = Modifier
                            .background(if (type == "Event") Color(0xFFEEF2F6) else Color(0xFFFDF2F8))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                            .clip(RoundedCornerShape(4.dp))
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(category, fontSize = 11.sp, color = Color.Gray)
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text("$likes Likes", fontSize = 11.sp, color = Color.Gray)
            }
            Spacer(modifier = Modifier.width(12.dp))
            IconButton(
                onClick = onDelete,
                colors = IconButtonDefaults.iconButtonColors(contentColor = Color(0xFFDC2626))
            ) {
                Icon(Icons.Default.Delete, contentDescription = "Delete")
            }
        }
    }
}

@Composable
fun ManageUsersTab() {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val token = remember { EventHubApi.getSessionToken(context) ?: "" }
    var users by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf("") }

    val fetchUsers = {
        scope.launch {
            try {
                val array = EventHubApi.getUsers(token)
                val list = mutableListOf<JSONObject>()
                for (i in 0 until array.length()) {
                    list.add(array.getJSONObject(i))
                }
                users = list
            } catch (e: Exception) {
                errorMsg = e.message ?: "Failed to load users."
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        fetchUsers()
    }

    if (loading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Color(0xFF6366F1))
        }
    } else if (errorMsg.isNotEmpty()) {
        Box(modifier = Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
            Text(errorMsg, color = Color(0xFFDC2626))
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text("Registered Users", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                Text("Manage account status access", fontSize = 12.sp, color = Color(0xFF64748B))
                Spacer(modifier = Modifier.height(8.dp))
            }

            if (users.isEmpty()) {
                item {
                    Text("No users registered yet.", modifier = Modifier.fillMaxWidth().padding(40.dp), textAlign = TextAlign.Center, color = Color.Gray)
                }
            } else {
                items(users) { usr ->
                    val isBanned = usr.optBoolean("banned", false)
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = BorderStroke(1.dp, CardBorderColor)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(usr.getString("name"), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        if (isBanned) "Suspended" else "Active",
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isBanned) Color(0xFFDC2626) else Color(0xFF059669),
                                        modifier = Modifier
                                            .background(if (isBanned) Color(0xFFFEF2F2) else Color(0xFFECFDF5))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                                Text(usr.getString("email"), fontSize = 12.sp, color = Color.Gray)
                                if (usr.has("phone") && usr.getString("phone").isNotEmpty()) {
                                    Text("Phone: ${usr.getString("phone")}", fontSize = 11.sp, color = Color.Gray)
                                }
                            }

                            Button(
                                onClick = {
                                    scope.launch {
                                        try {
                                            EventHubApi.toggleUserBan(token, usr.getString("_id"))
                                            fetchUsers()
                                        } catch (e: Exception) {
                                            // Ignore
                                        }
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isBanned) Color(0xFFECFDF5) else Color(0xFFFEF2F2),
                                    contentColor = if (isBanned) Color(0xFF059669) else Color(0xFFDC2626)
                                ),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp)
                            ) {
                                Text(if (isBanned) "Reactivate" else "Suspend", fontSize = 11.sp, fontWeight = FontWeight.Bold)
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
fun AdminChatTab() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val token = remember { EventHubApi.getSessionToken(context) ?: "" }
    val user = remember { EventHubApi.getSessionUser(context) }

    var admins by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var chatMessages by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var activeRecipient by remember { mutableStateOf<JSONObject?>(null) } // null = Global
    var chatInput by remember { mutableStateOf("") }
    var loadingChats by remember { mutableStateOf(false) }

    val fetchAdmins = {
        scope.launch {
            try {
                val array = EventHubApi.getAdmins(token)
                val list = mutableListOf<JSONObject>()
                for (i in 0 until array.length()) {
                    list.add(array.getJSONObject(i))
                }
                admins = list
            } catch (e: Exception) {
                // Ignore
            }
        }
    }

    val fetchMessages = {
        scope.launch {
            try {
                val targetId = activeRecipient?.getString("_id") ?: "group"
                val array = EventHubApi.getChatMessages(token, targetId)
                val list = mutableListOf<JSONObject>()
                for (i in 0 until array.length()) {
                    list.add(array.getJSONObject(i))
                }
                chatMessages = list
            } catch (e: Exception) {
                // Ignore
            }
        }
    }

    LaunchedEffect(Unit) {
        fetchAdmins()
    }

    LaunchedEffect(activeRecipient) {
        // Poll messages periodically
        while (true) {
            fetchMessages()
            delay(5000)
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Admin Discuss", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
        Text("Secure channels with other system admins", fontSize = 12.sp, color = Color(0xFF64748B))

        Spacer(modifier = Modifier.height(12.dp))

        // Conversations target selector
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { activeRecipient = null },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (activeRecipient == null) Color(0xFF6366F1) else Color(0xFFE2E8F0),
                    contentColor = if (activeRecipient == null) Color.White else Color(0xFF475569)
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Global Chat", fontSize = 11.sp)
            }

            admins.filter { it.getString("email") != user.email }.take(2).forEach { adm ->
                val isSelected = activeRecipient?.getString("_id") == adm.getString("_id")
                Button(
                    onClick = { activeRecipient = adm },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isSelected) Color(0xFF6366F1) else Color(0xFFE2E8F0),
                        contentColor = if (isSelected) Color.White else Color(0xFF475569)
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(adm.getString("name"), fontSize = 11.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Chat messages box
        Card(
            modifier = Modifier.fillMaxWidth().weight(1f),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = BorderStroke(1.dp, CardBorderColor),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFEEF2F6))
                        .padding(10.dp)
                ) {
                    Text(
                        if (activeRecipient == null) "📢 Global Admin Channel" else "💬 Direct: ${activeRecipient!!.getString("name")}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF334155)
                    )
                }

                LazyColumn(
                    modifier = Modifier.weight(1f).fillMaxWidth().padding(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(chatMessages) { msg ->
                        // simple bubble
                        val isMe = msg.getString("senderName") == user.name
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = if (isMe) Alignment.End else Alignment.Start
                        ) {
                            Text(msg.getString("senderName"), fontSize = 9.sp, color = Color.Gray)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isMe) Color(0xFF6366F1) else Color(0xFFE2E8F0))
                                    .padding(8.dp)
                            ) {
                                Text(
                                    msg.getString("text"),
                                    fontSize = 12.sp,
                                    color = if (isMe) Color.White else Color.Black
                                )
                            }
                        }
                    }
                }

                // input bar
                Row(
                    modifier = Modifier.fillMaxWidth().padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = chatInput,
                        onValueChange = { chatInput = it },
                        placeholder = { Text("Message...", fontSize = 12.sp) },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    IconButton(
                        onClick = {
                            if (chatInput.isBlank()) return@IconButton
                            val text = chatInput.trim()
                            chatInput = ""
                            scope.launch {
                                try {
                                    EventHubApi.sendChatMessage(
                                        token = token,
                                        text = text,
                                        recipientId = activeRecipient?.getString("_id"),
                                        recipientName = activeRecipient?.getString("name")
                                    )
                                    fetchMessages()
                                } catch (e: Exception) {
                                    // Ignore
                                }
                            }
                        },
                        colors = IconButtonDefaults.iconButtonColors(contentColor = Color(0xFF6366F1))
                    ) {
                        Icon(Icons.Default.Send, contentDescription = "Send")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminProfileTab(onLogout: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val token = remember { EventHubApi.getSessionToken(context) ?: "" }
    var user by remember { mutableStateOf(EventHubApi.getSessionUser(context)) }

    var nameInput by remember { mutableStateOf(user.name) }
    var phoneInput by remember { mutableStateOf(user.phone) }
    var avatarUrl by remember { mutableStateOf(user.avatar) }
    var otherDetailsInput by remember { mutableStateOf(user.otherDetails) }

    var msg by remember { mutableStateOf("") }
    var msgType by remember { mutableStateOf("success") }
    var loading by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        item {
            Box(
                modifier = Modifier
                    .size(84.dp)
                    .clip(CircleShape)
                    .background(PurpleGradient),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    if (user.name.isNotEmpty()) user.name[0].uppercaseChar().toString() else "A",
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(user.name, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
            Text("System Administrator", fontSize = 11.sp, color = Color(0xFF64748B), fontWeight = FontWeight.SemiBold)
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
                    Text("Admin Settings", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
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
                        onValueChange = { phoneInput = it },
                        label = { Text("Phone Number") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = otherDetailsInput,
                        onValueChange = { otherDetailsInput = it },
                        label = { Text("Other Details") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2
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
                                        phone = phoneInput.trim().ifEmpty { null },
                                        otherDetails = otherDetailsInput.trim().ifEmpty { null }
                                    )
                                    val userObj = res.getJSONObject("user")
                                    val savedName = userObj.getString("name")
                                    val savedPhone = userObj.optString("phone", "")
                                    val savedAvatar = userObj.optString("avatar", "")
                                    val savedOther = userObj.optString("otherDetails", "")

                                    EventHubApi.saveSession(
                                        context,
                                        token,
                                        savedName,
                                        user.email,
                                        savedPhone,
                                        savedAvatar,
                                        savedOther
                                    )
                                    user = EventHubApi.getSessionUser(context)
                                    msg = "Admin settings updated! 🎉"
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
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
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
