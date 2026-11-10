import type { CalcRequest, CalcResponse } from './types'

export async function calculate(req: CalcRequest, signal: AbortSignal): Promise<CalcResponse> {
  let res: Response
  try {
    res = await fetch('/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new Error('Сервер недоступен. Запустите бэкенд командой ./gradlew run (порт 8080).')
  }

  if (!res.ok) {
    let message = `Ошибка ${res.status}`
    try {
      const body = await res.json()
      if (body?.message) message = String(body.message)
    } catch {
      /* тело ответа не JSON — оставляем общий текст */
    }
    throw new Error(message)
  }
  return res.json()
}
