/** Znak sajta: limun sa listom (isti oblik kao plodovi na stablu). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <ellipse cx="15" cy="18" rx="11" ry="9" transform="rotate(-28 15 18)" fill="var(--ripe)" stroke="var(--bark)" strokeWidth="1.4" />
      <circle cx="24.6" cy="12.6" r="1.6" fill="var(--ripe)" stroke="var(--bark)" strokeWidth="1.2" />
      <path d="M21 7.5c2.6-3.4 6.4-3.6 8-3-1 2.8-4 5-8 3Z" fill="var(--unripe)" stroke="var(--bark)" strokeWidth="1.1" />
    </svg>
  )
}
