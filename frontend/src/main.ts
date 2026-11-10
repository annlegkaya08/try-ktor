import './style.css'
import { calculate } from './api'
import { buildPoints, mountChart, type Point } from './chart'
import { fmt, plural } from './format'
import type { CalcRequest, CalcResponse } from './types'

type Key = 'initialAmount' | 'monthlyContribution' | 'annualReturn' | 'inflation' | 'years'

interface FieldDef {
  key: Key
  label: string
  min: number
  max: number
  step: number
  value: number
  unit: string
  optional?: boolean
}

const FIELDS: FieldDef[] = [
  { key: 'initialAmount', label: 'Начальная сумма', min: 0, max: 10_000_000, step: 10_000, value: 100_000, unit: 'cur' },
  { key: 'monthlyContribution', label: 'Пополнение в месяц', min: 0, max: 500_000, step: 1_000, value: 5_000, unit: 'cur' },
  { key: 'annualReturn', label: 'Доходность в год', min: 0, max: 30, step: 0.1, value: 8.5, unit: '%' },
  { key: 'inflation', label: 'Учитывать инфляцию', min: 0, max: 20, step: 0.1, value: 3, unit: '%', optional: true },
  { key: 'years', label: 'Срок', min: 1, max: 50, step: 1, value: 20, unit: 'лет' },
]

const $ = <T extends HTMLElement>(sel: string): T => document.querySelector<T>(sel)!

const state: Record<Key, number> = {
  initialAmount: 100_000,
  monthlyContribution: 5_000,
  annualReturn: 8.5,
  inflation: 3,
  years: 20,
}
let inflationOn = true
let symbol = '₽'
let current: { res: CalcResponse; points: Point[] } | null = null

// ---------- форма ----------

const form = $<HTMLFormElement>('#controls')
form.innerHTML = FIELDS.map(
  (f) => `
  <div class="field" data-key="${f.key}">
    <div class="field-top">
      ${
        f.optional
          ? `<label class="check"><input type="checkbox" id="on-${f.key}" checked /><span>${f.label}</span></label>`
          : `<label for="n-${f.key}">${f.label}</label>`
      }
      <div class="num">
        <input id="n-${f.key}" type="number" inputmode="decimal" aria-label="${f.label}"
               min="${f.min}" step="any" value="${f.value}" />
        <span class="unit" data-unit="${f.unit}"></span>
      </div>
    </div>
    <input id="r-${f.key}" class="range" type="range" aria-label="${f.label}"
           min="${f.min}" max="${f.max}" step="${f.step}" value="${f.value}" />
  </div>`,
).join('')

function paintRange(r: HTMLInputElement) {
  const p = ((Number(r.value) - Number(r.min)) / (Number(r.max) - Number(r.min))) * 100
  r.style.setProperty('--p', `${Math.min(100, Math.max(0, p))}%`)
}

function paintUnits() {
  document.querySelectorAll<HTMLElement>('.unit').forEach((u) => {
    u.textContent = u.dataset.unit === 'cur' ? symbol : u.dataset.unit ?? ''
  })
}

//input


for (const f of FIELDS) {
  const n = $<HTMLInputElement>(`#n-${f.key}`)
  const r = $<HTMLInputElement>(`#r-${f.key}`)
  paintRange(r)

  n.addEventListener('input', () => {
    let v = parseFloat(n.value.replace(',', '.'))
    if (!Number.isFinite(v)) return
    if (f.key === 'years') v = Math.round(v)
    state[f.key] = v
    r.value = String(v)
    paintRange(r)
    schedule()
  })
  r.addEventListener('input', () => {
    state[f.key] = Number(r.value)
    n.value = r.value
    paintRange(r)
    schedule()
  })

  if (f.optional) {
    const box = $<HTMLInputElement>(`#on-${f.key}`)
    box.addEventListener('change', () => {
      inflationOn = box.checked
      n.disabled = !box.checked
      r.disabled = !box.checked
      form.querySelector(`[data-key="${f.key}"]`)?.classList.toggle('off', !box.checked)
      schedule()
    })
  }
}
paintUnits()

$<HTMLSelectElement>('#currency').addEventListener('change', (e) => {
  symbol = (e.target as HTMLSelectElement).value
  paintUnits()
  if (current) render(current.res, current.points)
})


let timer = 0
let ctl: AbortController | null = null
const result = $('#result')
const errorBox = $('#error')

function schedule() {
  window.clearTimeout(timer)
  timer = window.setTimeout(run, 150)
}

function buildRequest(): CalcRequest {
  return {
    initialAmount: state.initialAmount,
    monthlyContribution: state.monthlyContribution,
    annualReturn: state.annualReturn,
    inflation: inflationOn ? state.inflation : undefined,
    years: state.years,
  }
}

async function run() {
  ctl?.abort()
  const mine = new AbortController()
  ctl = mine
  result.classList.add('loading')
  const req = buildRequest()
  try {
    const res = await calculate(req, mine.signal)
    const points = buildPoints(res.yearlyBreakdown, req.initialAmount, req.inflation ?? null)
    current = { res, points }
    errorBox.hidden = true
    render(res, points)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    errorBox.textContent = (e as Error).message
    errorBox.hidden = false
  } finally {
    if (ctl === mine) result.classList.remove('loading')
  }
}

//output

const chart = mountChart(
  $('#chart'),
  (p) => showPoint(p),
  () => current && showPoint(current.points[current.points.length - 1]),
)

function showPoint(p: Point) {
  const cell = (k: string, v: string, cls = '') =>
    `<div class="cell ${cls}"><span class="k">${k}</span><strong class="v">${v}</strong></div>`
  $('#readout').innerHTML =
    cell('Период', p.year === 0 ? 'Старт' : `${p.year} ${plural(p.year)}`) +
    cell('Всего', `${fmt(p.value)} ${symbol}`) +
    cell('Внесено', `${fmt(p.contributions)} ${symbol}`) +
    cell('Доход', `${fmt(p.earnings)} ${symbol}`, 'grow') +
    (p.real != null ? cell('С инфляцией', `${fmt(p.real)} ${symbol}`) : '')
}

function render(res: CalcResponse, points: Point[]) {
  const years = res.yearlyBreakdown.length
  $('#hero-label').textContent = `Через ${years} ${plural(years)} у вас будет`
  $('#fv').textContent = `${fmt(res.futureValue)} ${symbol}`
  $('#real').textContent =
    res.inflationAdjustedValue != null
      ? `В сегодняшних деньгах это ${fmt(res.inflationAdjustedValue)} ${symbol}`
      : ''

  const share = res.futureValue > 0 ? (res.totalContributions / res.futureValue) * 100 : 100
  $('#split-base').style.width = `${share}%`
  $('#s-contrib').textContent = `${fmt(res.totalContributions)} ${symbol}`
  $('#s-earn').textContent = `${fmt(res.totalEarnings)} ${symbol}`

  $('#lg-real').hidden = points[0].real == null
  chart.render(points)
  showPoint(points[points.length - 1])

  $('#rows').innerHTML = res.yearlyBreakdown
    .map(
      (r) =>
        `<tr><td>${r.year}</td><td>${fmt(r.value)}</td><td>${fmt(r.contributions)}</td><td>${fmt(r.earnings)}</td></tr>`,
    )
    .join('')
}

run()
