const TASKS_KEY = 'studybloom_tasks_v1';
const SCHEDULE_KEY = 'studybloom_schedule_v1';
let tasks = load(TASKS_KEY, []);
let schedule = load(SCHEDULE_KEY, []);
let currentFilter = 'all';

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function save() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function friendlyTime(time) {
  if (!time) return 'No time set';
  const [h,m] = time.split(':').map(Number);
  return `${(h % 12) || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function addTask(name, time) {
  tasks.unshift({id: Date.now() + Math.random(), name: name.trim(), time, done: false});
  save(); render();
}
function taskMarkup(task) {
  return `<div class="task-row ${task.done ? 'completed' : ''}">
    <button class="task-check" data-action="toggle" data-id="${task.id}" aria-label="${task.done ? 'Mark incomplete' : 'Complete task'}">${task.done ? '✓' : ''}</button>
    <div class="task-text"><strong>${escapeHTML(task.name)}</strong><small>◷ ${escapeHTML(friendlyTime(task.time))}</small></div>
    <button class="delete-button" data-action="delete" data-id="${task.id}" aria-label="Delete task">×</button>
  </div>`;
}
function renderTasks() {
  const done = tasks.filter(t => t.done).length, total = tasks.length, todo = total - done;
  const percent = total ? Math.round(done / total * 100) : 0;
  document.getElementById('total-count').textContent = total;
  document.getElementById('done-count').textContent = done;
  document.getElementById('todo-count').textContent = todo;
  document.getElementById('progress-count').textContent = percent + '%';
  document.getElementById('ring-percent').textContent = percent + '%';
  document.getElementById('progress-ring').style.background = `conic-gradient(#df8caf ${percent * 3.6}deg, #f4d7e5 0deg)`;
  document.getElementById('today-task-count').textContent = `${todo} left`;
  document.getElementById('focus-message').textContent = total && percent === 100 ? 'Amazing! You completed everything. 🌸' : total ? 'Keep going — you are making progress!' : 'Start with one small task today.';
  const todayTasks = tasks.filter(t => !t.done).slice(0, 5);
  document.getElementById('task-list').innerHTML = todayTasks.map(taskMarkup).join('');
  document.getElementById('empty-state').style.display = todayTasks.length ? 'none' : 'block';
  const filtered = tasks.filter(t => currentFilter === 'all' || (currentFilter === 'done' ? t.done : !t.done));
  document.getElementById('all-task-list').innerHTML = filtered.map(taskMarkup).join('');
  document.getElementById('all-empty-state').style.display = filtered.length ? 'none' : 'block';
}
function renderSchedule() {
  const sorted = [...schedule].sort((a,b) => a.time.localeCompare(b.time));
  document.getElementById('schedule-list').innerHTML = sorted.map(item => `<div class="schedule-row"><div class="schedule-time">${escapeHTML(friendlyTime(item.time))}</div><div class="schedule-subject">${escapeHTML(item.subject)}</div><button class="delete-button" data-schedule-delete="${item.id}" aria-label="Delete schedule block">×</button></div>`).join('');
  document.getElementById('schedule-empty').style.display = sorted.length ? 'none' : 'block';
}
function render() { renderTasks(); renderSchedule(); }
function showView(view) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active-view'));
  document.getElementById(`${view}-view`).classList.add('active-view');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  document.getElementById('page-title').innerHTML = ({dashboard:'Good morning! <span>✧</span>',tasks:'Your tasks, your pace <span>✧</span>',schedule:'Make time for your goals <span>✧</span>'})[view];
}
document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
document.getElementById('go-tasks').addEventListener('click', () => showView('tasks'));
function connectTaskForm(formId, inputId, timeId) {
  document.getElementById(formId).addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById(inputId);
    if (!input.value.trim()) return;
    addTask(input.value, document.getElementById(timeId).value);
    input.value = ''; document.getElementById(timeId).value = '';
  });
}
connectTaskForm('task-form', 'task-input', 'task-time');
connectTaskForm('task-form-secondary', 'task-input-secondary', 'task-time-secondary');
document.addEventListener('click', event => {
  const action = event.target.closest('[data-action]');
  if (action) {
    const id = Number(action.dataset.id);
    if (action.dataset.action === 'toggle') tasks = tasks.map(t => t.id === id ? {...t, done: !t.done} : t);
    if (action.dataset.action === 'delete') tasks = tasks.filter(t => t.id !== id);
    save(); render();
  }
  const scheduleDelete = event.target.closest('[data-schedule-delete]');
  if (scheduleDelete) { schedule = schedule.filter(s => s.id !== Number(scheduleDelete.dataset.scheduleDelete)); save(); renderSchedule(); }
});
document.querySelectorAll('.filter-button').forEach(button => button.addEventListener('click', () => {
  currentFilter = button.dataset.filter;
  document.querySelectorAll('.filter-button').forEach(b => b.classList.toggle('active', b === button));
  renderTasks();
}));
document.getElementById('schedule-form').addEventListener('submit', event => {
  event.preventDefault();
  const subject = document.getElementById('schedule-subject'), time = document.getElementById('schedule-time');
  if (!subject.value.trim() || !time.value) return;
  schedule.push({id: Date.now() + Math.random(), subject: subject.value.trim(), time: time.value});
  subject.value = ''; time.value = ''; save(); renderSchedule();
});
const now = new Date();
document.getElementById('today-label').textContent = now.toLocaleDateString(undefined, {weekday:'long', month:'long', day:'numeric'}).toUpperCase();
document.getElementById('page-title').innerHTML = `${now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'}! <span>✧</span>`;
render();
