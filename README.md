# Kaplet Academy — Guida all'installazione

## Stack tecnologico
- **GitHub Pages** — hosting sito (gratuito)
- **Supabase** — database PostgreSQL + auth + storage file
- **Microsoft 365** — invio email notifiche scadenze

---

## STEP 1 — Supabase: crea le tabelle

1. Vai su [supabase.com](https://supabase.com) → il tuo progetto `Academy Kaplet`
2. Clicca **SQL Editor** nel menu a sinistra
3. Copia tutto il contenuto di `supabase_setup.sql`
4. Incollalo nell'editor e clicca **Run**
5. Dovresti vedere "Success" — le tabelle sono create

---

## STEP 2 — Supabase: crea il primo utente admin

1. Vai su **Authentication → Users** nel menu Supabase
2. Clicca **Add user** → **Create new user**
3. Inserisci la tua email aziendale e una password sicura
4. Copia l'**UUID** dell'utente appena creato (colonna ID)
5. Vai su **Table Editor → tecnici**
6. Clicca **Insert row** e compila:
   - `id` → incolla l'UUID copiato
   - `nome` → il tuo nome
   - `cognome` → il tuo cognome  
   - `ruolo` → il tuo ruolo (es. "Project Manager")
   - `email` → la tua email
   - `is_admin` → `true`
   - `data_ingresso` → data di oggi

---

## STEP 3 — GitHub: crea il repository

1. Vai su [github.com](https://github.com) → **New repository**
2. Nome: `kaplet-academy`
3. Visibilità: **Public** (necessario per GitHub Pages gratuito)
4. Clicca **Create repository**

### Carica i file
Se hai GitHub Desktop (più semplice):
1. Scarica e installa [GitHub Desktop](https://desktop.github.com)
2. Clone il repository sul tuo PC
3. Copia tutti i file di questo pacchetto nella cartella
4. Commit e push

Se usi il terminale:
```bash
cd kaplet-academy
git init
git add .
git commit -m "Prima versione Kaplet Academy"
git remote add origin https://github.com/TUOACCOUNT/kaplet-academy.git
git push -u origin main
```

### Attiva GitHub Pages
1. Vai nel repository su GitHub → **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** → cartella: **/ (root)**
4. Clicca **Save**
5. Dopo 2-3 minuti il sito è online su `https://TUOACCOUNT.github.io/kaplet-academy`

---

## STEP 4 — Aggiorna il link nell'email

Nel file `functions/check-scadenze/index.ts` cerca questa riga:
```
href="https://tuoaccount.github.io/kaplet-academy/admin.html"
```
Sostituisci `tuoaccount` con il tuo username GitHub reale.

---

## STEP 5 — Deploy Edge Function (notifiche email)

### Installa Supabase CLI
```bash
npm install -g supabase
```

### Login e link progetto
```bash
supabase login
supabase link --project-ref mcgerrvorboagkukzuzc
```

### Imposta la password email come variabile d'ambiente sicura
```bash
supabase secrets set SMTP_PASSWORD="la-password-di-admin@kaplet.it"
```

### Deploy della funzione
```bash
supabase functions deploy check-scadenze
```

### Attiva il cron giornaliero
Vai su Supabase → **SQL Editor** e incolla:
```sql
-- Esegui check-scadenze ogni giorno alle 08:00
select cron.schedule(
  'check-scadenze-daily',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://mcgerrvorboagkukzuzc.supabase.co/functions/v1/check-scadenze',
    headers := '{"Authorization": "Bearer ' || current_setting('app.edge_function_key') || '"}'::jsonb
  );
  $$
);
```

---

## STEP 6 — Aggiungi i tecnici

Per ogni tecnico del team:

1. Vai su Supabase → **Authentication → Users → Add user**
2. Inserisci email e password temporanea del tecnico
3. Copia l'UUID
4. Vai su **Table Editor → tecnici → Insert row**
5. Compila i dati (is_admin = `false` per i tecnici normali)
6. Comunica al tecnico le credenziali — al primo accesso può cambiare password

---

## Come funziona il sistema

### Per i tecnici
- Vanno su `https://TUOACCOUNT.github.io/kaplet-academy`
- Cliccano su **Area personale** → login
- Vedono le loro certificazioni, le scadenze, i corsi consigliati
- Aggiungono nuove certificazioni direttamente

### Per l'admin
- Accedono con le credenziali admin
- Vedono automaticamente il pannello admin con tutto il team
- Ricevono email automatiche 60, 30 e 7 giorni prima di ogni scadenza

---

## Struttura file

```
kaplet-academy/
├── index.html              ← Catalogo corsi (pubblico)
├── login.html              ← Pagina login
├── tecnico.html            ← Area personale tecnico
├── admin.html              ← Pannello admin
├── supabase_setup.sql      ← SQL per creare le tabelle
├── js/
│   ├── config.js           ← URL e chiavi Supabase
│   ├── api.js              ← Chiamate al database
│   └── courses.js          ← Catalogo corsi
└── functions/
    └── check-scadenze/
        └── index.ts        ← Edge Function notifiche email
```

---

## Domande frequenti

**Un tecnico ha dimenticato la password?**
Vai su Supabase → Authentication → Users → trova l'utente → Send password reset email

**Voglio aggiungere un nuovo corso al catalogo?**
Apri `js/courses.js`, aggiungi un oggetto nell'array `COURSES` con la stessa struttura degli altri, poi fai commit su GitHub.

**Come cambio la soglia delle notifiche email?**
Nel file `functions/check-scadenze/index.ts` trova la riga:
```
for (const gg of [60, 30, 7]) {
```
Modifica i numeri come vuoi (es. `[90, 60, 30, 7]`).

**Il sito deve essere privato?**
GitHub Pages gratuito richiede repository pubblici. Il sito è comunque protetto da login — senza credenziali non si vede nulla di sensibile. Se vuoi repository privato serve GitHub Pro (4$/mese).
