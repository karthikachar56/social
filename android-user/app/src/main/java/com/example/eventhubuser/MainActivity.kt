package com.example.eventhubuser

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import com.example.eventhubuser.theme.EventHubUserTheme
import com.example.eventhubuser.data.EventHubApi

object ThemeState {
    var isDarkTheme by mutableStateOf(false)
}

class MainActivity : ComponentActivity() {
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
  }
}
