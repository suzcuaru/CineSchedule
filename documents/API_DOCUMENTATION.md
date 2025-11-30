# CineSchedule Backend API v3

## Обзор

Этот API предоставляет методы для получения расписания кинотеатра и обновления статусов контента. Взаимодействие происходит по протоколу HTTP с JSON-телами запросов и ответов.

**Базовый URL:** `http://<server_url>/api/v3`

---

## Авторизация

Все запросы к API должны содержать заголовок `Authorization` для аутентификации.

- **Тип:** Bearer Token
- **Заголовок:** `Authorization: Bearer YOUR_API_KEY_HERE`

Замените `YOUR_API_KEY_HERE` на ваш действительный API-ключ, полученный из настроек приложения. Запросы без валидного ключа будут отклонены с ошибкой `401 Unauthorized`.

---

## 1. Получение расписания на день

Загружает полное расписание для всех залов на указанную дату. Используется для главной панели и сетки по залам.

- **Endpoint:** `GET /schedule/day`
- **Метод:** `GET`
- **Параметры запроса (Query Params):**
  - `date` (string, required): Дата в формате `YYYY-MM-DD`.

**Пример запроса:**
`GET http://192.168.1.10:3000/api/v3/schedule/day?date=2024-07-15`
`Authorization: Bearer YOUR_API_KEY_HERE`

**Ответ `200 OK`:**
```json
{
  "date": "2024-07-15",
  "sessions": [
    {
      "id": "sess_xyz123",
      "hall_name": "1",
      "date": "2024-07-15",
      "time": "10:00",
      "end_time": "12:46",
      "duration": 166,
      "name": "Дюна: Часть вторая",
      "content_status": "ready_hall"
    }
  ]
}
```

---

## 2. Получение расписания для зала за период

Загружает расписание для **одного конкретного зала** за указанный период (до 7 дней). Используется для недельного обзора зала.

- **Endpoint:** `GET /schedule/week`
- **Метод:** `GET`
- **Параметры запроса (Query Params):**
  - `hall` (string, required): Номер зала (например, "1", "5").
  - `from` (string, required): Начальная дата периода в формате `YYYY-MM-DD`.
  - `to` (string, required): Конечная дата периода в формате `YYYY-MM-DD`.

**Пример запроса:**
`GET http://192.168.1.10:3000/api/v3/schedule/week?hall=3&from=2024-07-15&to=2024-07-21`
`Authorization: Bearer YOUR_API_KEY_HERE`

**Ответ `200 OK`:**
```json
{
  "hall": "3",
  "from": "2024-07-15",
  "to": "2024-07-21",
  "sessions": [
    {
      "id": "sess_abc456",
      "hall_name": "3",
      "date": "2024-07-15",
      "time": "11:30"
    },
    {
      "id": "sess_def789",
      "hall_name": "3",
      "date": "2024-07-16",
      "time": "14:00"
    }
  ]
}
```

---

## 3. Обновление статуса сеанса

Устанавливает новый статус для конкретного сеанса. Сервер должен сохранить это состояние.

- **Endpoint:** `POST /status`
- **Метод:** `POST`
- **Тело запроса (Body):** `application/json`

**Тело запроса:**
```json
{
  "session_id": "sess_xyz123",
  "status": "no_keys"
}
```

**Возможные значения `status`:**
`ready_hall`, `on_storage`, `download_hall`, `download_storage`, `distributor`, `no_keys`, `no_status`, `missing`.

**Ответ `200 OK` (успех):**
```json
{
  "success": true,
  "session_id": "sess_xyz123",
  "new_status": "no_keys"
}
```
