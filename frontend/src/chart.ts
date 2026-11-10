import { compact } from './format'
import type { YearRow } from './types'

export interface Point {
  year: number
  value: number
  contributions: number
  earnings: number
  /** Стоимость в сегодняшних деньгах; null, если инфляция не задана */
  real: number | null
}

export function buildPoints(rows: YearRow[], initial: number, inflation: number | null): Point[] {
  const pts: Point[] = [
    { year: 0, value: initial, contributions: initial, earnings: 0, real: inflation != null ? initial : null },
  ]
  for (const r of rows) {
    pts.push({
      ...r,
      real: inflation != null ? r.value / Math.pow(1 + inflation / 100, r.year) : null,
    })
  }
  return pts
}

function niceMax(v: number): number {
  if (v <= 0) return 1
  const exp = Math.pow(10, Math.floor(Math.log10(v)))
  const f = v / exp
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nf * exp
}

const W = 800
const H = 340
const ML = 60
const MR = 12
const MT = 12
const MB = 28

export function mountChart(
  root: HTMLElement,
  onHover: (p: Point) => void,
  onLeave: () => void,
) {
  let points: Point[] = []
  let first = true

  const n = () => points.length - 1
  const x = (i: number) => ML + (i / n()) * (W - ML - MR)

  function render(next: Point[]) {
    points = next
    if (points.length < 2) return
    const max = niceMax(Math.max(...points.map((p) => p.value)))
    const y = (v: number) => MT + (1 - v / max) * (H - MT - MB)
    const N = n()

    let grid = ''
    for (let k = 0; k <= 4; k++) {
      const v = (max * k) / 4
      grid += `<line class="g-grid" x1="${ML}" x2="${W - MR}" y1="${y(v)}" y2="${y(v)}"/>
               <text class="g-label" x="${ML - 8}" y="${y(v) + 4}" text-anchor="end">${compact(v)}</text>`
    }

    const step = Math.max(1, Math.ceil(N / 8))
    let xt = ''
    for (let i = 0; i <= N; i += step) {
      xt += `<text class="g-label" x="${x(i)}" y="${H - 8}" text-anchor="middle">${i}</text>`
    }

    const fwd = (f: (p: Point) => number) => points.map((p, i) => `${x(i)},${y(f(p))}`)
    const base = `M${x(0)},${y(0)} L${fwd((p) => p.contributions).join(' L')} L${x(N)},${y(0)} Z`
    const grow = `M${fwd((p) => p.value).join(' L')} L${points
      .map((p, i) => `${x(i)},${y(p.contributions)}`)
      .reverse()
      .join(' L')} Z`
    const top = `M${fwd((p) => p.value).join(' L')}`
    const real = points[0].real != null ? `M${fwd((p) => p.real ?? 0).join(' L')}` : ''

    root.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="График роста капитала по годам">
        ${grid}${xt}
        <path class="g-base" d="${base}"/>
        <path class="g-grow" d="${grow}"/>
        <path class="g-top" d="${top}"/>
        ${real ? `<path class="g-real" d="${real}"/>` : ''}
        <g class="g-cursor" visibility="hidden">
          <line y1="${MT}" y2="${H - MB}"/>
          <circle class="c-top" r="5"/>
          <circle class="c-base" r="4"/>
        </g>
      </svg>`

    if (first) {
      first = false
      root.classList.add('reveal')
      root.addEventListener('animationend', () => root.classList.remove('reveal'), { once: true })
    }

    const svg = root.querySelector('svg')!
    const cursor = svg.querySelector<SVGGElement>('.g-cursor')!
    const line = cursor.querySelector('line')!
    const cTop = cursor.querySelector<SVGCircleElement>('.c-top')!
    const cBase = cursor.querySelector<SVGCircleElement>('.c-base')!

    svg.addEventListener('pointermove', (e) => {
      const rect = svg.getBoundingClientRect()
      const px = ((e.clientX - rect.left) / rect.width) * W
      const i = Math.max(0, Math.min(N, Math.round(((px - ML) / (W - ML - MR)) * N)))
      const p = points[i]
      line.setAttribute('x1', String(x(i)))
      line.setAttribute('x2', String(x(i)))
      cTop.setAttribute('cx', String(x(i)))
      cTop.setAttribute('cy', String(y(p.value)))
      cBase.setAttribute('cx', String(x(i)))
      cBase.setAttribute('cy', String(y(p.contributions)))
      cursor.setAttribute('visibility', 'visible')
      onHover(p)
    })
    svg.addEventListener('pointerleave', () => {
      cursor.setAttribute('visibility', 'hidden')
      onLeave()
    })
  }

  return { render }
}
