import { useState } from 'react';

function TaskList({ tasks, onToggleTask, onEditTask, onDeleteTask, filter }) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEditClick = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const handleSaveEdit = (id) => {
    if (editText.trim()) {
      onEditTask(id, editText);
      setEditingId(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <h3>
          {filter === 'completed'
            ? 'No hay tareas completadas'
            : filter === 'pending'
            ? 'No hay tareas pendientes'
            : '¡Comienza a organizarte!'}
        </h3>
        <p>
          {filter === 'completed'
            ? 'Completa algunas tareas primero'
            : filter === 'pending'
            ? '¡Excelente! Todo está hecho'
            : 'Agrega tu primera tarea usando el formulario'}
        </p>
      </div>
    );
  }

  return (
    <div className="task-list">
      <div className="list-header">
        <h2>
          {filter === 'all'
            ? 'Todas las Tareas'
            : filter === 'completed'
            ? 'Tareas Completadas'
            : 'Tareas Pendientes'}
        </h2>
        <span className="task-count">{tasks.length} tarea{tasks.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="tasks-container">
        {tasks.map((task) => (
          <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
            <div className="task-checkbox">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggleTask(task.id)}
              />
            </div>

            <div className="task-content">
              {editingId === task.id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="edit-input"
                    autoFocus
                  />
                  <div className="edit-buttons">
                    <button
                      onClick={() => handleSaveEdit(task.id)}
                      className="save-btn"
                    >
                      💾 Guardar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="cancel-btn"
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="task-text">{task.text}</p>
                  <div className="task-date">
                    📅 {formatDate(task.createdAt)}
                    {task.completedAt && ` • ✅ ${formatDate(task.completedAt)}`}
                    {task.updatedAt && ` • ✏️ Editada: ${formatDate(task.updatedAt)}`}
                  </div>
                </>
              )}
            </div>

            <div className="task-actions">
              {editingId !== task.id && (
                <>
                  <button
                    onClick={() => handleEditClick(task)}
                    className="edit-btn"
                    title="Editar tarea"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="delete-btn"
                    title="Eliminar tarea"
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskList;