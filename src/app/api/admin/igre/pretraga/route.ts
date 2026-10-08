import { searchGames } from '@/features/games/catalog'
import { adminSearch } from '@/lib/api'

export async function GET(request: Request) {
  return adminSearch(request, searchGames, 'searchGames')
}
