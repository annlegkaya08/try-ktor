package com.example.routes

import com.example.models.CalculationRequest
import com.example.services.CompoundInterestService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.*

fun Route.calculationRoutes() {
  val service = CompoundInterestService()

  route("/calculate") {
    post {
      try {
        val request = call.receive<CalculationRequest>()

        val errors = request.validate()
        if (errors.isNotEmpty()) {
          throw IllegalArgumentException(errors.joinToString(", "))
        }

        val result = service.calculate(request)
        call.respond(HttpStatusCode.OK, result)
      } catch (e: IllegalArgumentException) {
        throw e
      } catch (e: Exception) {
        throw RuntimeException("Failed to process calculation", e)
      }
    }

    get {
      try {
        // fixed parsing
        val initial = parseDouble(call.request.queryParameters["initial"] ?: "0")
        val monthly = parseDouble(call.request.queryParameters["monthly"] ?: "0")
        val rate = parseDouble(call.request.queryParameters["rate"] ?: "0")
        val years = parseYears(call.request.queryParameters["years"] ?: "0")
        val inflation = parseDoubleOrNull(call.request.queryParameters["inflation"])

        val request =
            CalculationRequest(
                initialAmount = initial,
                monthlyContribution = monthly,
                annualReturn = rate,
                inflation = inflation,
                years = years,
            )

        // Validation
        val errors = request.validate()
        if (errors.isNotEmpty()) {
          throw IllegalArgumentException(errors.joinToString(", "))
        }

        val result = service.calculate(request)
        call.respond(HttpStatusCode.OK, result)
      } catch (e: NumberFormatException) {
        throw IllegalArgumentException("Invalid number format: ${e.message}")
      } catch (e: IllegalArgumentException) {
        throw e
      } catch (e: Exception) {
        throw RuntimeException("Failed to process calculation", e)
      }
    }
  }
}

private fun parseDouble(value: String): Double {
  return try {
    val normalized = value.trim().replace(',', '.')
    normalized.toDouble()
  } catch (e: NumberFormatException) {
    throw NumberFormatException("Cannot parse '$value' as a number")
  }
}

private fun parseDoubleOrNull(value: String?): Double? {
  if (value.isNullOrBlank()) return null
  return try {
    parseDouble(value)
  } catch (e: NumberFormatException) {
    null
  }
}

private fun parseYears(value: String): Int {
  return try {
    val normalized = value.trim()
    normalized.toInt()
  } catch (e: NumberFormatException) {
    throw NumberFormatException("Cannot parse '$value' as a number of years")
  }
}
