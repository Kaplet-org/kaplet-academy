// KAPLET ACADEMY — API Supabase
const SUPA_URL = 'https://mcgerrvorboagkukzuzc.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ2VycnZvcmJvYWdrdWt6dXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjEyNzIsImV4cCI6MjA5MzQzNzI3Mn0.eDHZ-QUQLM2tFU4KPDEiIqXZsdfk_Cxnz7Ywxt6T46o';

let _sb = null;
function getClient() {
  if (!_sb) _sb = supabase.createClient(SUPA_URL, SUPA_KEY);
  return _sb;
}

async function loginUtente(email, password) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function logoutUtente() {
  await getClient().auth.signOut();
}

async function getSessioneCorrente() {
  const { data: { session } } = await getClient().auth.getSession();
  return session;
}

async function getUtenteCorrente() {
  const s = await getSessioneCorrente();
  return s ? s.user : null;
}

async function getTecnicoCorrente() {
  const s = await getSessioneCorrente();
  if (!s) return null;
  const { data } = await getClient().from('tecnici').select('*').eq('id', s.user.id).single();
  return data;
}

async function getTuttiTecnici() {
  const { data, error } = await getClient().from('tecnici').select('*').order('cognome');
  if (error) throw error;
  return data || [];
}

async function getMieCertificazioni() {
  const s = await getSessioneCorrente();
  if (!s) return [];
  const { data, error } = await getClient().from('certificazioni').select('*').eq('tech_id', s.user.id).order('data_conseguimento', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function getTutteLeCertificazioni() {
  const { data, error } = await getClient().from('certificazioni').select('*, tecnici(nome, cognome, ruolo, email)').order('inserita_il', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function aggiungiCertificazione(cert) {
  const s = await getSessioneCorrente();
  if (!s) throw new Error('Non autenticato');
  const { data, error } = await getClient().from('certificazioni').insert({
    tech_id: s.user.id, brand: cert.brand, corso: cert.corso,
    data_conseguimento: cert.dataConseguimento, data_scadenza: cert.dataScadenza || null,
    documento_url: cert.documentoUrl || null, note: cert.note || null, stato: 'attiva'
  }).select().single();
  if (error) throw error;
  return data;
}

async function eliminaCertificazione(id) {
  const { error } = await getClient().from('certificazioni').delete().eq('id', id);
  if (error) throw error;
}

async function aggiornaCertificazione(id, campi) {
  const { data, error } = await getClient().from('certificazioni').update(campi).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function caricaDocumento(file) {
  const s = await getSessioneCorrente();
  if (!s) throw new Error('Non autenticato');
  const ext = file.name.split('.').pop();
  const path = `${s.user.id}/${Date.now()}.${ext}`;
  const { error } = await getClient().storage.from('certificati').upload(path, file);
  if (error) throw error;
  const { data } = await getClient().storage.from('certificati').createSignedUrl(path, 60 * 60 * 24 * 365);
  return data.signedUrl;
}

function giorniAllaScadenza(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / 86400000);
}

function formatData(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
