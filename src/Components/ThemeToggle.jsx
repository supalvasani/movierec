import React from 'react';

const ThemeToggle = ({ theme, setTheme }) => {
    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <button 
            onClick={toggleTheme}
            className="absolute top-6 right-6 md:top-10 md:right-10 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-light-100/10 border border-light-100/20 hover:bg-light-100/20 transition backdrop-blur-md shadow-lg"
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                <span className="text-xl">☀️</span>
            ) : (
                <span className="text-xl">🌙</span>
            )}
        </button>
    );
};

export default ThemeToggle;
