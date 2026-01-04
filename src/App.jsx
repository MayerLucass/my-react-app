import { useState, useEffect, useCallback } from 'react';
import ThemeToggle from './components/ThemeToggle';
import Header from './components/Header';
import TaskForm from './components/TaskForm';
import TaskStats from './components/TaskStats';
import TaskList from './components/TaskList';
import './App.css';

const STORAGE_KEY = 'taskmanager_pro_v5';

function App() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error leyendo localStorage:', e);
      return [];
    }
  });

  const [filter, setFilter] = useState('all');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app_theme') || 'light';
  });

  // Aplicar tema al cargar
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Guardar tareas
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error guardando:', e);
    }
  }, [tasks]);

  // Cambiar tema
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Agregar tarea
  const addTask = useCallback((text) => {
    if (!text.trim()) return;
    const newTask = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  // Marcar/completar tarea
  const toggleTask = useCallback((id) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? new Date().toISOString() : null,
            }
          : task
      )
    );
  }, []);

  // Editar tarea
  const editTask = useCallback((id, newText) => {
    if (!newText.trim()) return;
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, text: newText.trim(), updatedAt: new Date().toISOString() }
          : task
      )
    );
  }, []);

  // Eliminar tarea
  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  // Limpiar completadas
  const clearCompleted = useCallback(() => {
    setTasks(prev => prev.filter(task => !task.completed));
  }, []);

  // Filtrar tareas
  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'pending') return !task.completed;
    return true;
  });

  // Estadísticas
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.length - completedCount;
  const progressPercentage = tasks.length > 0 
    ? Math.round((completedCount / tasks.length) * 100) 
    : 0;

  return (
    <div className="app">
      {/* BOTÓN DE TEMA ARRIBA DE TODO */}
      <div className="theme-header">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      <Header theme={theme} />

      <div className="main-container">
        <TaskForm onAddTask={addTask} />

        <TaskStats
          total={tasks.length}
          completed={completedCount}
          pending={pendingCount}
          percentage={progressPercentage}
          onClearCompleted={clearCompleted}
        />

        <div className="filter-section">
          <div className="filter-buttons">
            <button
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'active' : ''}
            >
              📋 Todas ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={filter === 'pending' ? 'active' : ''}
            >
              ⏳ Pendientes ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={filter === 'completed' ? 'active' : ''}
            >
              ✅ Completadas ({completedCount})
            </button>
          </div>
        </div>

        <TaskList
          tasks={filteredTasks}
          onToggleTask={toggleTask}
          onEditTask={editTask}
          onDeleteTask={deleteTask}
          filter={filter}
        />
      </div>
    </div>
  );
}

export default App;