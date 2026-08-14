package com.example.routes

import com.example.models.CalculationRequest
import com.example.services.CompoundInterestService
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route

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
        throw e // StatusPages перехватит
      } catch (e: Exception) {
        throw RuntimeException("Failed to process calculation", e)
      }
    }

    get {
      // GET-version for web tests
      val initial = call.request.queryParameters["initial"]?.toDoubleOrNull() ?: 100000.0
      val monthly = call.request.queryParameters["monthly"]?.toDoubleOrNull() ?: 5000.0
      val rate = call.request.queryParameters["rate"]?.toDoubleOrNull() ?: 8.5
      val years = call.request.queryParameters["years"]?.toIntOrNull() ?: 20

      val request =
          CalculationRequest(
              initialAmount = initial,
              monthlyContribution = monthly,
              annualReturn = rate,
              years = years,
          )

      val result = service.calculate(request)
      call.respond(HttpStatusCode.OK, result)
    }
  }
}
