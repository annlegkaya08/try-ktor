package com.example.services

import com.example.models.CalculationRequest
import com.example.models.CalculationResponse
import com.example.models.YearlyBreakdown
import kotlin.math.pow

class CompoundInterestService {

  fun calculate(request: CalculationRequest): CalculationResponse {
    val monthlyRate = request.annualReturn / 100 / 12
    val months = request.years * 12
    val monthlyContribution = request.monthlyContribution

    // Main bill
    var futureValue = request.initialAmount
    var totalContributions = request.initialAmount
    val breakdown = mutableListOf<YearlyBreakdown>()

    for (month in 1..months) {
      // Adding percents per month
      futureValue *= (1 + monthlyRate)

      futureValue += monthlyContribution
      totalContributions += monthlyContribution

      // Saving value of year earnings
      if (month % 12 == 0) {
        val year = month / 12
        val earnings = futureValue - totalContributions
        breakdown.add(
            YearlyBreakdown(
                year = year,
                value = roundToTwo(futureValue),
                contributions = roundToTwo(totalContributions),
                earnings = roundToTwo(earnings),
            )
        )
      }
    }

    val inflationAdjustedValue =
        request.inflation?.let { inflation ->
          val annualInflation = inflation / 100
          val realValue = futureValue / (1 + annualInflation).pow(request.years)
          roundToTwo(realValue)
        }

    val averageAnnualReturn =
        if (request.initialAmount > 0) {
          val totalReturn = (futureValue / request.initialAmount - 1) * 100
          roundToTwo(totalReturn / request.years)
        } else {
          0.0
        }

    return CalculationResponse(
        futureValue = roundToTwo(futureValue),
        totalContributions = roundToTwo(totalContributions),
        totalEarnings = roundToTwo(futureValue - totalContributions),
        averageAnnualReturn = averageAnnualReturn,
        inflationAdjustedValue = inflationAdjustedValue,
        yearlyBreakdown = breakdown,
    )
  }

  private fun roundToTwo(value: Double): Double {
    return "%.2f".format(value).toDouble()
  }
}
