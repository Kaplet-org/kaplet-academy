-- ============================================================
-- KAPLET ACADEMY — Setup Database Supabase
-- Incolla questo SQL in Supabase → SQL Editor → Run
-- ============================================================

-- 1. TECNICI
create table if not exists public.tecnici (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text not null,
  cognome text not null,
  ruolo text not null,
  email text not null unique,
  avatar text generated always as (upper(left(nome,1) || left(cognome,1))) stored,
  data_ingresso date default current_date,
  is_admin boolean default false,
  creato_il timestamptz default now()
);

-- 2. CERTIFICAZIONI
create table if not exists public.certificazioni (
  id uuid default gen_random_uuid() primary key,
  tech_id uuid references public.tecnici(id) on delete cascade not null,
  brand text not null,
  corso text not null,
  data_conseguimento date not null,
  data_scadenza date,
  documento_url text,
  note text,
  stato text default 'attiva' check (stato in ('attiva','scaduta')),
  inserita_il timestamptz default now()
);

-- 3. INDICI
create index if not exists idx_cert_tech_id on public.certificazioni(tech_id);
create index if not exists idx_cert_scadenza on public.certificazioni(data_scadenza);
create index if not exists idx_cert_brand on public.certificazioni(brand);
create index if not exists idx_cert_stato on public.certificazioni(stato);

-- 4. ROW LEVEL SECURITY
alter table public.tecnici enable row level security;
alter table public.certificazioni enable row level security;

-- Drop policy se esistono già (per re-run sicuro)
drop policy if exists "tecnico_vede_se_stesso" on public.tecnici;
drop policy if exists "admin_vede_tutti" on public.tecnici;
drop policy if exists "tecnico_aggiorna_se_stesso" on public.tecnici;
drop policy if exists "tecnico_vede_sue_cert" on public.certificazioni;
drop policy if exists "tecnico_inserisce_cert" on public.certificazioni;
drop policy if exists "tecnico_aggiorna_cert" on public.certificazioni;
drop policy if exists "tecnico_elimina_cert" on public.certificazioni;
drop policy if exists "admin_vede_tutte_cert" on public.certificazioni;
drop policy if exists "admin_gestisce_cert" on public.certificazioni;

-- POLICY TECNICI
create policy "tecnico_vede_se_stesso"
  on public.tecnici for select
  using (auth.uid() = id);

create policy "admin_vede_tutti"
  on public.tecnici for select
  using (
    exists (
      select 1 from public.tecnici t
      where t.id = auth.uid() and t.is_admin = true
    )
  );

create policy "tecnico_aggiorna_se_stesso"
  on public.tecnici for update
  using (auth.uid() = id);

-- POLICY CERTIFICAZIONI
create policy "tecnico_vede_sue_cert"
  on public.certificazioni for select
  using (auth.uid() = tech_id);

create policy "tecnico_inserisce_cert"
  on public.certificazioni for insert
  with check (auth.uid() = tech_id);

create policy "tecnico_aggiorna_cert"
  on public.certificazioni for update
  using (auth.uid() = tech_id);

create policy "tecnico_elimina_cert"
  on public.certificazioni for delete
  using (auth.uid() = tech_id);

create policy "admin_vede_tutte_cert"
  on public.certificazioni for select
  using (
    exists (
      select 1 from public.tecnici t
      where t.id = auth.uid() and t.is_admin = true
    )
  );

create policy "admin_gestisce_cert"
  on public.certificazioni for all
  using (
    exists (
      select 1 from public.tecnici t
      where t.id = auth.uid() and t.is_admin = true
    )
  );

-- 5. STORAGE per documenti certificazioni
insert into storage.buckets (id, name, public)
values ('certificati', 'certificati', false)
on conflict (id) do nothing;

-- Policy storage: tecnico carica solo i suoi file
create policy "tecnico_upload_cert"
  on storage.objects for insert
  with check (
    bucket_id = 'certificati' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "tecnico_vede_sue_file"
  on storage.objects for select
  using (
    bucket_id = 'certificati' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "admin_vede_tutti_file"
  on storage.objects for select
  using (
    bucket_id = 'certificati' and
    exists (
      select 1 from public.tecnici t
      where t.id = auth.uid() and t.is_admin = true
    )
  );

-- 6. FUNZIONE per aggiornare stato certificazioni scadute
create or replace function public.aggiorna_stato_scadute()
returns void as $$
  update public.certificazioni
  set stato = 'scaduta'
  where data_scadenza < current_date
    and stato = 'attiva';
$$ language sql security definer;

-- ============================================================
-- FATTO! Ora vai su Supabase → Authentication → Users
-- e crea il primo utente admin con la tua email.
-- Poi in Table Editor → tecnici, aggiungi una riga con
-- lo stesso UUID dell'utente e metti is_admin = true
-- ============================================================
