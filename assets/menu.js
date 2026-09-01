// Menu de navigation : déroulant sous 780 px.
(function () {
  var b = document.querySelector('.menu-btn');
  var m = document.getElementById('menu-liens');
  if (!b || !m) return;
  function ferme() {
    b.setAttribute('aria-expanded', 'false');
    m.classList.remove('ouvert');
  }
  b.addEventListener('click', function (e) {
    e.stopPropagation();
    var ouvert = b.getAttribute('aria-expanded') === 'true';
    b.setAttribute('aria-expanded', String(!ouvert));
    m.classList.toggle('ouvert', !ouvert);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') ferme();
  });
  document.addEventListener('click', function (e) {
    if (!m.contains(e.target)) ferme();
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 780) ferme();
  });
})();
