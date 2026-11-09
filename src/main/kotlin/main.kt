package com.example

import io.ktor.server.engine.*
import io.ktor.server.application.*

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
    //http://localhost:8080/calculate?initial=100000&monthly=5000&rate=8.5&years=5
}
