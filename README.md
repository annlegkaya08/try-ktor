# Compound Interest Calculator

REST API для расчёта сложного процента с ежемесячными пополнениями и учётом инфляции. Написан на Kotlin + Ktor.

## Возможности

- Расчёт будущей стоимости вклада с ежемесячной капитализацией и регулярными пополнениями
- Разбивка по годам: сумма на счёте, внесённые средства, накопленный доход
- Пересчёт итоговой суммы с учётом инфляции (необязательно)
- Два способа вызова: `POST` с JSON и `GET` с query-параметрами
- Валидация входных данных и единый формат ошибок

## Стек

| Компонент | Версия |
|-----------|--------|
| Kotlin (JVM) | 2.4.0 |
| Ktor (Netty) | 3.5.0 |
| kotlinx.serialization | JSON |
| Gradle | 9.5.1 (wrapper) |
| JDK | 21 |
| Logback | 1.5.35 |

## Быстрый старт

Требуется JDK 21.

```bash
./gradlew run      # запустить сервер
./gradlew test     # запустить тесты
./gradlew build    # собрать проект
```

Сервер стартует на `http://localhost:8080` (порт задаётся в `src/main/resources/application.yaml`).

## API

### `GET /`

Информация о сервисе: название, версия, список эндпоинтов и пример запроса.

### `POST /calculate`

Тело запроса (`application/json`):

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `initialAmount` | number | да | Начальная сумма, `>= 0` |
| `monthlyContribution` | number | да | Ежемесячное пополнение, `>= 0` |
| `annualReturn` | number | да | Годовая доходность в процентах, `>= -100` |
| `inflation` | number | нет | Годовая инфляция в процентах, `>= -100` |
| `years` | integer | да | Срок в годах, от 1 до 100 |

Пример:

```bash
curl -X POST http://localhost:8080/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "initialAmount": 100000,
    "monthlyContribution": 5000,
    "annualReturn": 8.5,
    "inflation": 3.0,
    "years": 5
  }'
```

Ответ (`yearlyBreakdown` сокращён):

```json
{
  "futureValue": 524942.25,
  "totalContributions": 400000.0,
  "totalEarnings": 124942.25,
  "averageAnnualReturn": 84.99,
  "inflationAdjustedValue": 452819.79,
  "yearlyBreakdown": [
    { "year": 1, "value": 171232.67, "contributions": 160000.0, "earnings": 11232.67 },
    { "year": 2, "value": 248761.66, "contributions": 220000.0, "earnings": 28761.66 }
  ]
}
```

### `GET /calculate`

Те же расчёты через query-параметры:

| Параметр | Соответствует полю | Обязательный |
|----------|--------------------|--------------|
| `initial` | `initialAmount` | нет (по умолчанию `0`) |
| `monthly` | `monthlyContribution` | нет (по умолчанию `0`) |
| `rate` | `annualReturn` | нет (по умолчанию `0`) |
| `years` | `years` | да (значение `0` не пройдёт валидацию) |
| `inflation` | `inflation` | нет |

Допускается запятая в качестве десятичного разделителя (`8,5` = `8.5`).

```bash
curl "http://localhost:8080/calculate?initial=100000&monthly=5000&rate=8.5&years=5&inflation=3"
```

### Формат ошибок

```json
{
  "error": "Validation Error",
  "message": "years must be between 1 and 100"
}
```

| HTTP-статус | `error` | Когда возникает |
|-------------|---------|-----------------|
| 400 | `Validation Error` | Не пройдена валидация или неверный формат числа |
| 500 | `Internal Error` | Непредвиденная ошибка сервера |

## Как считается

Расчёт идёт помесячно:

```
monthlyRate = annualReturn / 100 / 12

каждый месяц:
    value = value * (1 + monthlyRate) + monthlyContribution
```

- Проценты начисляются ежемесячно, пополнение вносится **в конце месяца** (после начисления процентов).
- `totalContributions` = начальная сумма + все пополнения.
- `totalEarnings` = `futureValue` − `totalContributions`.
- `inflationAdjustedValue` = `futureValue / (1 + inflation / 100)^years`.
- `averageAnnualReturn` — простая средняя доходность относительно **начальной суммы**: `(futureValue / initialAmount − 1) * 100 / years`. Если `initialAmount = 0`, возвращается `0`. Показатель не учитывает пополнения и поэтому может превышать `annualReturn` в разы — для оценки реальной доходности ориентируйтесь на `totalEarnings`.
- Все денежные значения в ответе округляются до двух знаков.

## Структура проекта

```
src/main/kotlin/
├── main.kt                          # точка входа
├── Routing.kt                       # корневой маршрут и подключение роутов
├── Serialization.kt                 # настройка JSON (ContentNegotiation)
├── StatusPages.kt                   # обработка ошибок, ErrorResponse
├── models/
│   ├── CalculationRequest.kt        # входная модель + validate()
│   └── CalculationResponse.kt       # выходные модели
├── routes/
│   └── CalculationRoutes.kt         # GET/POST /calculate
└── services/
    └── CompoundInterestService.kt   # логика расчёта
src/main/resources/
├── application.yaml                 # конфигурация Ktor и список модулей
└── logback.xml                      # логирование
src/test/kotlin/
└── ServerTest.kt                    # тесты
```