const themeSwitch = () => {
    const html = document.documentElement;
    const btn = document.getElementById('theme-switch');

    if (html.getAttribute('data-theme') === 'light') {
        html.setAttribute('data-theme', 'dark');
        btn.classList.remove('icon-moon');
        btn.classList.add('icon-sun');
    } else {
        html.setAttribute('data-theme', 'light');
        btn.classList.remove('icon-sun');
        btn.classList.add('icon-moon');
    }
};