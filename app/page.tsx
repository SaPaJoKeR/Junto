import Link from 'next/link'
import { ArrowRight, Sparkles, Star, Zap, Globe } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

// Mock preview cards for the hero section
const PREVIEW_CARDS = [
  {
    emoji: '⚽', title: 'Футбол в парке Горького',
    date: 'Сб, 24 мая • 10:00', votes: { yes: 7, need: 10 },
    gradient: 'from-blue-500 to-cyan-400', cat: 'Спорт',
  },
  {
    emoji: '🍕', title: 'Ужин в новом итальянском',
    date: 'Пт, 23 мая • 19:30', votes: { yes: 4, need: 5 },
    gradient: 'from-orange-500 to-red-400', cat: 'Еда',
  },
  {
    emoji: '🎭', title: 'Театр Маяковского — «Гамлет»',
    date: 'Вс, 25 мая • 18:00', votes: { yes: 6, need: 6 },
    gradient: 'from-purple-500 to-pink-400', cat: 'Культура',
  },
]

const FEATURES = [
  {
    icon: '💡',
    title: 'Предложи идею',
    description: 'Создай активность за 2 минуты — добавь описание, дату, место и желаемое число участников.',
  },
  {
    icon: '🗳️',
    title: 'Голосуй «Да / Нет / Может»',
    description: 'Друзья и незнакомцы голосуют. Красивый прогресс-бар показывает, насколько близко подтверждение.',
  },
  {
    icon: '🎉',
    title: 'Вперёд вместе!',
    description: 'Когда набирается нужное число голосов — активность подтверждена. Бронируй время и встречайся!',
  },
]

const STATS = [
  { value: '12 000+', label: 'активностей создано' },
  { value: '48 000+', label: 'участников нашли друг друга' },
  { value: '94%', label: 'подтверждённых встреч состоялись' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 overflow-x-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-white font-black text-sm">J</span>
            </div>
            <span className="font-black text-xl bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
              Junto
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#features" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Как работает</a>
            <a href="#activities" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Примеры</a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 px-4 py-2 transition-colors"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:from-violet-500 hover:to-indigo-500 transition-all"
            >
              Начать
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 sm:py-32 hero-glow">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 dark:opacity-20" />

        {/* Floating blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-300/20 dark:bg-violet-700/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-700/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-semibold mb-6 border border-violet-200 dark:border-violet-800">
                <Sparkles className="h-4 w-4" />
                Новый способ организовывать встречи
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 text-balance">
                <span className="text-zinc-900 dark:text-white">Планируй </span>
                <span className="gradient-text">вместе</span>
                <span className="text-zinc-900 dark:text-white">,{'\n'}живи </span>
                <span className="relative inline-block">
                  <span className="text-zinc-900 dark:text-white">ярче</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                    <path d="M2 9 C50 3, 150 3, 198 9" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Предложи активность — прогулку, ужин, поход, игру. Другие голосуют.
                Когда набирается компания — встречайтесь!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-base shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:from-violet-500 hover:to-indigo-500 transition-all group"
                >
                  Создать активность
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/feed"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-base hover:border-violet-300 hover:text-violet-700 dark:hover:text-violet-300 transition-all"
                >
                  Смотреть ленту
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 mt-8 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {['🧑‍💻','👩‍🎨','🧑‍🍳','👩‍🚀','🧑‍🎤'].map((e, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center text-sm border-2 border-white dark:border-zinc-950">
                      {e}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">48 000+</span> участников
                  </p>
                </div>
              </div>
            </div>

            {/* Right: preview cards */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-[480px]">
                {PREVIEW_CARDS.map((card, i) => (
                  <div
                    key={i}
                    className="absolute w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/80 dark:border-zinc-700/80 overflow-hidden animate-float"
                    style={{
                      top: `${i * 120}px`,
                      left: i === 1 ? '100px' : i === 2 ? '30px' : '0px',
                      animationDelay: `${i * 0.8}s`,
                      zIndex: 3 - i,
                    }}
                  >
                    <div className={`h-1.5 bg-gradient-to-r ${card.gradient}`} />
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                          {card.emoji} {card.cat}
                        </span>
                        {card.votes.yes >= card.votes.need ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                            ✓ Подтверждено
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                            Голосование
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1 line-clamp-1">
                        {card.title}
                      </p>
                      <p className="text-xs text-zinc-500 mb-3">{card.date}</p>
                      {/* Mini progress */}
                      <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${card.gradient} transition-all`}
                          style={{ width: `${Math.min(100, (card.votes.yes / card.votes.need) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-zinc-400">
                        <span>👍 {card.votes.yes} Да</span>
                        <span>{card.votes.yes}/{card.votes.need}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-zinc-100 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {STATS.map((stat, i) => (
              <div key={i}>
                <div className="text-4xl font-black gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features / How it works */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-semibold mb-4">
              <Zap className="h-4 w-4" />
              Просто и понятно
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-white mb-4">
              Как это работает?
            </h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
              Три шага — и компания собрана.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="relative p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-violet-500/30">
                  {i + 1}
                </div>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">{f.icon}</div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories showcase */}
      <section id="activities" className="py-20 bg-zinc-50 dark:bg-zinc-900/30 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-zinc-900 dark:text-white mb-3">
              Любая активность — здесь
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">От дворового футбола до поездки в горы</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { emoji: '⚽', name: 'Спорт', gradient: 'from-blue-500 to-cyan-400', count: '2 400+' },
              { emoji: '🍕', name: 'Еда & Кафе', gradient: 'from-orange-500 to-red-400', count: '1 800+' },
              { emoji: '🎭', name: 'Культура', gradient: 'from-purple-500 to-pink-400', count: '950+' },
              { emoji: '🌿', name: 'Природа', gradient: 'from-green-500 to-teal-400', count: '1 200+' },
              { emoji: '📚', name: 'Обучение', gradient: 'from-indigo-500 to-violet-400', count: '780+' },
              { emoji: '✈️', name: 'Путешествия', gradient: 'from-sky-500 to-blue-400', count: '620+' },
              { emoji: '🎮', name: 'Игры', gradient: 'from-yellow-500 to-orange-400', count: '1 100+' },
              { emoji: '🎉', name: 'Вечеринки', gradient: 'from-pink-500 to-rose-400', count: '890+' },
            ].map((cat, i) => (
              <Link
                key={i}
                href={`/feed?category=${cat.name.toLowerCase()}`}
                className="group p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-center"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                  {cat.emoji}
                </div>
                <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{cat.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{cat.count} активностей</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="text-5xl mb-4">🚀</div>
              <h2 className="text-4xl font-black mb-4">Готов к первой активности?</h2>
              <p className="text-violet-200 text-lg mb-8 max-w-md mx-auto">
                Регистрируйся за 30 секунд и предложи свою идею уже сегодня
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-violet-700 font-bold text-base hover:bg-violet-50 transition-colors shadow-xl"
                >
                  Создать аккаунт бесплатно
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200/60 dark:border-zinc-800/60 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">J</span>
            </div>
            <span className="font-black text-lg bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
              Junto
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            © 2025 Junto. Plan Together, Experience More.
          </p>
          <div className="flex items-center gap-1 text-sm text-zinc-400">
            <Globe className="h-4 w-4" />
            Везде, где есть люди
          </div>
        </div>
      </footer>
    </div>
  )
}
