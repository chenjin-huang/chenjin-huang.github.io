// Filter buttons on the Work and Writing pages.
document.querySelectorAll('[data-filter-for]').forEach(function (group) {
  var list = document.getElementById(group.getAttribute('data-filter-for'));
  if (!list) return;
  group.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-filter]');
    if (!btn) return;
    var key = btn.getAttribute('data-filter'), n = 0;
    group.querySelectorAll('[data-filter]').forEach(function (b) {
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
    list.querySelectorAll('[data-tags]').forEach(function (item) {
      var show = key === 'all' || item.getAttribute('data-tags').split(' ').indexOf(key) !== -1;
      item.hidden = !show;
      var num = item.querySelector('.num');
      if (show && num) num.textContent = String(++n).padStart(2, '0');
    });
  });
});
