package com.example.eventhubuser

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable data object Login : NavKey
@Serializable data object Register : NavKey
@Serializable data object ProfileSetup : NavKey
@Serializable data object Dashboard : NavKey

@Serializable data class EventDetail(val id: String) : NavKey
@Serializable data class NewsDetail(val id: String) : NavKey
