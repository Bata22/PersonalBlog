# Lični dnevnik — Bratislav Nikolić

Blog i dnevnik vođen kao RPG. Svaki upis (projekat, trening, planinarenje, knjiga, sviranje, dan u dnevniku) donosi XP grani u kojoj je, a grana raste na stablu veština — limunovom drvetu na kome plodovi sazrevaju od zelenog ka žutom kako raste nivo. Sajt je javni blog, a `/admin` je lični dnevnik u koji upisuje samo vlasnik.

- **Grane i podgrane** po želji (doktorat → ispiti, disertacija; projekti → termalna kamera…), sa beleškom „gde sam stao".
- **XP, nivoi i atributi** (Snaga, Intelekt, Kreativnost, Avantura, Duh) i titula lika po najjačem atributu.
- **Vrste upisa**: objava, mesto (planinarenje, odmor), trening (serije ponavljanja), meč/trening (tenis, odbojka), vežbanje instrumenta, dnevnik.
- **Vizuelni editor** (naslovi, liste, linkovi, slike u tekstu), galerija slika i YouTube linkovi umesto velikih snimaka.
- **Javno ili samo za mene** za svaki upis, knjigu, igru i anime — menja se i kasnije, XP se računa u oba slučaja.
- **Biblioteka**: knjige (Open Library) sa beleškama po poglavljima, igre (RAWG: „assas" → Assassin's Creed), anime uvezen sa MyAnimeList-a.
- **Dnevnik** sa nizom dana zaredom i **podsetnikom** (push obaveštenje u 22h ako dan nije upisan).
- **Telefon**: instalira se kao aplikacija (PWA), slike se smanjuju na telefonu pre slanja.
- **SEO**: statične javne stranice, sitemap, RSS, Open Graph slike i strukturisani podaci.
- **Palete boja** (limun, mint, breskva) koje se menjaju bez diranja komponenti.

## Tehnologije

Next.js 16.4 (App Router, Cache Components), React 19.3, TypeScript, Tailwind CSS 4, Supabase (Postgres, Auth, Storage, pg_cron), Tiptap 3, zod 4, web-push, Vitest. Node 22 ili noviji.

---

## Postavljanje, korak po korak

Treba ti oko pola sata. Sve što je tajno ide u `.env.local` (na računaru) i u podešavanja na Vercelu — **nikad u Git**. `.env.local` je već u `.gitignore`.

### 1. Supabase projekat i baza

1. Napravi projekat: <https://supabase.com/dashboard/new> (region: *Central EU (Frankfurt)* je najbliži).
2. Otvori **SQL Editor** (<https://supabase.com/dashboard/project/_/sql/new>), nalepi ceo fajl `supabase/migrations/20261008120000_sema.sql` i klikni **Run**. Skripta pravi sve tabele, pravila pristupa (RLS), eksplicitne `GRANT`-ove i dva bucket-a za slike. Može da se pokrene ponovo bez štete.
3. Napravi svoj nalog: **Authentication → Users → Add user → Create new user** (<https://supabase.com/dashboard/project/_/auth/users>). Upiši email i lozinku i štikliraj *Auto Confirm User*. **Prvi nalog automatski postaje vlasnik** — jedini koji sme da upisuje.
4. Isključi registraciju: **Authentication → Sign In / Providers → Allow new users to sign up → isključeno** (<https://supabase.com/dashboard/project/_/auth/providers>). Ovo je dodatna zaštita; baza i bez toga nikom osim vlasnika ne dozvoljava upis.

> **Zašto eksplicitni GRANT-ovi?** Supabase od 30. maja 2026. novim projektima, a od 30. oktobra 2026. i postojećim, više ne izlaže nove tabele automatski preko Data API-ja — svaka tabela mora da dobije `GRANT`. Šema to već radi za svaku tabelu, pa radi i na novim i na starim projektima.

### 2. Ključevi u `.env.local`

```bash
cp .env.example .env.local
```

U `.env.example` uz svaku promenljivu piše odakle se uzima. Ukratko:

| Promenljiva | Odakle | Obavezno |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → dugme **Connect** ili **Project Settings → API Keys** (<https://supabase.com/dashboard/project/_/settings/api-keys>) | da |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ista stranica, ključ koji počinje sa `sb_publishable_` | da |
| `SUPABASE_SECRET_KEY` | ista stranica → *Secret keys* → *Create new secret key* (`sb_secret_…`). Koristi ga samo podsetnik, samo na serveru | za podsetnik |
| `NEXT_PUBLIC_SITE_URL` | ostavi prazno dok nemaš svoj domen | ne |
| `RAWG_API_KEY` | <https://rawg.io/apidocs> → *Get API Key* | za igre |
| `MAL_CLIENT_ID` | <https://myanimelist.net/apiconfig> → *Create ID* (App Type: web) | za anime |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | `npm run vapid` (prvi red javni, drugi privatni) | za podsetnik |
| `VAPID_SUBJECT` | `mailto:` + tvoj email | za podsetnik |
| `CRON_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | za podsetnik |

Ključevi sa prefiksom `NEXT_PUBLIC_` vidljivi su u pregledaču i tako je predviđeno (publishable ključ sme da bude javan jer bazu čuvaju RLS pravila).

### 3. Pokretanje na računaru

```bash
npm install
npm run dev
```

Otvori <http://localhost:3000/prijava>, prijavi se nalogom iz koraka 1.3 i na tabli klikni **Posadi početne grane**. Posle ih menjaš u **Grane** kako hoćeš.

### 4. GitHub i Vercel

1. Napravi javni repo i pošalji kod:
   ```bash
   git init && git add . && git commit -m "Lični dnevnik"
   git branch -M main
   git remote add origin https://github.com/Bata22/<ime-repoa>.git
   git push -u origin main
   ```
   Pre prvog push-a proveri da `git status` ne prikazuje `.env.local`.
2. Na Vercelu: <https://vercel.com/new> → *Import* tog repoa → **Environment Variables**: dodaj sve iz `.env.local` (osim praznih) → **Deploy**.
3. Adresa će biti nešto kao `https://<ime-projekta>.vercel.app`. Pošalji je sebi na telefon.

Svaki sledeći `git push` na `main` automatski objavljuje novu verziju. GitHub Actions (`.github/workflows/ci.yml`) na svaki push proveri ranjivosti, lint, tipove, testove i build, a Dependabot jednom nedeljno predloži ažuriranja paketa.

### 5. Podsetnik u 22h

1. Ako već nisi: `npm run vapid`, upiši oba ključa, `VAPID_SUBJECT`, `CRON_SECRET` i `SUPABASE_SECRET_KEY` na Vercelu (*Settings → Environment Variables*), pa **Redeploy**.
2. U `supabase/podsetnik.sql` zameni `TVOJ_SAJT` adresom sajta i `ZAMENI_CRON_SECRET` istom tajnom kao `CRON_SECRET`, pa ga pokreni u SQL Editoru. Supabase cron tada svakog sata pozove sajt, a sajt pošalje obaveštenje samo u sat koji si izabrao u Podešavanjima (podrazumevano 22h) i samo ako dan još nije upisan. Radi i leti i zimi bez pomeranja vremena.
3. Na telefonu otvori sajt i dodaj ga na početni ekran (Android/Chrome: meni → *Instaliraj aplikaciju*; iPhone/Safari: *Podeli → Dodaj na početni ekran*), otvori ga sa početnog ekrana, idi u **Podešavanja → Uključi obaveštenja** i pošalji probno.
4. Ručna provera bez čekanja 22h:
   ```bash
   curl -X POST -H "Authorization: Bearer $CRON_SECRET" "https://<tvoj-sajt>/api/cron/podsetnik?proba=1"
   ```

### 6. Igre i anime

- **Igre**: sa `RAWG_API_KEY` pretraga u **Igre** nalazi igru po delu imena. RAWG traži da se navede izvor, pa je ispod liste igara link „Podaci o igrama: RAWG".
- **Anime**: u **Podešavanjima** upiši MyAnimeList korisničko ime (lista mora da bude javna), pa u **Anime** klikni **Uvezi sa MAL-a**. Prvi uvoz donosi zbirni XP za već odgledano, a kasnije svaki novi završeni anime donosi XP posebno.

---

## Kako se koristi

- **Upiši (+)** u donjoj traci: izaberi granu, popuni formu za tu vrstu upisa, izaberi **Samo za mene** ili **Javno** i sačuvaj. Pri dnu forme se vidi koliko XP-a upis donosi i od čega.
- **Vidljivost** se menja i kasnije, jednim dugmetom na upisu, knjizi, igri ili anime-u. Slike se tada same premeste između privatnog i javnog skladišta.
- **Slike** se na telefonu smanje (najviše 1920 px, WebP) pre slanja. Privatne slike se prikazuju samo tebi, preko privremenih potpisanih linkova.
- **Video**: okači snimak na YouTube (može kao *unlisted*) i nalepi link; na stranici se učitava tek na klik.
- **Dnevnik**: jedan upis po danu; svaki dan zaredom donosi bonus XP.
- **Knjige**: pretraga preko Open Library, status (čitam, pročitano…), ocena, utisak i beleške po poglavljima. Kad knjigu označiš kao pročitanu, dobija se dostignuće.
- **Grane**: dodaj, preimenuj, premesti ili obriši (brisanje je moguće samo ako grana nema upise). Svaka grana ima belešku „gde sam stao".
- **Paleta**: **Podešavanja → Paleta** menja izgled na tom uređaju; za sve posetioce se menja u `src/config/theme.ts`.

## XP i nivoi

Sva pravila su na jednom mestu: `src/config/xp.ts` (osnovni XP po vrsti upisa, bonusi za tekst, slike, video, ponavljanja, minute, kilometre, niz dana i dostignuća). Nivo raste po formuli `ukupno za nivo N = osnova × (N−1) × N / 2`, posebno za lika, grane i atribute. Promena pravila važi za nove upise; već dobijen XP ostaje, kao u igri. XP se uvek računa na serveru, pa ne može da se „namesti" iz pregledača.

## Nova paleta boja

1. U `src/styles/palettes.css` kopiraj blok `limun` (i svetli i tamni deo), promeni ime i boje.
2. U `src/config/theme.ts` dodaj red sa istim `id`-jem.

Komponente koriste samo promenljive iz palete, pa ništa drugo ne treba menjati.

## Struktura projekta

```
src/
  app/                 rute: (sajt) = javni blog, admin = dnevnik, api, sitemap, rss, manifest
  components/          zajednički delovi izgleda (ui, layout)
  config/              podešavanja koja se menjaju ručno: sajt, XP, palete, početne grane
  features/            svaka funkcija u svom folderu (logika, upiti, akcije, komponente)
    branches/          stablo veština, raspored limunovog drveta
    entries/           upisi, forme po vrsti, prikaz
    xp/                računanje XP-a i nivoa, lik, dijagram atributa
    journal/           dnevnik, niz dana, toplotna mapa
    books/ games/ anime/ library/   biblioteka
    media/             smanjivanje, slanje i premeštanje slika
    notifications/     push i podsetnik
    visibility/        javno ↔ samo za mene
    seo/ theme/ auth/ profile/ editor/ admin/
  i18n/sr.ts           svi tekstovi interfejsa na jednom mestu
  lib/                 sitne pomoćne funkcije i Supabase klijenti
  styles/palettes.css  boje
supabase/
  migrations/…_sema.sql   cela šema baze (pokreće se jednom)
  podsetnik.sql           cron za podsetnik (posle prvog deploy-a)
```

## Skripte

| Komanda | Šta radi |
|---|---|
| `npm run dev` | razvojni server na <http://localhost:3000> |
| `npm run build` / `npm start` | produkcijski build i pokretanje |
| `npm run check` | lint + tipovi + testovi + `npm audit` (isto što i CI) |
| `npm test` | testovi (XP, nivoi, stablo, raspored drveta, datumi, niz dana, editor) |
| `npm run vapid` | novi par ključeva za push obaveštenja |
| `npm run db:types` | (opciono) TypeScript tipovi iz baze preko Supabase CLI-ja, uz `SUPABASE_PROJECT_ID` |

## Bezbednost

- **RLS na svakoj tabeli** i eksplicitni `GRANT`-ovi. Upis, izmena i brisanje su dozvoljeni samo vlasniku (prvom nalogu); posetioci čitaju samo ono što je javno.
- **Privatno ostaje privatno**: privatni upisi se ne vide ni u listama, ni u sitemap-u, ni u RSS-u, a privatne slike su u zasebnom bucket-u i dostupne samo vlasniku.
- **Tajni ključevi** su samo na serveru; tajni Supabase ključ koristi isključivo ruta podsetnika, zaštićena `CRON_SECRET`-om.
- **Zaglavlja**: Content-Security-Policy, HSTS, zabrana ugrađivanja u tuđe stranice i ostala standardna zaštita (`next.config.ts`).
- **Sadržaj iz editora** se proverava na serveru i prikazuje kroz sopstveni renderer, bez ubacivanja sirovog HTML-a.
- **`npm audit`: 0 ranjivosti.** Sveži Next 16.4 projekat prijavljuje ranjivost u paketu `braces` (preko `eslint-config-next → @next/eslint-plugin-next → fast-glob`) za koju još nema ispravke. Zato `package.json` ima `overrides` koji tom ESLint dodatku umesto `fast-glob` daje `tinyglobby` (isti API, bez ranjivog paketa). Kad Next izda ispravku, taj `overrides` može da se obriše.

## Ako nešto ne radi

- **Build na Vercelu padne sa porukom da tabela ne postoji** (npr. *Could not find the table 'public.branches'*): SQL iz koraka 1.2 nije pokrenut na tom projektu. Pokreni ga, pa na Vercelu *Deployments → Redeploy*. Build namerno ne prolazi kad baza ne odgovara, da se na sajtu ne bi keširalo prazno stablo.
- **Prijava kaže da su podaci pogrešni**: proveri da korisnik postoji u *Authentication → Users* i da je potvrđen (*Auto Confirm User*).
- **Prijavljen si, ali ne možeš ništa da upišeš**: vlasnik je prvi nalog napravljen posle pokretanja šeme. Ako je slučajno prvi napravljen neki drugi nalog, u SQL Editoru:
  ```sql
  update public.profiles set is_owner = false;
  update public.profiles set is_owner = true
  where id = (select id from auth.users where email = 'tvoj@email.com');
  ```
- **Na iPhone-u nema obaveštenja**: radi samo kad je sajt dodat na početni ekran i otvoren odatle (iOS 16.4 ili noviji).
- **Podsetnik ne stiže**: u SQL Editoru `select * from cron.job_run_details order by start_time desc limit 5;` pokazuje da li se cron pokreće, a `select status_code, content from net._http_response order by created desc limit 5;` šta je sajt odgovorio (401 znači da se `CRON_SECRET` na Vercelu i u SQL-u razlikuju). Ruta sa `?proba=1` (korak 5.4) proverava ključeve za push.

## Kasnije

- **Domen**: na Vercelu *Settings → Domains → Add*, pa `NEXT_PUBLIC_SITE_URL=https://tvoj-domen` i redeploy. Pravi `.io` domen se plaća; besplatne opcije su poddomeni (npr. is-a.dev), a `.com`/`.rs` su jeftini. Sve adrese u sitemap-u, RSS-u i Open Graph slikama se same prilagode.
- **Opšta verzija sa reklamama i Play prodavnica**: Vercel Hobby plan je samo za nekomercijalnu upotrebu, pa verzija sa reklamama traži Pro plan ili drugi hosting. Za Play prodavnicu PWA može da se zapakuje kao Android aplikacija (Trusted Web Activity, npr. preko PWABuilder-a).
- **Supabase Free**: projekat bez aktivnosti nedelju dana može da bude pauziran; vraća se jednim klikom (*Restore*) u dashboard-u.
