// ============================================================
// KAPLET ACADEMY — API Supabase
// ============================================================

// Client Supabase (caricato via CDN nell'HTML)
let _supabase = null;

function getClient() {
  if (!_supabase) {
    _supabase = supabase.createClient(
      KAPLET_CONFIG.supabase.url,
      KAPLET_CONFIG.supabase.anonKey
    );
  }
  return _supabase;
}

// ============================================================
// AUTH
// ============================================================

async function loginUtente(email, password) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function logoutUtente() {
  const { error } = await getClient().auth.signOut();
  if (error) throw error;
}

async function getUtenteCorrente() {
  const { data: { user } } = await getClient().auth.getUser();
  return user;
}

async function onAuthChange(callback) {
  getClient().auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// ============================================================
// TECNICI
// ============================================================

async function getTecnicoCorrente() {
  const user = await getUtenteCorrente();
  if (!user) return null;
  const { data, error } = await getClient()
    .from('tecnici')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return data;
}

async function getTuttiTecnici() {
  const { data, error } = await getClient()
    .from('tecnici')
    .select('*')
    .order('cognome');
  if (error) throw error;
  return data;
}

async function aggiornaTecnico(id, campi) {
  const { data, error } = await getClient()
    .from('tecnici')
    .update(campi)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// CERTIFICAZIONI
// ============================================================

async function getMieCertificazioni() {
  const user = await getUtenteCorrente();
  if (!user) return [];
  const { data, error } = await getClient()
    .from('certificazioni')
    .select('*')
    .eq('tech_id', user.id)
    .order('data_conseguimento', { ascending: false });
  if (error) throw error;
  return data;
}

async function getTutteLeCertificazioni() {
  const { data, error } = await getClient()
    .from('certificazioni')
    .select('*, tecnici(nome, cognome, ruolo, email)')
    .order('inserita_il', { ascending: false });
  if (error) throw error;
  return data;
}

async function getCertificazioniTecnico(techId) {
  const { data, error } = await getClient()
    .from('certificazioni')
    .select('*')
    .eq('tech_id', techId)
    .order('data_conseguimento', { ascending: false });
  if (error) throw error;
  return data;
}

async function aggiungiCertificazione(cert) {
  const user = await getUtenteCorrente();
  if (!user) throw new Error('Non autenticato');

  const { data, error } = await getClient()
    .from('certificazioni')
    .insert({
      tech_id: user.id,
      brand: cert.brand,
      corso: cert.corso,
      data_conseguimento: cert.dataConseguimento,
      data_scadenza: cert.dataScadenza || null,
      documento_url: cert.documentoUrl || null,
      note: cert.note || null,
      stato: 'attiva'
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function eliminaCertificazione(id) {
  const { error } = await getClient()
    .from('certificazioni')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

async function aggiornaCertificazione(id, campi) {
  const { data, error } = await getClient()
    .from('certificazioni')
    .update(campi)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// STORAGE — Caricamento documenti
// ============================================================

async function caricaDocumento(file) {
  const user = await getUtenteCorrente();
  if (!user) throw new Error('Non autenticato');

  const estensione = file.name.split('.').pop();
  const nomeFile = `${user.id}/${Date.now()}.${estensione}`;

  const { data, error } = await getClient()
    .storage
    .from('certificati')
    .upload(nomeFile, file, { upsert: false });

  if (error) throw error;

  // Ottieni URL firmato valido 1 anno
  const { data: urlData } = await getClient()
    .storage
    .from('certificati')
    .createSignedUrl(nomeFile, 60 * 60 * 24 * 365);

  return urlData.signedUrl;
}

async function getUrlDocumento(path) {
  if (!path) return null;
  // Se è già un URL completo, restituiscilo
  if (path.startsWith('http')) return path;
  const { data } = await getClient()
    .storage
    .from('certificati')
    .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 giorni
  return data?.signedUrl;
}

// ============================================================
// UTILS
// ============================================================

function giorniAllaScadenza(dataScadenza) {
  if (!dataScadenza) return null;
  const oggi = new Date();
  const scadenza = new Date(dataScadenza);
  const diff = Math.ceil((scadenza - oggi) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatData(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function scadenzaClass(giorni) {
  if (giorni === null) return '';
  if (giorni < 0) return 'scaduta';
  if (giorni <= 30) return 'critica';
  if (giorni <= 60) return 'attenzione';
  return 'ok';
}
