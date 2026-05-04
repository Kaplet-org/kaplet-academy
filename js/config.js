// ============================================================
// KAPLET ACADEMY — Configurazione
// ============================================================

const KAPLET_CONFIG = {
  supabase: {
    url: 'https://mcgerrvorboagkukzuzc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ2VycnZvcmJvYWdrdWt6dXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjEyNzIsImV4cCI6MjA5MzQzNzI3Mn0.eDHZ-QUQLM2tFU4KPDEiIqXZsdfk_Cxnz7Ywxt6T46o'
  email: {
    mittente: 'admin@kaplet.it',
    destinatario: 'admin@kaplet.it',
    nomemittente: 'Kaplet Academy'
  },
  scadenze: {
    alert60giorni: 60,  // prima notifica 60 giorni prima
    alert30giorni: 30,  // seconda notifica 30 giorni prima
    alert7giorni: 7     // ultima notifica 7 giorni prima
  }
};
          
