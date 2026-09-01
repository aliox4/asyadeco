import { envoieTexte, echappe, json, configuré } from './_telegram.js';

export const config = { runtime: 'edge' };

export default async function handler(requete) {
  if (requete.method !== 'POST') return json({ erreur: 'Méthode non autorisée' }, 405);
  if (!configuré()) {
    console.error('TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID absent');
    return json({ erreur: 'Configuration incomplète' }, 500);
  }

  try {
    const form = await requete.formData();
    const lire = (c) => (form.get(c) ? String(form.get(c)).trim() : '');
    if (lire('societe_web')) return json({ ok: true });

    const nom = lire('nom');
    const email = lire('email');
    if (!nom || !email) return json({ erreur: 'Nom et email requis' }, 400);

    await envoieTexte([
      '<b>Message depuis le site</b>',
      '',
      `<b>${echappe(nom)}</b>`,
      `Email : ${echappe(email)}`,
      lire('telephone') ? `Téléphone : ${echappe(lire('telephone'))}` : null,
      '',
      `<i>${echappe(lire('message'))}</i>`,
    ].filter(Boolean).join('\n'));

    return json({ ok: true });
  } catch (e) {
    console.error('Erreur contact :', e);
    return json({ erreur: "L'envoi a échoué" }, 500);
  }
}
