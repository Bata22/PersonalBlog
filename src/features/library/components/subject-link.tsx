import Link from 'next/link'
import { getPublicAnime } from '@/features/anime/queries'
import { getPublicBooks } from '@/features/books/queries'
import { getPublicGames } from '@/features/games/queries'

type Subject = { book_id: string | null; game_id: string | null; anime_id: string | null }

/** Javna stranica: link ka knjizi/igri/anime-u na koji se beleška odnosi. */
export async function PublicSubjectLink({ entry }: { entry: Subject }) {
  let target: { href: string; label: string; icon: string } | null = null

  if (entry.book_id) {
    const book = (await getPublicBooks()).find((b) => b.id === entry.book_id)
    if (book) target = { href: `/knjige/${book.slug}`, label: book.title, icon: '📕' }
  } else if (entry.game_id) {
    const game = (await getPublicGames()).find((g) => g.id === entry.game_id)
    if (game) target = { href: `/igre/${game.slug}`, label: game.name, icon: '🎮' }
  } else if (entry.anime_id) {
    const anime = (await getPublicAnime()).find((a) => a.id === entry.anime_id)
    if (anime) target = { href: `/anime/${anime.slug}`, label: anime.title, icon: '🌸' }
  }

  if (!target) return null
  return (
    <Link href={target.href} className="inline-flex w-fit items-center gap-1.5 font-semibold text-leaf hover:underline">
      <span aria-hidden>{target.icon}</span>
      {target.label}
    </Link>
  )
}
