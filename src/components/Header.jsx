function Header({ theme }) {
  return (
    <header className="header">
      <h1>Task Manager Pro</h1>
      <p className="header-subtitle">
        Organiza y modifica tus tareas fácilmente
        <span style={{ marginLeft: '0.5rem' }}>
          {theme === 'light' ? '☀️' : '🌙'}
        </span>
      </p>
    </header>
  );
}

export default Header;