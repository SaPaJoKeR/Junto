import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Junto — Plan Together, Experience More',
    template: '%s | Junto',
  },
  description:
    'Создавай активности, голосуй, подтверждай — находи людей для совместных приключений.',
  keywords: ['активности', 'мероприятия', 'голосование', 'встречи', 'совместный отдых'],
  authors: [{ name: 'Junto Team' }],
  openGraph: {
    title: 'Junto — Plan Together, Experience More',
    description: 'Создавай активности, голосуй и находи людей для совместных приключений.',
    type: 'website',
    locale: 'ru_RU',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster>{children}</Toaster>
        </ThemeProvider>
      </body>
    </html>
  )
}
