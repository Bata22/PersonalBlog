import { searchBooks } from '@/features/books/openlibrary'
import { adminSearch } from '@/lib/api'

export async function GET(request: Request) {
  return adminSearch(request, searchBooks, 'searchBooks')
}
