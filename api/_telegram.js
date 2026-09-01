// Utilitaires d'envoi vers l'API Telegram Bot. Compatible runtime Edge.
const url = (methode) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${methode}`;

export async function envoieTexte(texte) {
  const r = await fetch(url('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: texte,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  if (!r.ok) throw new Error('sendMessage ' + r.status + ' ' + (await r.text()));
  return r.json();
}

// fichier est un objet File issu de formData().
export async function envoieFichier(fichier, legende) {
  const image = /^image\//.test(fichier.type || '');
  const corps = new FormData();
  corps.append('chat_id', process.env.TELEGRAM_CHAT_ID);
  if (legende) corps.append('caption', legende.slice(0, 1000));
  corps.append(image ? 'photo' : 'document', fichier, fichier.name || 'piece-jointe');
  const r = await fetch(url(image ? 'sendPhoto' : 'sendDocument'), { method: 'POST', body: corps });
  if (!r.ok) throw new Error('sendFile ' + r.status + ' ' + (await r.text()));
  return r.json();
}

export const echappe = (v) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const json = (donnees, statut = 200) =>
  new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const configuré = () =>
  Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
