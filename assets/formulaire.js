// Envoi des formulaires : compression des images côté navigateur puis POST vers l'API.
(function () {
  var MAX_PX = 1600;      // côté le plus long après compression
  var QUALITE = 0.82;     // qualité JPEG
  var MAX_FICHIERS = 10;

  function compresse(fichier) {
    // Les PDF, DWG et tableurs passent tels quels.
    if (!/^image\//.test(fichier.type)) return Promise.resolve(fichier);
    return new Promise(function (resoudre) {
      var url = URL.createObjectURL(fichier);
      var im = new Image();
      im.onload = function () {
        var r = Math.min(1, MAX_PX / Math.max(im.width, im.height));
        var c = document.createElement('canvas');
        c.width = Math.round(im.width * r);
        c.height = Math.round(im.height * r);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        c.toBlob(function (blob) {
          URL.revokeObjectURL(url);
          if (!blob || blob.size >= fichier.size) return resoudre(fichier);
          resoudre(new File([blob], fichier.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', QUALITE);
      };
      im.onerror = function () { URL.revokeObjectURL(url); resoudre(fichier); };
      im.src = url;
    });
  }

  function etat(zone, type, texte) {
    zone.className = 'etat ' + type;
    zone.textContent = texte;
  }

  document.querySelectorAll('form[data-envoi]').forEach(function (form) {
    var zone = form.querySelector('.etat');
    var bouton = form.querySelector('button[type="submit"]');
    var libelle = bouton ? bouton.textContent : '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (bouton) { bouton.disabled = true; bouton.textContent = 'Envoi en cours…'; }
      if (zone) etat(zone, 'attente', 'Préparation de votre demande…');

      var données = new FormData(form);
      var champ = form.querySelector('input[type="file"]');
      var fichiers = champ && champ.files ? Array.prototype.slice.call(champ.files, 0, MAX_FICHIERS) : [];
      if (champ) données.delete(champ.name);

      Promise.all(fichiers.map(compresse))
        .then(function (prets) {
          prets.forEach(function (f) { données.append('fichiers', f, f.name); });
          if (zone) etat(zone, 'attente', 'Envoi en cours…');
          return fetch(form.getAttribute('action'), { method: 'POST', body: données });
        })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function () {
          form.reset();
          if (zone) {
            etat(zone, 'succes',
              'Demande envoyée. Nous vous rappelons dans la journée, jours ouvrés.');
            zone.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
          if (bouton) { bouton.disabled = false; bouton.textContent = libelle; }
        })
        .catch(function () {
          if (zone) etat(zone, 'erreur',
            'L\u2019envoi a échoué. Appelez-nous au 06 67 38 05 28.');
          if (bouton) { bouton.disabled = false; bouton.textContent = libelle; }
        });
    });
  });
})();
