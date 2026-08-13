package com.example.models

import kotlinx.serialization.Serializable

@Serializable
data class CalculationRequest(
    val initialAmount: Double,
    val monthlyContribution: Double,
    val annualReturn: Double,
    val inflation: Double? = null,
    val years: Int,
) {

  // Data validation
  fun validate(): List<String> {
      val errors = mutableListOf<String>()
      if (initialAmount < 0) errors.add("initialAmount must be >= 0")
      if (monthlyContribution < 0) errors.add("monthlyContribution must be >= 0")
      if (annualReturn < -100) errors.add("annualReturn must be >= -100")
      if (inflation != null && inflation < -100) errors.add("inflation must be >= -100")
      if (years !in 1..100) errors.add("years must be between 1 and 100")
      return errors
  }
}
