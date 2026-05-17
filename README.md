# Junto — Plan Together, Experience More

Современная платформа для создания, предложения и совместного бронирования активностей.

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Стили | Tailwind CSS + tailwindcss-animate |
| Компоненты | Radix UI primitives + собственные |
| Бэкенд | Next.js API Routes + Server Actions |
| База данных | Supabase (PostgreSQL) |
| Аутентификация | Supabase Auth (Email + Google OAuth) |
| Анимации | Framer Motion |

---

## Быстрый старт

### 1. Клонирование и установка

```bash
cd junto
npm install
```

### 2. Supabase

1. Создай проект на [supabase.com](https://supabase.com)
2. Перейди в **SQL Editor** и выполни весь файл `supabase/schema.sql`
3. Для Google OAuth: **Authentication → Providers → Google** → включи и вставь credentials из Google Cloud Console

### 3. Переменные окружения

```bash
cp .env.local.example .env.local
```

Заполни `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Запуск

```bash
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000)

---

## Структура проекта

```
junto/
├── app/
│   ├── (auth)/              # Страницы без навигации
│   │   ├── login/
│   │   └── register/
│   ├── (app)/               # Защищённые страницы
│   │   ├── layout.tsx       # Navbar + auth guard
│   │   ├── feed/            # Лента активностей
│   │   ├── activities/[id]/ # Детальная страница
│   │   ├── create/          # Создание активности (4 шага)
│   │   └── profile/         # Профиль пользователя
│   ├── api/
│   │   └── activities/[id]/
│   │       ├── vote/        # POST/DELETE голосования
│   │       └── book/        # POST бронирования
│   ├── auth/callback/       # OAuth redirect handler
│   ├── layout.tsx           # Root layout (fonts, theme)
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # Примитивы (Button, Card, Badge...)
│   ├── ActivityCard.tsx     # Карточка активности
│   ├── VotingPanel.tsx      # Голосование с оптимистичным UI
│   ├── Navbar.tsx           # Навигация
│   └── CategoryFilter.tsx   # Фильтр по категориям
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser client
│   │   └── server.ts        # Server component client
│   └── utils.ts             # cn(), CATEGORY_META, форматирование
├── types/index.ts            # TypeScript типы
├── middleware.ts             # Auth guard для /feed, /create, /profile
└── supabase/schema.sql      # Вся БД: таблицы, RLS, триггеры
```

---

## Ключевые функции

### Голосование с оптимистичным UI
`VotingPanel.tsx` обновляет счётчики мгновенно на клиенте и откатывает при ошибке сети.

### Авто-подтверждение
Триггер `check_activity_confirmation` в PostgreSQL автоматически меняет статус активности на `confirmed` когда накапливается нужное число голосов `yes`.

### Row Level Security
Все таблицы защищены политиками RLS — пользователь может редактировать только свои данные.

---

## Подключение ИИ-агентов

### Модерация контента (Claude API)

```typescript
// lib/ai/moderateActivity.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function moderateActivity(title: string, description: string) {
  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `Проверь это объявление о мероприятии на нарушения:
Название: ${title}
Описание: ${description}
Ответь JSON: {"ok": true/false, "reason": "..."}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text) as { ok: boolean; reason: string }
}

// Использование в /api/activities/route.ts перед сохранением:
// const result = await moderateActivity(title, description)
// if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 })
```

### Генерация описаний (GPT-4o)

```typescript
// lib/ai/generateDescription.ts
export async function generateActivityDescription(title: string, category: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Напиши короткое, дружелюбное описание активности для социальной сети.
Название: "${title}". Категория: ${category}. 2-3 предложения, тёплый тон.`,
      }],
      max_tokens: 150,
    }),
  })
  const data = await response.json()
  return data.choices[0].message.content as string
}
```

### Умный подбор участников (векторный поиск)

```sql
-- Добавь в schema.sql:
create extension if not exists vector;

alter table public.profiles
  add column if not exists embedding vector(1536);

-- После генерации эмбеддингов для интересов пользователей:
create index on public.profiles
  using ivfflat (embedding vector_cosine_ops);
```

```typescript
// Найти похожих пользователей для конкретной активности:
const { data } = await supabase.rpc('match_users', {
  query_embedding: activityEmbedding,
  match_threshold: 0.78,
  match_count: 10,
})
```

---

## Деплой на Vercel

```bash
npm install -g vercel
vercel --prod
```

Добавь переменные окружения в Vercel Dashboard.
В Supabase: **Authentication → URL Configuration** → добавь `https://your-app.vercel.app` в Redirect URLs.

---

## TODO / Расширение

- [ ] Real-time уведомления через Supabase Realtime
- [ ] Push-уведомления (Web Push API)
- [ ] Загрузка фото активности (Supabase Storage)
- [ ] Карта (Mapbox/Yandex Maps)
- [ ] Чат внутри активности
- [ ] Telegram-бот для уведомлений
- [ ] Система рейтингов и отзывов
