package com.example.eventhubuser

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.eventhubuser.data.EventHubApi
import com.example.eventhubuser.ui.*

@Composable
fun MainNavigation() {
  val context = LocalContext.current
  
  var updateAvailable by androidx.compose.runtime.remember { 
      androidx.compose.runtime.mutableStateOf(EventHubApi.isUpdateAvailable(context)) 
  }
  var apkUrl by androidx.compose.runtime.remember { 
      androidx.compose.runtime.mutableStateOf(EventHubApi.getLatestApkUrl(context)) 
  }

  androidx.compose.runtime.DisposableEffect(context) {
      val prefs = context.getSharedPreferences("EventHubPrefs", android.content.Context.MODE_PRIVATE)
      val listener = android.content.SharedPreferences.OnSharedPreferenceChangeListener { _, key ->
          if (key == "update_available") {
              updateAvailable = EventHubApi.isUpdateAvailable(context)
          }
          if (key == "latest_apk_url") {
              apkUrl = EventHubApi.getLatestApkUrl(context)
          }
      }
      prefs.registerOnSharedPreferenceChangeListener(listener)
      onDispose {
          prefs.unregisterOnSharedPreferenceChangeListener(listener)
      }
  }

  if (updateAvailable) {
      UpdateRequiredScreen(apkUrl = apkUrl)
  } else {
      val hasToken = EventHubApi.getSessionToken(context) != null
      val startDestination = if (hasToken) Dashboard else Login

      val backStack = rememberNavBackStack(startDestination)

      NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryProvider =
          entryProvider {
            entry<Login> {
              LoginScreen(
                onLoginSuccess = { 
                  backStack.removeLastOrNull()
                  backStack.add(Dashboard) 
                },
                onNavigateToRegister = { backStack.add(Register) }
              )
            }
            entry<Register> {
              RegisterScreen(
                onRegisterSuccess = { 
                  backStack.removeLastOrNull()
                  backStack.add(ProfileSetup) 
                },
                onNavigateToLogin = { backStack.add(Login) }
              )
            }
            entry<ProfileSetup> {
              ProfileSetupScreen(
                onSetupComplete = { 
                  backStack.removeLastOrNull()
                  backStack.add(Dashboard) 
                }
              )
            }
            entry<Dashboard> {
              DashboardScreen(
                onNavigateToEventDetail = { id -> backStack.add(EventDetail(id)) },
                onNavigateToNewsDetail = { id -> backStack.add(NewsDetail(id)) },
                onNavigateToChangePassword = { backStack.add(ChangePassword) },
                onLogout = { 
                  backStack.removeLastOrNull()
                  backStack.add(Login) 
                }
              )
            }
            entry<EventDetail> { key ->
              EventDetailScreen(
                eventId = key.id,
                onBack = { backStack.removeLastOrNull() }
              )
            }
            entry<NewsDetail> { key ->
              NewsDetailScreen(
                newsId = key.id,
                onBack = { backStack.removeLastOrNull() }
              )
            }
            entry<ChangePassword> {
              ChangePasswordScreen(
                onBack = { backStack.removeLastOrNull() }
              )
            }
          },
      )
  }
}
