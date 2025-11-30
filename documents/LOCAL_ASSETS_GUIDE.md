# Руководство по локализации ассетов для CineSchedule

Это руководство объясняет, как модифицировать проект CineSchedule для использования локальных шрифтов, иконок и стилей, чтобы обеспечить полную автономную работу приложения без зависимости от внешних CDN.

## Шаг 1: Локализация шрифтов (Google Fonts)

В текущей конфигурации шрифты "Inter" и "Roboto Mono" загружаются из Google Fonts через `@import` в `styles.css`.

1.  **Скачайте шрифты:**
    *   Перейдите на [Google Fonts](https://fonts.google.com/).
    *   Найдите и скачайте семейства шрифтов:
        *   `Inter` (рекомендуемые начертания: 400, 500, 600, 700)
        *   `Roboto Mono` (рекомендуемые начертания: 400, 500, 700)

2.  **Создайте локальную папку:**
    *   В корне проекта создайте папку `assets/fonts/`.
    *   Распакуйте архивы со шрифтами и скопируйте файлы (`.woff2` или `.ttf`) в созданную папку.

3.  **Обновите `styles.css`:**
    *   Откройте файл `styles.css`.
    *   **Удалите** следующую строку в начале файла:
        ```css
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;700&display=swap');
        ```
    *   **Добавьте** вместо неё правила `@font-face` для локальных файлов. Пример для одного начертания:
        ```css
        /* Пример для Inter Regular (400) */
        @font-face {
          font-family: 'Inter';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url('/assets/fonts/Inter-Regular.woff2') format('woff2');
        }

        /* Пример для Roboto Mono Regular (400) */
        @font-face {
          font-family: 'Roboto Mono';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url('/assets/fonts/RobotoMono-Regular.woff2') format('woff2');
        }
        
        /* ...повторите для всех необходимых начертаний... */
        ```
    *   Убедитесь, что пути в `url()` соответствуют именам ваших файлов.

## Шаг 2: Локализация зависимостей (Tailwind, Lucide)

В текущей конфигурации `index.html` загружает Tailwind CSS и `lucide-react` через CDN. Для полной автономности их необходимо заменить на локальные версии, что требует использования системы сборки (например, Vite или Webpack).

### Рекомендуемый подход (с использованием Node.js и npm)

1.  **Инициализируйте проект:**
    *   Установите [Node.js](https://nodejs.org/).
    *   В корне проекта выполните `npm init -y` для создания `package.json`.

2.  **Установите Tailwind CSS:**
    *   Следуйте официальной [инструкции по установке Tailwind CSS CLI](https://tailwindcss.com/docs/installation).
    *   Это включает установку `tailwindcss`, создание `tailwind.config.js` и запуск CLI для генерации файла `output.css`.
    *   Замените CDN-скрипт Tailwind в `index.html` на ссылку на ваш локальный `output.css`:
        ```html
        <link href="/dist/output.css" rel="stylesheet">
        ```

3.  **Локализация JavaScript-модулей:**
    *   Для управления зависимостями, такими как `react` и `lucide-react`, рекомендуется использовать сборщик. Он автоматически скачает все необходимые пакеты в папку `node_modules` и создаст один или несколько бандлов для вашего приложения.
    *   Удалите `<script type="importmap">` из `index.html`.
    *   Настройте сборщик (например, Vite) для обработки вашего `index.tsx` и подключения сгенерированного JS-файла в `index.html`.

Этот подход является стандартом для современных веб-приложений и обеспечивает наилучшую производительность и надежность, включая полную автономную работу.
