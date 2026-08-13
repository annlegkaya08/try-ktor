package com.example.models

import kotlinx.serialization.Serializable

@Serializable
data class YearlyBreakdown(
    val year: Int,
    val value: Double,
    val contributions: Double,
    val earnings: Double
)

@Serializable
data class CalculationResponse(
    val futureValue: Double,
    val totalContributions: Double,
    val totalEarnings: Double,
    val averageAnnualReturn: Double,
    val inflationAdjustedValue: Double? = null,
    val yearlyBreakdown: List<YearlyBreakdown>
)