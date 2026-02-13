// Task manager module to handle task storage and operations

// Key for localStorage
const TASKS_STORAGE_KEY = 'todo-tasks';

// Initialize tasks from localStorage or create empty array
let tasks = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY)) || [];

// Save tasks to localStorage
const saveTasks = () => {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
};

// Add a new task
export const addTask = (taskData) => {
  const newTask = {
    ...taskData,
    id: taskData.id || Date.now().toString(), // Use provided ID or generate new one
    createdAt: taskData.createdAt || new Date().toISOString()
  };
  
  tasks.push(newTask);
  saveTasks();
  return newTask;
};

// Update a task
export const updateTask = (id, updates) => {
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex !== -1) {
    tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
    saveTasks();
    return tasks[taskIndex];
  }
  return null;
};

// Delete a task
export const deleteTask = (id) => {
  const initialLength = tasks.length;
  tasks = tasks.filter(task => task.id !== id);
  if (tasks.length !== initialLength) {
    saveTasks();
    return true;
  }
  return false;
};

// Toggle task completion status
export const toggleTaskCompletion = (id) => {
  const task = tasks.find(task => task.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    return task;
  }
  return null;
};

// Load tasks from localStorage when module loads
export const loadTasks = () => {
  tasks = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY)) || [];
  return tasks;
};
