// Sub-pages: reveal on scroll, mark the current page in the top bar.
const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
document.querySelectorAll('.rv').forEach((el) => io.observe(el));
const here = (location.pathname.split("/").pop() || "index").replace(/\.html$/, "");
document.querySelectorAll('.pn a').forEach((a) => { if (a.getAttribute('href').replace(/\.html$/, '') === here) { a.setAttribute('aria-current', 'page'); const n = a.parentElement; n.scrollLeft += a.getBoundingClientRect().left - n.getBoundingClientRect().left - (n.clientWidth - a.offsetWidth) / 2; } });
