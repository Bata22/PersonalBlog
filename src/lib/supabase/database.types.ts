/**
 * Tipovi baze, u istom obliku koji pravi `supabase gen types`.
 * Kad menjaš šemu, regeneriši ih:  npm run db:types   (vidi README)
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13'
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          is_owner: boolean
          display_name: string
          headline: string | null
          bio: string | null
          avatar_path: string | null
          show_stats_publicly: boolean
          timezone: string
          reminder_enabled: boolean
          reminder_hour: number
          mal_username: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          is_owner?: boolean
          display_name?: string
          headline?: string | null
          bio?: string | null
          avatar_path?: string | null
          show_stats_publicly?: boolean
          timezone?: string
          reminder_enabled?: boolean
          reminder_hour?: number
          mal_username?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string
          headline?: string | null
          bio?: string | null
          avatar_path?: string | null
          show_stats_publicly?: boolean
          timezone?: string
          reminder_enabled?: boolean
          reminder_hour?: number
          mal_username?: string | null
        }
        Relationships: []
      }
      branches: {
        Row: {
          id: string
          owner_id: string
          parent_id: string | null
          slug: string
          name: string
          description: string | null
          icon: string
          attribute: Database['public']['Enums']['rpg_attribute'] | null
          entry_kind: Database['public']['Enums']['entry_kind']
          role: 'books' | 'games' | 'anime' | 'journal' | null
          focus_note: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string
          parent_id?: string | null
          slug: string
          name: string
          description?: string | null
          icon?: string
          attribute?: Database['public']['Enums']['rpg_attribute'] | null
          entry_kind?: Database['public']['Enums']['entry_kind']
          role?: 'books' | 'games' | 'anime' | 'journal' | null
          focus_note?: string | null
          position?: number
        }
        Update: {
          parent_id?: string | null
          slug?: string
          name?: string
          description?: string | null
          icon?: string
          attribute?: Database['public']['Enums']['rpg_attribute'] | null
          entry_kind?: Database['public']['Enums']['entry_kind']
          role?: 'books' | 'games' | 'anime' | 'journal' | null
          focus_note?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: 'branches_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'branches'
            referencedColumns: ['id']
          },
        ]
      }
      entries: {
        Row: {
          id: string
          owner_id: string
          branch_id: string
          kind: Database['public']['Enums']['entry_kind']
          title: string
          slug: string
          content: Json | null
          excerpt: string | null
          metadata: Json
          video_urls: string[]
          is_public: boolean
          xp: number
          occurred_on: string
          book_id: string | null
          game_id: string | null
          anime_id: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string
          branch_id: string
          kind?: Database['public']['Enums']['entry_kind']
          title: string
          slug: string
          content?: Json | null
          excerpt?: string | null
          metadata?: Json
          video_urls?: string[]
          is_public?: boolean
          xp?: number
          occurred_on?: string
          book_id?: string | null
          game_id?: string | null
          anime_id?: string | null
        }
        Update: {
          branch_id?: string
          kind?: Database['public']['Enums']['entry_kind']
          title?: string
          slug?: string
          content?: Json | null
          excerpt?: string | null
          metadata?: Json
          video_urls?: string[]
          is_public?: boolean
          xp?: number
          occurred_on?: string
          book_id?: string | null
          game_id?: string | null
          anime_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'entries_branch_id_fkey'
            columns: ['branch_id']
            isOneToOne: false
            referencedRelation: 'branches'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'entries_book_id_fkey'
            columns: ['book_id']
            isOneToOne: false
            referencedRelation: 'books'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'entries_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'entries_anime_id_fkey'
            columns: ['anime_id']
            isOneToOne: false
            referencedRelation: 'anime'
            referencedColumns: ['id']
          },
        ]
      }
      media: {
        Row: {
          id: string
          owner_id: string
          entry_id: string | null
          bucket: 'media-public' | 'media-private'
          path: string
          thumb_path: string
          width: number
          height: number
          bytes: number
          alt: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          owner_id?: string
          entry_id?: string | null
          bucket: 'media-public' | 'media-private'
          path: string
          thumb_path: string
          width: number
          height: number
          bytes: number
          alt?: string | null
          position?: number
        }
        Update: {
          entry_id?: string | null
          bucket?: 'media-public' | 'media-private'
          alt?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: 'media_entry_id_fkey'
            columns: ['entry_id']
            isOneToOne: false
            referencedRelation: 'entries'
            referencedColumns: ['id']
          },
        ]
      }
      books: {
        Row: {
          id: string
          owner_id: string
          slug: string
          title: string
          authors: string[]
          cover_url: string | null
          openlibrary_key: string | null
          isbn: string | null
          pages: number | null
          first_published: number | null
          status: Database['public']['Enums']['book_status']
          rating: number | null
          started_on: string | null
          finished_on: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string
          slug: string
          title: string
          authors?: string[]
          cover_url?: string | null
          openlibrary_key?: string | null
          isbn?: string | null
          pages?: number | null
          first_published?: number | null
          status?: Database['public']['Enums']['book_status']
          rating?: number | null
          started_on?: string | null
          finished_on?: string | null
          is_public?: boolean
        }
        Update: Partial<Omit<Database['public']['Tables']['books']['Insert'], 'id' | 'owner_id'>>
        Relationships: []
      }
      games: {
        Row: {
          id: string
          owner_id: string
          slug: string
          name: string
          cover_url: string | null
          released: string | null
          platforms: string[]
          source: 'rawg' | 'rucno'
          external_id: string | null
          status: Database['public']['Enums']['game_status']
          rating: number | null
          hours_played: number | null
          started_on: string | null
          finished_on: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string
          slug: string
          name: string
          cover_url?: string | null
          released?: string | null
          platforms?: string[]
          source?: 'rawg' | 'rucno'
          external_id?: string | null
          status?: Database['public']['Enums']['game_status']
          rating?: number | null
          hours_played?: number | null
          started_on?: string | null
          finished_on?: string | null
          is_public?: boolean
        }
        Update: Partial<Omit<Database['public']['Tables']['games']['Insert'], 'id' | 'owner_id'>>
        Relationships: []
      }
      anime: {
        Row: {
          id: string
          owner_id: string
          slug: string
          mal_id: number | null
          title: string
          image_url: string | null
          status: Database['public']['Enums']['anime_status']
          score: number | null
          episodes_watched: number
          episodes_total: number | null
          mal_updated_at: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string
          slug: string
          mal_id?: number | null
          title: string
          image_url?: string | null
          status?: Database['public']['Enums']['anime_status']
          score?: number | null
          episodes_watched?: number
          episodes_total?: number | null
          mal_updated_at?: string | null
          is_public?: boolean
        }
        Update: Partial<Omit<Database['public']['Tables']['anime']['Insert'], 'id' | 'owner_id'>>
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          owner_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          created_at: string
          last_sent_at: string | null
        }
        Insert: {
          id?: string
          owner_id?: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
        }
        Update: {
          p256dh?: string
          auth?: string
          user_agent?: string | null
          last_sent_at?: string | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_owner: { Args: never; Returns: boolean }
      xp_by_branch: {
        Args: never
        Returns: { branch_id: string; xp: number; entry_count: number; last_on: string }[]
      }
    }
    Enums: {
      entry_kind: 'post' | 'place' | 'workout' | 'session' | 'practice' | 'journal' | 'milestone'
      rpg_attribute: 'snaga' | 'intelekt' | 'kreativnost' | 'avantura' | 'duh'
      book_status: 'zelim' | 'citam' | 'procitano' | 'odustao'
      game_status: 'zelim' | 'igram' | 'presao' | 'odustao'
      anime_status: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch'
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T]
