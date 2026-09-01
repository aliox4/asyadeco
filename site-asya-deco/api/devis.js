import { envoieTexte, envoieFichier, echappe, json, configuré } from './_telegram.js';

export const config = { runtime: 'edge' };

// Zone d'intervention : sert à router et à qualifier la demande.
const CERCLE_1 = ['94360','94350','94170','94130','94500','94340','94100','94210','94430',
                  '94120','94300','93160','93360','93110','93100'];

function cercle(cp) {
  if (CERCLE_1.includes(cp)) return '1, zone quotidienne';
  if (/^750/.test(cp)) return '2, Paris intra-muros';
  if (/^(94|93|77)/.test(cp)) return '2, proche couronne';
  if (/^(75|77|78|91|92|93|94|95)/.test(cp)) return '3, Île-de-France, à qualifier';
  return 'hors zone, à vérifier';
}

export default async function handler(requete) {
  if (requete.method !== 'POST') return json({ erreur: 'Méthode non autorisée' }, 405);
  if (!configuré()) {
    console.error('TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID absent');
    return json({ erreur: 'Configuration incomplète' }, 500);
  }

  try {
    const form = await requete.formData();
    const lire = (c) => (form.get(c) ? String(form.get(c)).trim() : '');

    // Piège à robots : champ invisible que seuls les scripts remplissent.
    if (lire('societe_web')) return json({ ok: true });

    const nom = lire('nom');
    const tel = lire('telephone');
    if (!nom || !tel) return json({ erreur: 'Nom et téléphone requis' }, 400);

    const cp = lire('code_postal');
    const lots = form.getAll('lots').map(String);
    const fichiers = form.getAll('fichiers').filter((f) => f && typeof f !== 'string' && f.size > 0);

    const rappel = new Date(Date.now() + 864e5).toLocaleString('fr-FR', {
      dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris',
    });

    await envoieTexte([
      '<b>Nouvelle demande de devis</b>',
      '',
      `<b>${echappe(nom)}</b>`,
      `Téléphone : ${echappe(tel)}`,
      lire('email') ? `Email : ${echappe(lire('email'))}` : null,
      '',
      `Code postal : <b>${echappe(cp)}</b>, cercle ${cercle(cp)}`,
      lire('projet') ? `Projet : ${echappe(lire('projet'))}` : null,
      lots.length ? `Lots : ${echappe(lots.join(', '))}` : null,
      lire('surface') ? `Surface : ${echappe(lire('surface'))} m²` : null,
      lire('etat') ? `État : ${echappe(lire('etat'))}` : null,
      lire('delai') ? `Démarrage : ${echappe(lire('delai'))}` : null,
      lire('budget') ? `Budget : <b>${echappe(lire('budget'))}</b>` : null,
      lire('message') ? `\n<i>${echappe(lire('message'))}</i>` : null,
      fichiers.length ? `\n${fichiers.length} pièce(s) jointe(s) ci-dessous.` : null,
      '',
      `Engagement 48 h : rappel à passer avant le ${rappel}.`,
    ].filter(Boolean).join('\n'));

    for (const f of fichiers) {
      try {
        await envoieFichier(f, `${nom}, ${cp}`);
      } catch (e) {
        console.error('Pièce jointe non transmise :', f.name, e.message);
      }
    }

    return json({ ok: true });
  } catch (e) {
    console.error('Erreur devis :', e);
    return json({ erreur: "L'envoi a échoué" }, 500);
  }
}
