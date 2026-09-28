const nav = document.querySelector('.gnav');
document.getElementById('menuBtn').onclick = () => nav.classList.toggle('menu-open');
document.getElementById('searchBtn').onclick = () => document.getElementById('searchPanel').classList.toggle('open');

// Carousel: auto-advance, dots to jump
const track = document.getElementById('track');
const slides = track.children;
const dots = document.getElementById('dots');
let i = 0;

[...slides].forEach((_, n) => {
  const b = document.createElement('button');
  b.setAttribute('aria-label', 'Slide ' + (n + 1));
  b.onclick = () => go(n);
  dots.appendChild(b);
});

function go(n) {
  i = (n + slides.length) % slides.length;
  track.style.transform = `translateX(-${slides[i].offsetLeft - slides[0].offsetLeft}px)`;
  [...dots.children].forEach((d, k) => d.classList.toggle('active', k === i));
}

go(0);
setInterval(() => go(i + 1), 5000);
window.addEventListener('resize', () => go(i));

// Scroll reveal: text fades up, section gets .in to zoom its image
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.15 });
document.querySelectorAll('.hero, .tile, .ent h2, .ent-row div').forEach(el => {
  if (!el.matches('.hero, .tile')) el.classList.add('reveal');
  el.querySelectorAll('h2, h3, .ctas').forEach((c, k) => { c.classList.add('reveal'); c.style.transitionDelay = k * 0.12 + 's'; });
  io.observe(el);
});
