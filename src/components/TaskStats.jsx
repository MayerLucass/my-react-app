function TaskStats({ total, completed, pending, percentage, onClearCompleted }) {
  return (
    <div className="stats-container">
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total</div>
        </div>
        
        <div className="stat-box">
          <div className="stat-value" style={{ color: 'var(--success-color)' }}>
            {completed}
          </div>
          <div className="stat-label">Completadas</div>
        </div>
        
        <div className="stat-box">
          <div className="stat-value" style={{ color: 'var(--primary-color)' }}>
            {pending}
          </div>
          <div className="stat-label">Pendientes</div>
        </div>
        
        <div className="stat-box">
          <div className="stat-value">{percentage}%</div>
          <div className="stat-label">Progreso</div>
        </div>
      </div>
      
      {completed > 0 && (
        <button className="clear-btn" onClick={onClearCompleted}>
          🗑️ Limpiar Completadas
        </button>
      )}
    </div>
  );
}

export default TaskStats;