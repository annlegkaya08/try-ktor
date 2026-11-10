const full = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const compactFmt = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 })

export const fmt = (n: number): string => full.format(Math.round(n))
export const compact = (n: number): string => compactFmt.format(n)

export function plural(n: number): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'год'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'года'
  return 'лет'
}
