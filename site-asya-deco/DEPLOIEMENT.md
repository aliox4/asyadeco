# Mise en ligne et réception des demandes sur Telegram

## 1. Créer le bot Telegram

1. Dans Telegram, ouvrir une conversation avec **@BotFather**.
2. Envoyer `/newbot`, choisir un nom (« Lauterfing Devis ») et un identifiant se terminant par `bot`.
3. BotFather renvoie un jeton de la forme `123456789:AAE...`. C'est le `TELEGRAM_BOT_TOKEN`.

## 2. Récupérer l'identifiant de conversation

1. Ouvrir une conversation avec le bot que vous venez de créer et lui envoyer un message quelconque.
2. Ouvrir dans un navigateur `https://api.telegram.org/bot<VOTRE_JETON>/getUpdates`.
3. Relever la valeur `"chat":{"id": ...}`. C'est le `TELEGRAM_CHAT_ID`.

Pour recevoir les demandes à plusieurs, créer un groupe, y ajouter le bot, envoyer un message
dans le groupe puis relire `getUpdates` : l'identifiant du groupe est négatif, par exemple
`-1001234567890`. C'est la configuration recommandée dès qu'un conducteur de travaux
doit voir les demandes.

## 3. Déployer sur Vercel

```bash
npm i -g vercel
cd site
vercel
```

Puis, dans le tableau de bord Vercel, **Settings > Environment Variables**, ajouter pour
les environnements Production, Preview et Development :

| Variable | Valeur |
|---|---|
| `TELEGRAM_BOT_TOKEN` | le jeton de BotFather |
| `TELEGRAM_CHAT_ID` | l'identifiant relevé à l'étape 2 |

Redéployer après ajout des variables : `vercel --prod`.

## 4. Vérifier

Envoyer une demande de test depuis `/devis.html` avec une photo. Vous devez recevoir
dans Telegram un message récapitulatif suivi de la photo. En cas d'échec, les logs sont
dans Vercel, onglet **Logs**, fonction `api/devis`.

## Fonctionnement

- Les images sont redimensionnées à 1600 px et recompressées **dans le navigateur** avant
  envoi. Une photo de téléphone de 5 Mo part à environ 400 Ko, ce qui évite la limite de
  taille de corps de requête et accélère l'envoi en 4G.
- Les PDF, DWG et tableurs sont transmis tels quels, en pièce jointe Telegram.
- Le code postal est comparé aux listes du fichier `api/devis.js` et le message indique
  directement le cercle d'intervention concerné. Les listes sont à ajuster au fil du temps.
- Chaque message rappelle la date limite de rappel à 24 h, pour tenir l'engagement 48 h.
- Un champ invisible `societe_web` sert de piège à robots : s'il est rempli, la demande
  est ignorée silencieusement.

## WhatsApp

Le site propose un bouton `wa.me` sur les pages Contact et Devis : le prospect ouvre une
conversation WhatsApp avec un message pré-rempli. C'est gratuit et immédiat.

Recevoir automatiquement les formulaires **dans** WhatsApp est une autre affaire : cela
suppose la WhatsApp Cloud API de Meta, un compte business vérifié, un numéro dédié qui ne
peut plus être utilisé dans l'application WhatsApp classique, et des messages template
payants et soumis à validation dès que c'est le système qui initie la conversation.
Pour une notification interne, Telegram fait la même chose gratuitement et sans délai
de validation.

Si vous y tenez malgré tout, la voie la plus rapide est Twilio ou 360dialog en revendeur
de la Cloud API : compter une mise en service de quelques jours et environ 0,03 à 0,04 €
par notification.

## Étapes suivantes

- Router les demandes vers n8n plutôt que directement vers Telegram, pour ajouter la
  création de fiche lead, l'email de confirmation automatique au prospect et la relance
  interne à H+36. Il suffit de remplacer l'URL d'action des formulaires par celle du
  webhook n8n, puis de rebrancher Telegram en sortie du workflow.
- Ajouter une limitation de débit par IP sur les routes API.
