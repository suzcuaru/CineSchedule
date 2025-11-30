
import React from 'react';
import { HelpCircle, Layers, Database, FileSpreadsheet, MousePointer, Fingerprint, ChevronRight, CheckCircle2, AlertCircle, Server, LayoutDashboard, Keyboard, Move, AppWindow, Download } from 'lucide-react';
import { CONTENT_STATUS_CONFIG } from '../../types';
import { ViewContainer, GridSection, GestureItem, Card } from './SystemUI';

const API_DOCS_CONTENT = `
# CineSchedule Backend API v3

## Обзор

Этот API предоставляет методы для получения расписания кинотеатра и обновления статусов контента. Взаимодействие происходит по протоколу HTTP с JSON-телами запросов и ответов.

**Базовый URL:** \`http://<server_url>/api/v3\`

---

## Авторизация

Все запросы к API должны содержать заголовок \`Authorization\` для аутентификации.

- **Тип:** Bearer Token
- **Заголовок:** \`Authorization: Bearer YOUR_API_KEY_HERE\`

Замените \`YOUR_API_KEY_HERE\` на ваш действительный API-ключ, полученный из настроек приложения. Запросы без валидного ключа будут отклонены с ошибкой \`401 Unauthorized\`.

---

## 1. Получение расписания на день

Загружает полное расписание для всех залов на указанную дату. Используется для главной панели и сетки по залам.

- **Endpoint:** \`GET /schedule/day\`
- **Метод:** \`GET\`
- **Параметры запроса (Query Params):**
  - \`date\` (string, required): Дата в формате \`YYYY-MM-DD\`.

**Пример запроса:**
\`GET http://192.168.1.10:3000/api/v3/schedule/day?date=2024-07-15\`
\`Authorization: Bearer YOUR_API_KEY_HERE\`

**Ответ \`200 OK\`:**
\`\`\`json
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
\`\`\`

---

## 2. Получение расписания для зала за период

Загружает расписание для **одного конкретного зала** за указанный период (до 7 дней). Используется для недельного обзора зала.

- **Endpoint:** \`GET /schedule/week\`
- **Метод:** \`GET\`
- **Параметры запроса (Query Params):**
  - \`hall\` (string, required): Номер зала (например, "1", "5").
  - \`from\` (string, required): Начальная дата периода в формате \`YYYY-MM-DD\`.
  - \`to\` (string, required): Конечная дата периода в формате \`YYYY-MM-DD\`.

**Пример запроса:**
\`GET http://192.168.1.10:3000/api/v3/schedule/week?hall=3&from=2024-07-15&to=2024-07-21\`
\`Authorization: Bearer YOUR_API_KEY_HERE\`

**Ответ \`200 OK\`:**
\`\`\`json
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
\`\`\`

---

## 3. Обновление статуса сеанса

Устанавливает новый статус для конкретного сеанса. Сервер должен сохранить это состояние.

- **Endpoint:** \`POST /status\`
- **Метод:** \`POST\`
- **Тело запроса (Body):** \`application/json\`

**Тело запроса:**
\`\`\`json
{
  "session_id": "sess_xyz123",
  "status": "no_keys"
}
\`\`\`

**Возможные значения \`status\`:**
\`ready_hall\`, \`on_storage\`, \`download_hall\`, \`download_storage\`, \`distributor\`, \`no_keys\`, \`no_status\`, \`missing\`.

**Ответ \`200 OK\` (успех):**
\`\`\`json
{
  "success": true,
  "session_id": "sess_xyz123",
  "new_status": "no_keys"
}
\`\`\`
`;

const StatusLegendItem: React.FC<{ statusKey: string }> = ({ statusKey }) => {
    const config = CONTENT_STATUS_CONFIG[statusKey as keyof typeof CONTENT_STATUS_CONFIG];
    return (
        <div className="flex items-center p-4 bg-[#161e2e] rounded-xl border border-slate-700/50">
            <div className={`w-4 h-4 rounded-full ${config.bg} ${config.glow} shadow-lg mr-4 shrink-0`}></div>
            <div className="flex flex-col">
                <span className={`text-base font-bold ${config.color}`}>{config.label}</span>
                <span className="text-xs text-slate-500 font-mono uppercase mt-0.5">{statusKey}</span>
            </div>
        </div>
    );
};

export const HelpView = () => {

    const handleDownloadDocs = () => {
        const blob = new Blob([API_DOCS_CONTENT.trim()], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'CineSchedule_API_v3.md';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <ViewContainer title="Руководство пользователя" icon={HelpCircle}>
            
            <GridSection title="Главная Панель (Dashboard)" cols={1}>
                 <Card>
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="p-4 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                            <LayoutDashboard size={40} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1">Сводка за день</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Главный экран предоставляет ключевую информацию о текущем дне: общее количество сеансов, число критических проблем (отсутствие ключей или контента) и распределение по форматам 2D/3D. Это позволяет быстро оценить готовность кинотеатра.
                            </p>
                        </div>
                    </div>
                 </Card>
            </GridSection>

             <GridSection title="Документация API" cols={1}>
                 <Card>
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">Техническая документация</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                Скачайте актуальную документацию по API для интеграции или разработки собственных инструментов. Файл содержит описание всех эндпоинтов, параметров и примеров ответов.
                            </p>
                        </div>
                        <button 
                            onClick={handleDownloadDocs}
                            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <Download size={20} />
                            <span>Скачать .md файл</span>
                        </button>
                    </div>
                 </Card>
            </GridSection>

            <GridSection title="Ключевые Концепции" cols={2}>
                 <Card>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3"><AlertCircle className="text-amber-400"/>Умные Заголовки</h3>
                    <div className="space-y-4 text-sm text-slate-400">
                        <p><strong className="text-amber-300">Желтый:</strong> Если в зале или в дне есть сеанс с проблемой (например, "Нет ключей" или "Не найдено"), заголовок подсвечивается желтым.</p>
                        <p><strong className="text-emerald-300">Зеленый:</strong> Если проблем нет и хотя бы один сеанс готов к показу ("В зале"), заголовок становится зеленым.</p>
                    </div>
                 </Card>
                 <Card>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3"><Server className="text-cyan-400"/>Режимы Работы</h3>
                     <div className="space-y-4 text-sm text-slate-400">
                        <p><strong className="text-cyan-300">Online Mode:</strong> При указании адреса сервера в настройках, приложение получает "живые" данные о расписании.</p>
                        <p><strong className="text-yellow-300">Mock Mode:</strong> Если адрес сервера не указан, приложение работает в автономном режиме с демонстрационными данными.</p>
                    </div>
                 </Card>
            </GridSection>

            <GridSection title="Управление и Навигация" cols={2}>
                <GestureItem 
                    icon={MousePointer} 
                    title="Копирование текста (Desktop)" 
                    desc="Просто кликните на название фильма или имя DCP-пакета, чтобы скопировать его в буфер обмена. Идеально для поиска." 
                />
                 <GestureItem 
                    icon={Fingerprint} 
                    title="Изменение статуса" 
                    desc="Нажмите на текстовый статус в карточке сеанса (например, 'В зале'), чтобы открыть меню и выбрать новый статус." 
                />
                <GestureItem 
                    icon={Keyboard} 
                    title="Навигация Клавиатурой" 
                    desc="В режиме сетки используйте клавиши ← и → для перемещения между залами или днями." 
                />
                <GestureItem 
                    icon={Move} 
                    title="Индикаторы прокрутки" 
                    desc="Используйте нижний индикатор для быстрой перемотки сетки. Вертикальные списки имеют плавающий скроллбар, который появляется при прокрутке." 
                />
            </GridSection>
            
            <GridSection title="Легенда Статусов" cols={2}>
                {(Object.keys(CONTENT_STATUS_CONFIG) as string[]).map(status => (
                    <StatusLegendItem key={status} statusKey={status} />
                ))}
            </GridSection>
            
        </ViewContainer>
    );
};