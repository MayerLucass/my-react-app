import { useState } from 'react';

function TaskForm({ onAddTask }) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddTask(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="task-form">
      <h2>➕ Nueva Tarea</h2>
      <form onSubmit={handleSubmit} className="form-group">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="¿Qué necesitas hacer?"
          className="task-input"
          maxLength="200"
          autoFocus
        />
        <button type="submit" className="add-btn">
          Agregar
        </button>
      </form>
    </div>
  );
}

export default TaskForm;