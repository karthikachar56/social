package com.example.eventhubuser

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.eventhubuser.data.EventHubApi
import com.example.eventhubuser.ui.*

@Composable
fun MainNavigation() {
  val context = LocalContext.current
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
