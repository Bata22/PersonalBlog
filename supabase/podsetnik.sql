-- =====================================================================
--  Podsetnik u 22:00 — pokreni TEK POSLE prvog deploy-a na Vercel.
--
--  Pre pokretanja zameni dve vrednosti ispod:
--    TVOJ_SAJT            → adresa sajta, npr. https://licni-blog.vercel.app
--    ZAMENI_CRON_SECRET   → ista vrednost kao CRON_SECRET u Vercel env
--
--  Kako radi: Supabase pg_cron na početku svakog sata pozove
--  /api/cron/podsetnik. Ruta sama proveri da li je kod tebe (Beograd)
--  upravo sat koji si izabrao u Podešavanjima (podrazumevano 22h) — tako
--  radi i leti i zimi, i kad promeniš sat, bez diranja ovog SQL-a.
--  Ako je dnevnik za danas već upisan, notifikacija se ne šalje.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Tajna se čuva u Supabase Vault-u, ne u kodu.
do $$
declare
  v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'podsetnik_cron_secret';
  if v_id is null then
    perform vault.create_secret('ZAMENI_CRON_SECRET', 'podsetnik_cron_secret',
                                'Tajna za /api/cron/podsetnik');
  else
    perform vault.update_secret(v_id, 'ZAMENI_CRON_SECRET');
  end if;
end $$;

-- Ako posao sa ovim imenom već postoji, cron.schedule ga ažurira.
select cron.schedule(
  'podsetnik-dnevnik',
  '0 * * * *',
  $job$
    select net.http_post(
      url     := 'TVOJ_SAJT/api/cron/podsetnik',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret from vault.decrypted_secrets
          where name = 'podsetnik_cron_secret'
        )
      ),
      body    := '{}'::jsonb,
      timeout_milliseconds := 10000
    );
  $job$
);

-- Provera: poslednja izvršavanja (pokreni sutradan)
-- select * from cron.job_run_details order by start_time desc limit 5;
-- Gašenje podsetnika:
-- select cron.unschedule('podsetnik-dnevnik');
