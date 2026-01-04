function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="theme-toggle-btn" onClick={onToggle}>
      <span className="theme-icon">
        {theme === 'light' ? '🌙' : '☀️'}
      </span>
      <span>
        {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
      </span>
    </button>
  );
}

export default ThemeToggle;