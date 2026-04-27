document.addEventListener('DOMContentLoaded', () => {
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const body = document.body;
    
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
    } else if (savedTheme === 'light') {
        body.classList.remove('dark-mode');
    } else {
        // Fallback to system preference if no saved preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('dark-mode');
        }
    }
    
    // Initialize icons correctly on load
    updateIcons();

    // Attach click event to all theme toggle buttons
    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const isDark = body.classList.contains('dark-mode');
            
            // Save preference
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            // Update icons
            updateIcons();
        });
    });

    function updateIcons() {
        const isDark = body.classList.contains('dark-mode');
        themeToggles.forEach(toggle => {
            const icon = toggle.querySelector('i');
            if (icon) {
                // Moon for dark mode, Sun for light mode
                icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
            }
        });
    }
});
