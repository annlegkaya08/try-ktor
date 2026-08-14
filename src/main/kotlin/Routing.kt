package com.example

import com.example.routes.calculationRoutes
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting() {

  routing {
    get("/") {
      val response =
          mapOf(
              "service" to "Compound Interest Calculator",
              "version" to "1.0.0",
              "endpoints" to
                  listOf(
                      "POST /calculate - Calculate compound interest with JSON body",
                      "GET /calculate?initial=100000&monthly=5000&rate=8.5&years=20 - Calculate with query params",
                  ),
              "example" to
                  mapOf(
                      "method" to "POST",
                      "url" to "/calculate",
                      "body" to
                          mapOf(
                              "initialAmount" to 100000.0,
                              "monthlyContribution" to 5000.0,
                              "annualReturn" to 8.5,
                              "inflation" to 3.0,
                              "years" to 20,
                          ),
                  ),
          )
      call.respond(response)
    }

    get("/json/kotlinx-serialization") {
      call.respond(mapOf("hello" to "world"))
    }
    calculationRoutes()
  }
}
