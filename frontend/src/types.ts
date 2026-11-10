export interface CalcRequest {
  initialAmount: number
  monthlyContribution: number
  annualReturn: number
  inflation?: number
  years: number
}

export interface YearRow {
  year: number
  value: number
  contributions: number
  earnings: number
}

export interface CalcResponse {
  futureValue: number
  totalContributions: number
  totalEarnings: number
  averageAnnualReturn: number
  inflationAdjustedValue?: number | null
  yearlyBreakdown: YearRow[]
}
