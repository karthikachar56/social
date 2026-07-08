package com.example.eventhubuser

import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.example.eventhubuser.theme.EventHubUserTheme
import com.example.eventhubuser.data.EventHubApi

object ThemeState {
    var isDarkTheme by mutableStateOf(false)
}

class MainActivity : ComponentActivity() {
  private val requestPermissionLauncher = registerForActivityResult(
      ActivityResultContracts.RequestPermission()
  ) { isGranted: Boolean ->
      startNotificationService()
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    ThemeState.isDarkTheme = EventHubApi.isDarkTheme(this)

    enableEdgeToEdge()
    setContent {
      EventHubUserTheme(darkTheme = ThemeState.isDarkTheme) { 
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) { 
          MainNavigation() 
        } 
      }
    }

    checkAndRequestPermissions()
  }

  private fun checkAndRequestPermissions() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (ContextCompat.checkSelfPermission(
          this,
          "android.permission.POST_NOTIFICATIONS"
        ) != PackageManager.PERMISSION_GRANTED
      ) {
        requestPermissionLauncher.launch("android.permission.POST_NOTIFICATIONS")
      } else {
        startNotificationService()
      }
    } else {
      startNotificationService()
    }
  }

  private fun startNotificationService() {
    val intent = Intent(this, NotificationService::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      startForegroundService(intent)
    } else {
      startService(intent)
    }
  }
}
