# Контекст для следующего агента

Учебная система записи барбершопа. Документы продукта: `prd-final.md`, `spec-final.md`, `tasks-final.md`. Работать по этапам из `tasks-final.md`. Не собирать весь MVP одним заходом. Отвечать пользователю на русском, перед правками коротко называть план, после UI-правок проверять страницу.

Скилл движения: `frontend-atlas` установлен глобально (`C:\Users\Administrator\.agents\skills\frontend-atlas` и `C:\Users\Administrator\.claude\skills\frontend-atlas`). Источник: https://github.com/flash-hero/GOATED-UI-SKILL. Читать `SKILL.md` и только нужный рецепт, не весь справочник.

## Статус

Этап 1 закрыт: лендинг на моках, без базы и API.

Этап 2 закрыт: `/book` — мастер на моках (услуга → барбер / «Любой свободный» → дата → время → имя и телефон → подтверждение). Слоты фиксированные, без API. В воскресенье список пустой, 13-е число сначала отвечает ошибкой, «Повторить» грузит слоты. Summary липкий. Hero: фон `public/barber.mp4`, пауза вне экрана и при `prefers-reduced-motion`.

Этап 3 закрыт: Prisma 6.19.3, схема в `prisma/schema.prisma`, миграция `20261005120000_init` применена к Supabase (`aws-0-ap-southeast-1`). Seed: 6 услуг, 3 барбера, 9 связей услуг, 21 строка графика (10:00–21:00, все дни), 9 настроек. В миграции есть exclusion constraint на пересечение подтверждённых записей и RLS без политик. Сайт и `/book` всё ещё на моках.

Этап 4 закрыт: `apps/api` на Fastify, порт 3001. `GET /health`, `GET /api/v1/services`, `GET /api/v1/barbers`, `GET /api/v1/barbers/:id`. Ошибки `VALIDATION` / `NOT_FOUND` / `INTERNAL`. CORS: `CORS_ORIGIN`, плюс `localhost:3000` и `localhost:3010`. Главная и `/book` берут услуги и барберов из API (`apps/web/src/lib/catalog.ts`).

Этап 5 закрыт: слоты считаются в `apps/api/src/slots.ts` (длительность, график, обеды, `time_off`, подтверждённые записи, `min_notice_min`, горизонт). `GET /api/v1/availability` и `/availability/days`, `POST /api/v1/bookings`, страница `/booking/[token]` с отменой и переносом. `barberId=any` берёт первого по `sortOrder`, у кого это окно свободно. Занятый слот — `409 SLOT_TAKEN` (и из проверки, и из `23P01` / `bookings_no_overlap`). Exclusion constraint уже был в миграции этапа 3, вторую миграцию не делали. Prisma в API ходит через `DIRECT_URL`. Сайт зовёт API тем же origin: rewrite `/api/:path*` → `API_URL`. Тесты: `npm test -w api`.

Этап 6 закрыт в коде: `apps/miniapp` (Vite, React, `@twa-dev/sdk`), порт 5173, прокси `/api` → `http://localhost:3001`. Цвета берутся из `themeParams`, запасные — палитра сайта, карминовая полоса остаётся. `POST /api/v1/telegram/auth` проверяет HMAC `initData` токеном `TELEGRAM_BOT_TOKEN` (срок 24 часа). `GET /api/v1/me/bookings` и запись с заголовком `x-telegram-init-data` пишут `source=telegram` и привязывают клиента по `telegramId`. Отмена и перенос идут теми же маршрутами, что сайт. `TELEGRAM_BOT_TOKEN` в `.env` пустой, поэтому внутри Telegram приложение ещё не открывалось.

Этап 7 закрыт в коде: grammY в `apps/api`. `POST /telegram/webhook` принимает обновления, если задан `TELEGRAM_BOT_TOKEN`. Секрет webhook — `TELEGRAM_WEBHOOK_SECRET`. `/start` показывает меню «Записаться» и «Мои записи». Ссылка `t.me/<bot>?start=b_<manageToken>` привязывает чат к гостю. `start=barber_<code>` одноразово пишет `telegram_chat_id` барбера (код выдаёт `issueBarberLink`, сутки). После создания, отмены и переноса клиенту уходит сообщение, барберу — только о новой записи, и только если чат уже известен. На странице записи есть ссылка в Telegram, когда задан `TELEGRAM_BOT_USERNAME`. Токен бота уже в `.env`, username ещё пустой. Webhook на публичный адрес ещё не выставлен.

Этап 8 закрыт в коде: поля напоминаний были в первой миграции. `runReminders` в `apps/api/src/reminders.ts` шлёт напоминание за день (окно 1440±20 мин), за 30 минут, закрывает прошедшие `confirmed` в `completed` и после `review_delay_min` просит отзыв. Повторный запуск не шлёт второе сообщение: сначала `updateMany` по пустому timestamp. Тот же сценарий в `supabase/functions/notifications`: service role, заголовок `x-cron-secret`. Cron `notifications` каждые 5 минут уже в базе, секрет в vault `cron_secret` и в `CRON_SECRET`. Функция ещё не задеплоена: у CLI нет `SUPABASE_ACCESS_TOKEN`.

Этап 9 закрыт: админка `/admin`. Вход `POST /api/v1/admin/login`, пароль Argon2id (`hash-wasm`), сессия в httpOnly cookie `polosa_admin` на 14 дней. После 8 неудач за 15 минут — `429`. Первый администратор создаётся при старте API из `ADMIN_LOGIN` / `ADMIN_PASSWORD`, если таблица пустая. Разделы: сегодня, записи (создать, перенести, отменить, статус), услуги, барберы, фото и портфолио в Supabase Storage (`media`), график и обед, исключения, отзывы (`isPublic`), настройки. Услугу или барбера с записями нельзя стереть: они скрываются.

Этап 10 закрыт: `/admin/analytics`. Период `from`/`to` включительно, границы суток в часовом поясе из настроек. Выручка и деньги по услугам — только `completed`. Число записей — все статусы. Загрузка барбера — минуты `confirmed` и `completed` к минутам смены без обеда и `time_off` (в том числе закрытие салона). Тепловая карта — день недели и час старта тех же визитов. Возвращаемость — клиенты с завершённым визитом в периоде, у которых есть ещё один завершённый визит до конца периода. Маршруты: `GET /api/v1/admin/analytics/revenue|services|load|heatmap|cancellations|retention`.

Этап 11 не начат: деплой.

Секреты в `.env`, в git не коммитить. Образец ключей: `.env.example`.

## Как запустить

Корень: `D:\Миша\15-00\barber`.

```bash
npm run dev:api      # Fastify, apps/api, порт 3001, читает корневой .env
npm run dev          # Next.js, apps/web
npm run dev:miniapp  # Vite, apps/miniapp, порт 5173
npm run lint
npm run build
```

`create-next-app` в этом пути с кириллицей не пишет файлы. Каркас Next собирался вручную.

На Windows Chrome `--window-size` меньше ~500px обрезает скриншот и не совпадает с CSS viewport. Для проверки узкой ширины нужен Playwright viewport, не флаг окна.

Последний production-сервер поднимался как `npx next start -p 3000` из `apps/web`. Перед новой сборкой его надо остановить: он держит порт 3000.

## Стек сейчас

npm workspaces, одно приложение `apps/web`.

- Next.js 16.3.8, React 19.3.0, TypeScript 5.9.3
- App Router, CSS Modules, без Tailwind
- ESLint 9, flat config: `apps/web/eslint.config.mjs` импортирует `eslint-config-next/core-web-vitals` и `typescript`. Старый `FlatCompat` + `@eslint/eslintrc` с Next 16 падает.
- `playwright-core` стоит в devDependencies `web` ради motion-audit. Браузеры Playwright не скачивались: аудит берёт системный Chrome.

Дальше по спеке остаются `packages/ui` и `packages/shared`. `apps/api`, `apps/miniapp` и `supabase/functions/notifications` уже есть.

## Бренд и направление

Барбершоп «Полоса», Ташкент, Юнусабад, ул. Ахмада Дониша, 2. Телефон `+998 71 200 15 00`. Часы 10:00–21:00. Часовой пояс продукта `Asia/Tashkent`, язык MVP русский.

Направление: тихая роскошь, не портфолио разработчика и не dark-tech. Один акцент — карминовая полоса слева (`body::before`, 6px). Шрифты: Unbounded (заголовки) и Manrope (текст), кириллица через `next/font`.

Цвета в `apps/web/src/app/globals.css`:

- светлая: фон `#eef1f4`, карточка `#ffffff`, текст `#16181d`, приглушённый `#5c6570`, линия `#d5dbe3`, акцент `#b4232a`
- тёмная: фон `#121418`, карточка `#1c1f26`, текст `#f2f3f5`, акцент `#e15b62`
- полоса барберов всегда тёмная: `--band` / `--band-ink`

Тема: инлайн-скрипт в `layout.tsx` ставит `data-theme` до отрисовки (`localStorage` ключ `polosa-theme`, иначе `prefers-color-scheme`). Кнопка в шапке подписана «Тема».

Движение, пресет luxury, появление укорочено, чтобы заголовок читался быстрее 1.2 с:

- `--m-dur-reveal: 900ms`, `--m-stagger: 90ms`, `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`
- переход страниц: уход 150ms, приход 250ms, сдвиг 420ms
- нажатие кнопки: `translateY(1px)` за 160ms

## Что есть на сайте

Моки: `apps/web/src/data/mock.ts` (`shop`, `services`, `barbers`, `reviews`, `dayExample`, `bookingSteps`). Формат цены и ссылки карты: `apps/web/src/lib/format.ts`.

Главная `/`:

- шапка: логотип, якоря, «Записаться», на узкой ширине «Меню» + «Тема»
- герой: видео `barber.mp4` на фоне, город, заголовок, текст, CTA, пример пятницы (это иллюстрация, не живые слоты)
- услуги: список с длительностью и ценой, не карточки
- барберы: стопка sticky-карточек
- отзывы: один крупный и два коротких, публичные от 4
- контакты и iframe OpenStreetMap
- подвал

`/book`: мастер пишет в базу. Summary слева на узкой ширине и справа на широкой, `position: sticky`. После «Записать» переход на `/booking/[token]`.

## Движение, которое уже стоит

Один жест на страницу. Стопка барберов, не герой.

- `apps/web/src/components/LineReveal.tsx` — две строки заголовка. Для скринридера целая фраза в `.sr-only`, визуальные строки `aria-hidden`. Маска в `LineReveal.module.css`. При `prefers-reduced-motion` анимации нет, текст сразу виден.
- `apps/web/src/components/Barbers.tsx` — рецепт stacking cards: `position: sticky`, `view-timeline`, scale и затемнение только внутри `@supports (animation-timeline: view())` и `prefers-reduced-motion: no-preference`. Без GSAP `pin`, чтобы не ловить CLS.
- `apps/web/src/components/PageSlide.tsx` — `<ViewTransition>` из React 19.3. Стоит в `page.tsx` и `book/page.tsx`, не в layout: layout не монтируется заново. Ссылки «Записаться» несут `transitionTypes={["nav-forward"]}`, логотип и «Контакты» с `/book` — `nav-back`. Якорные ссылки на той же странице без типа перехода.
- Типы `ViewTransition` в стабильном `@types/react` нет, рантайм React 19.3 их экспортирует. Объявление: `apps/web/src/types/react-view-transition.d.ts`.

Сознательно не делали, хотя промпт скилла это перечислял:

- Lenis и приколотый герой с зумом. `pin: true` в Chromium даёт CLS; на странице записи скролл не перехватываем.
- Шейдер. Для барбершопа достаточно полосы. WebGL тут не нужен.
- Отдельные токены «портфолио разработчика». Продукт — барбершоп.

Аудит `frontend-atlas/scripts/motion-audit.mjs` по `http://localhost:3000`, ширины 1440 и 390, обычное движение и reduced motion: CLS 0, горизонтальный вылет 0, ошибки консоли 0, скрытый текст 0. Кадры лежали во временной папке, в репозиторий не клались. Клик «Записаться» открывает `/book` без pageerror.

## Куда смотреть в коде

```text
apps/web/src/app/layout.tsx          шапка, подвал, тема, шрифты
apps/web/src/app/globals.css         токены, кнопки, view transitions
apps/web/src/app/page.tsx            главная
apps/web/src/app/book/page.tsx       мастер записи
apps/web/src/components/*            секции
```

Шапка, видео в герое и мастер записи — клиентские. Остальные секции серверные.

## Следующий шаг: этап 11

Деплой. Логин владельца — `ADMIN_LOGIN` в `.env`, пароль — `ADMIN_PASSWORD`. Перед живыми напоминаниями ещё задеплоить `supabase/functions/notifications`.

Повторный seed: `npx prisma db seed` из корня. На Windows команда в `package.json` зовёт `node ./node_modules/tsx/dist/cli.mjs`. Тесты API: `npm test -w api`.
