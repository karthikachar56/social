package com.example.eventhubadmin

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.eventhubadmin.data.EventHubApi
import com.example.eventhubadmin.ui.*

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
            }
          )
        }
        entry<Dashboard> {
          DashboardScreen(
            onLogout = { 
              backStack.removeLastOrNull()
              backStack.add(Login) 
            }
          )
        }
      },
  )
}
