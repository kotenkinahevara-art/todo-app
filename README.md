# Todo App

Минималистичное фронтенд‑приложение для управления задачами. Работает полностью в браузере, хранит данные в localStorage и не требует бекенда.

## Возможности

- Добавление, редактирование и удаление задач
- Отметка выполнения
- Дата и время выполнения через календарь
- Приоритет задачи (high/medium/low)
- Переключение языка интерфейса (RU/EN)
- Сохранение данных в localStorage

## Стек

- HTML5
- SCSS (Sass)
- JavaScript (ES6+)
- flatpickr

## Быстрый старт
Демонстрация: https://kotenkinahevara-art.github.io/todo-app/

```bash
npm install
npm run css:build
```

Откройте `index.html` в браузере.

## Скрипты

- `npm run css:build` — сборка стилей из `styles/main.scss` в `styles/main.css`
- `npm run css:watch` — режим наблюдения за изменениями SCSS

## Структура проекта

```
.
├─ index.html
├─ styles/
│  ├─ main.scss
│  └─ main.css
├─ scripts/
├─ images/
├─ icons/
└─ fonts/
```

## Автор

Варвара Симонова — Frontend Dev

## Лицензия

ISC
