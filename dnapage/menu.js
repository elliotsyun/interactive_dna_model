// Menu functionality (shared with homepage)
const hamburger = document.getElementById('hamburger');
const sideMenu = document.getElementById('side-menu');
const closeBtn = document.getElementById('close-menu');

hamburger.addEventListener('click', () => {
    sideMenu.classList.add('open');
    sideMenu.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
});

closeBtn.addEventListener('click', () => {
    sideMenu.classList.remove('open');
    sideMenu.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
});

sideMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') closeBtn.click();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBtn.click();
});