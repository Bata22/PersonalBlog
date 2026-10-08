import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/misc'
import { siteConfig } from '@/config/site'
import { getPublicBranchTree } from '@/features/branches/queries'
import { indexBranches } from '@/features/branches/tree'
import { EntryArticle } from '@/features/entries/components/entry-article'
import { getPublicEntry } from '@/features/entries/queries'
import { PublicSubjectLink } from '@/features/library/components/subject-link'
import { resolveMedia } from '@/features/media/server'
import { blogPostingJsonLd, breadcrumbJsonLd, JsonLd } from '@/features/seo/json-ld'
import { t } from '@/i18n/sr'

export async function generateMetadata({ params }: PageProps<'/objave/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const entry = await getPublicEntry(slug)
  if (!entry) return { title: t.errors.notFound, robots: { index: false } }

  const description = entry.excerpt || siteConfig.description
  const path = `/objave/${slug}`
  return {
    title: entry.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      url: path,
      title: entry.title,
      description,
      locale: siteConfig.ogLocale,
      siteName: siteConfig.name,
      publishedTime: entry.published_at ?? entry.created_at,
      modifiedTime: entry.updated_at,
      authors: [siteConfig.author.name],
    },
    twitter: { card: 'summary_large_image', title: entry.title, description },
  }
}

export default function EntryPage({ params }: PageProps<'/objave/[slug]'>) {
  return (
    <div className="mx-auto max-w-3xl">
      <Suspense fallback={<ArticleSkeleton />}>
        {params.then(({ slug }) => (
          <EntryContent slug={slug} />
        ))}
      </Suspense>
      <p className="mt-12">
        <Link href="/objave" className="inline-flex items-center gap-1.5 font-semibold text-ink-soft hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden />
          {t.entries.backToList}
        </Link>
      </p>
    </div>
  )
}

async function EntryContent({ slug }: { slug: string }) {
  const [entry, tree] = await Promise.all([getPublicEntry(slug), getPublicBranchTree()])
  if (!entry) notFound()

  const branches = indexBranches(tree)
  const media = await resolveMedia(entry.media)
  const branch = branches[entry.branch_id]
  const path = `/objave/${entry.slug}`
  const firstImage = entry.media.map((m) => media[m.id]).find(Boolean)

  return (
    <>
      <JsonLd
        data={[
          blogPostingJsonLd({
            title: entry.title,
            description: entry.excerpt,
            path,
            datePublished: entry.published_at ?? entry.created_at,
            dateModified: entry.updated_at,
            image: firstImage?.src,
            section: branch?.name,
          }),
          breadcrumbJsonLd([
            { name: t.entries.title, path: '/objave' },
            ...(branch ? [{ name: branch.name, path: `/grane/${branch.slug}` }] : []),
            { name: entry.title, path },
          ]),
        ]}
      />
      <EntryArticle
        entry={entry}
        branches={branches}
        media={media}
        branchHref={(slug) => `/grane/${slug}`}
        subject={<PublicSubjectLink entry={entry} />}
      />
    </>
  )
}

function ArticleSkeleton() {
  return (
    <div className="grid gap-4" aria-busy="true">
      <Skeleton className="h-7 w-40 rounded-full" />
      <Skeleton className="h-14 w-4/5" />
      <Skeleton className="h-5 w-56" />
      <Skeleton className="mt-6 h-40" />
    </div>
  )
}
