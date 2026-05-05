// Kaplet Academy - Edge Function: check-scadenze
// Deploy: supabase functions deploy check-scadenze
// Trigger: pg_cron ogni giorno alle 08:00

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SMTP = {
  host: "smtp.office365.com",
  port: 587,
  user: "admin@kaplet.it",
  pass: Deno.env.get("SMTP_PASSWORD") ?? "",
  from: "Kaplet Academy <admin@kaplet.it>",
  to:   "admin@kaplet.it",
};

serve(async () => {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  await sb.rpc("aggiorna_stato_scadute");

  const oggi = new Date();
  const notifiche: any[] = [];

  for (const gg of [60, 30, 7]) {
    const target = new Date(oggi);
    target.setDate(oggi.getDate() + gg);
    const ds = target.toISOString().split("T")[0];
    const { data } = await sb
      .from("certificazioni")
      .select("*, tecnici(nome,cognome,ruolo)")
      .eq("data_scadenza", ds)
      .eq("stato", "attiva");
    (data ?? []).forEach(c => notifiche.push({ cert: c, giorni: gg }));
  }

  if (notifiche.length > 0) await sendMail(notifiche);

  return new Response(JSON.stringify({ ok: true, n: notifiche.length }), {
    headers: { "Content-Type": "application/json" },
  });
});

async function sendMail(notifiche: any[]) {
  const soggetto = notifiche.length === 1
    ? `Kaplet Academy - Certificazione in scadenza: ${notifiche[0].cert.tecnici.nome} ${notifiche[0].cert.tecnici.cognome}`
    : `Kaplet Academy - ${notifiche.length} certificazioni in scadenza`;

  const righe = notifiche.map(({ cert, giorni }) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:14px;color:#1a1a1a">
        ${cert.tecnici.nome} ${cert.tecnici.cognome}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;color:#555">
        ${cert.tecnici.ruolo}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px">
        <b>${cert.brand}</b>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;color:#555">
        ${cert.corso}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;
        color:${giorni <= 7 ? "#dc2626" : giorni <= 30 ? "#b45309" : "#555"};font-weight:600">
        ${new Date(cert.data_scadenza).toLocaleDateString("it-IT")}<br>
        <span style="font-weight:400;font-size:11px">${giorni} giorni</span>
      </td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <div style="max-width:680px;margin:0 auto;background:#fff">
    <div style="background:#0C0E0D;padding:22px 30px">
      <span style="font-size:14px;letter-spacing:.25em;text-transform:uppercase;color:#fff">
        <span style="color:#36CD81">·</span>KAPLET Academy
      </span>
    </div>
    <div style="background:#36CD81;padding:10px 30px">
      <span style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#0C0E0D">
        Notifica automatica scadenze
      </span>
    </div>
    <div style="padding:30px">
      <h1 style="font-size:20px;font-weight:300;color:#0C0E0D;margin:0 0 8px">
        ${notifiche.length === 1 ? "Una certificazione sta per scadere" : `${notifiche.length} certificazioni in scadenza`}
      </h1>
      <p style="font-size:14px;color:#666;margin:0 0 24px;line-height:1.6">
        Pianifica il rinnovo con anticipo.
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e5e5">
        <thead>
          <tr style="background:#f8f8f8">
            <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#888;border-bottom:2px solid #e5e5e5">Tecnico</th>
            <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#888;border-bottom:2px solid #e5e5e5">Ruolo</th>
            <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#888;border-bottom:2px solid #e5e5e5">Brand</th>
            <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#888;border-bottom:2px solid #e5e5e5">Certificazione</th>
            <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#888;border-bottom:2px solid #e5e5e5">Scadenza</th>
          </tr>
        </thead>
        <tbody>${righe}</tbody>
      </table>
      <div style="margin-top:24px;text-align:center">
        <a href="https://tuoaccount.github.io/kaplet-academy/admin.html"
           style="display:inline-block;background:#36CD81;color:#0C0E0D;text-decoration:none;
                  padding:11px 26px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase">
          Apri pannello admin
        </a>
      </div>
    </div>
    <div style="background:#f8f8f8;border-top:1px solid #e5e5e5;padding:18px 30px;text-align:center">
      <p style="font-size:11px;color:#999;margin:0">
        Kaplet S.r.l. · Via Cerchia di S. Giorgio, 145 · 47521 Cesena (FC)<br>
        Notifica automatica Kaplet Academy
      </p>
    </div>
  </div>
</body></html>`;

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const conn = await Deno.connect({ hostname: SMTP.host, port: SMTP.port });

  const r = async () => { const b = new Uint8Array(4096); const n = await conn.read(b); return dec.decode(b.subarray(0, n ?? 0)); };
  const w = async (s: string) => conn.write(enc.encode(s + "\r\n"));

  await r();
  await w("EHLO kaplet"); await r();
  await w("STARTTLS"); await r();

  const tls = await Deno.startTls(conn, { hostname: SMTP.host });
  const rt = async () => { const b = new Uint8Array(4096); const n = await tls.read(b); return dec.decode(b.subarray(0, n ?? 0)); };
  const wt = async (s: string) => tls.write(enc.encode(s + "\r\n"));

  await wt("EHLO kaplet"); await rt();
  await wt("AUTH LOGIN"); await rt();
  await wt(btoa(SMTP.user)); await rt();
  await wt(btoa(SMTP.pass)); await rt();
  await wt(`MAIL FROM:<${SMTP.user}>`); await rt();
  await wt(`RCPT TO:<${SMTP.to}>`); await rt();
  await wt("DATA"); await rt();
  await wt([
    `From: ${SMTP.from}`,
    `To: ${SMTP.to}`,
    `Subject: ${soggetto}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    html,
    `.`
  ].join("\r\n"));
  await rt();
  await wt("QUIT");
  tls.close();
}
