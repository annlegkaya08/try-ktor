package com.example

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import kotlinx.serialization.Serializable
@Serializable
data class ErrorResponse(
    val error: String,
    val message: String,
    val details: List<String>? = null,
)

fun Application.configureStatusPages() {
  install(StatusPages) {
    // validation excepts
    exception<IllegalArgumentException> { call, cause ->
      call.respond(
          HttpStatusCode.BadRequest,
          ErrorResponse("Validation Error", cause.message ?: "Invalid input"),
      )
    }

    // other
    exception<Throwable> { call, cause ->
      call.respond(
          HttpStatusCode.InternalServerError,
          ErrorResponse("Internal Error", cause.message ?: "Unknown error"),
      )
    }
  }
}
