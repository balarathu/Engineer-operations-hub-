import React, { useState } from 'react';
import { TaskEntry, TaskCategory, CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_DARK_COLORS, AppUser } from '../types';
import { ChevronLeft, ChevronRight, Plus, CheckCircle, Clock, AlertCircle, CalendarRange, Edit2, Save, X } from 'lucide-react';


interface CalendarViewProps {
  tasks: TaskEntry[];
  projects: string[];
  onAddTask: (task: Omit<TaskEntry, 'id'>) => void;
  onUpdateTask: (task: TaskEntry) => void;
  onDeleteTask: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  currentUser?: AppUser;
  categoryLabels?: Record<TaskCategory, string>;
  usersList?: AppUser[];
}

export default function CalendarView({
  tasks,
  projects,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  selectedDate,
  setSelectedDate,
  currentUser,
  categoryLabels,
  usersList,
}: CalendarViewProps) {
  const labels = categoryLabels || CATEGORY_LABELS;
  
  // Center on current system year and month dynamically
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth()); // 0-indexed

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate days in the current month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Calculate first day of the month offset
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOffset = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // Format date parts into YYYY-MM-DD
  const formatDateString = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Get tasks for a specific date
  const getTasksForDate = (dateStr: string) => {
    return tasks.filter((t) => t.date === dateStr);
  };

  // State for creating a task in-line
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [newProject, setNewProject] = useState(projects[0] || 'Office Work');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<TaskCategory>('PROJECT_TRACK');
  const [newHours, setNewHours] = useState(2);
  const [newStatus, setNewStatus] = useState<TaskEntry['status']>('In Progress');
  const [newEngineer, setNewEngineer] = useState(() => {
    if (currentUser && currentUser.role === 'engineer') {
      return currentUser.name;
    }
    return 'Balarathu';
  });

  // State for editing a task
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editProject, setEditProject] = useState('Office Work');
  const [editCat, setEditCat] = useState<TaskCategory>('PROJECT_TRACK');
  const [editHours, setEditHours] = useState(2);
  const [editStatus, setEditStatus] = useState<TaskEntry['status']>('In Progress');
  const [editEngineer, setEditEngineer] = useState('Balarathu');

  const startEditTask = (task: TaskEntry) => {
    setEditingTaskId(task.id);
    setEditDesc(task.description);
    setEditProject(task.project);
    setEditCat(task.category);
    setEditHours(task.timeSpent);
    setEditStatus(task.status);
    setEditEngineer(task.engineer || 'Balarathu');
  };

  const handleSaveTaskEdit = (task: TaskEntry) => {
    if (!editDesc.trim()) return;
    onUpdateTask({
      ...task,
      project: editProject,
      category: editCat,
      description: editDesc,
      status: editStatus,
      timeSpent: Number(editHours),
      engineer: editEngineer,
      completedDate: editStatus === 'Completed' ? task.date : undefined,
    });
    setEditingTaskId(null);
  };


  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    onAddTask({
      date: selectedDate,
      project: newProject,
      category: newCat,
      description: newDesc,
      status: newStatus,
      timeSpent: Number(newHours),
      completedDate: newStatus === 'Completed' ? selectedDate : undefined,
      engineer: newEngineer,
    });

    setNewDesc('');
    setIsAddingInline(false);
  };

  const handleToggleStatus = (task: TaskEntry) => {
    const updatedStatus: TaskEntry['status'] = task.status === 'Completed' ? 'In Progress' : 'Completed';
    onUpdateTask({
      ...task,
      status: updatedStatus,
      completedDate: updatedStatus === 'Completed' ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  // Prepare calendar cells
  const cells: { day: number | null; dateStr: string | null }[] = [];
  for (let i = 0; i < firstDayOffset; i++) {
    cells.push({ day: null, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      dateStr: formatDateString(currentYear, currentMonth, d),
    });
  }

  const selectedDateTasks = getTasksForDate(selectedDate);
  const totalDailyHours = selectedDateTasks.reduce((sum, t) => sum + t.timeSpent, 0);

  return (
    <div id="calendar_view_container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid Section */}
      <div id="calendar_main_grid" className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header control */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <p className="text-xs text-slate-500">Click on any cell to view tasks or log activities</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn_prev_month"
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              id="btn_today"
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 transition"
            >
              Jump to Today
            </button>
            <button
              id="btn_next_month"
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar Core Grid */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 text-center font-medium text-xs text-slate-500 tracking-wider py-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 bg-slate-100 divide-x divide-y divide-slate-200/60 leading-none">
          {cells.map((cell, index) => {
            const hasTask = cell.dateStr ? getTasksForDate(cell.dateStr).length > 0 : false;
            const dayTasks = cell.dateStr ? getTasksForDate(cell.dateStr) : [];
            const isSelected = cell.dateStr === selectedDate;
            const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={index}
                className={`min-h-[105px] sm:min-h-[120px] bg-white p-2 transition-all flex flex-col justify-between cursor-pointer group hover:bg-slate-50 ${
                  isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/20' : ''
                } ${!cell.day ? 'bg-slate-50/50 opacity-40 pointer-events-none' : ''}`}
                onClick={() => cell.dateStr && setSelectedDate(cell.dateStr)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center transition ${
                      isToday
                        ? 'bg-red-500 text-white font-bold'
                        : isSelected
                        ? 'text-indigo-600 font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {dayTasks.reduce((sum, t) => sum + t.timeSpent, 0)} hrs
                    </span>
                  )}
                </div>

                {/* Day's Tasks list */}
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar pt-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    let iconColor = 'text-slate-400';
                    if (task.status === 'Completed') iconColor = 'text-emerald-500';
                    if (task.status === 'Blocked') iconColor = 'text-red-500';

                    return (
                      <div
                        key={task.id}
                        className={`text-[9px] sm:text-[10px] p-1 rounded truncate border ${CATEGORY_COLORS[task.category]} flex items-center justify-between gap-1`}
                        title={`${task.project}: ${task.description}`}
                      >
                        <span className="truncate flex-1 font-medium">{task.project}</span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            task.status === 'Completed'
                              ? 'bg-emerald-500'
                              : task.status === 'Blocked'
                              ? 'bg-rose-500'
                              : 'bg-indigo-500'
                          }`}
                        />
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-[9px] text-indigo-600 font-semibold text-right pr-1">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Action Panel */}
      <div id="calendar_detail_panel" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col h-full">
        <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-start">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Logged tasks: <span className="font-semibold text-slate-700">{selectedDateTasks.length}</span> | Total:{' '}
              <span className="font-semibold text-slate-700">{totalDailyHours} hrs</span>
            </p>
          </div>
          {selectedDate === new Date().toISOString().split('T')[0] && (
            <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px] lg:max-h-[420px]">
          {selectedDateTasks.length === 0 ? (
            <div className="text-center py-8 px-4 border-2 border-dashed border-slate-100 rounded-lg flex flex-col items-center">
              <span className="text-slate-300 font-mono text-3xl mb-1">ø</span>
              <p className="text-xs text-slate-400">No work logged for this day yet.</p>
              <button
                onClick={() => setIsAddingInline(true)}
                className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Log Activity
              </button>
            </div>
          ) : (
            selectedDateTasks.map((task) => {
              const isEditing = editingTaskId === task.id;
              if (isEditing) {
                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-lg border-2 border-indigo-300 bg-white shadow-md animate-fade-in space-y-2 text-xs text-left"
                  >
                    <div className="flex justify-between items-center pb-1 border-b border-slate-105">
                      <span className="font-bold text-indigo-700">Edit Task Entry</span>
                      <button
                        type="button"
                        onClick={() => setEditingTaskId(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Project</label>
                      <select
                        value={editProject}
                        onChange={(e) => setEditProject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none focus:border-indigo-500 font-bold"
                      >
                        {projects.map((proj) => (
                          <option key={proj} value={proj}>
                            {proj}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Category</label>
                        <select
                          value={editCat}
                          onChange={(e) => setEditCat(e.target.value as TaskCategory)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none focus:border-indigo-500"
                        >
                          {Object.entries(labels).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Hours Spent</label>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={editHours || 1}
                          onChange={(e) => setEditHours(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none focus:border-indigo-500 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Description</label>
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={2}
                        placeholder="..."
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none focus:border-indigo-500 leading-tight"
                      />
                    </div>

                    {currentUser && (currentUser.role === 'manager' || currentUser.role === 'admin') && (
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Log Author (Engineer)</label>
                        <select
                          value={editEngineer}
                          onChange={(e) => setEditEngineer(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none focus:border-indigo-500 font-bold"
                        >
                          {usersList && usersList.length > 0 ? (
                            usersList.map((user) => (
                              <option key={user.username} value={user.name}>
                                {user.name} ({user.designation || user.role})
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="Balarathu">Balarathu (Sr. Engineer)</option>
                              <option value="Sarah Thompson">Sarah Thompson (Automation)</option>
                              <option value="Markus V">Markus V (Specialist)</option>
                              <option value="Admin User">Admin User (Admin)</option>
                            </>
                          )}
                        </select>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="bg-slate-50 border border-slate-205 rounded p-0.5 text-[10px] outline-none font-semibold text-slate-700"
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingTaskId(null)}
                          className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 rounded text-[10px] border border-slate-200 text-slate-600 font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveTaskEdit(task)}
                          className="px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] shadow-sm font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Save className="h-3 w-3" /> Save
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-lg border bg-slate-50/50 hover:bg-slate-50 transition ${CATEGORY_DARK_COLORS[task.category]}`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block">
                        {labels[task.category]}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-800 leading-tight mt-0.5">{task.project}</h4>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(task)}
                      className="p-1 rounded hover:bg-slate-100 transition"
                      title={task.status === 'Completed' ? 'Mark In Progress' : 'Mark Completed'}
                    >
                      {task.status === 'Completed' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 fill-emerald-100" />
                      ) : task.status === 'Blocked' ? (
                        <AlertCircle className="h-5 w-5 text-rose-500 fill-rose-50" />
                      ) : (
                        <Clock className="h-5 w-5 text-indigo-600" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">{task.description}</p>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {task.timeSpent} hours
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        by <strong className="text-slate-600 font-semibold">{task.engineer || 'Balarathu'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditTask(task)}
                        className="text-[11px] text-indigo-650 hover:text-indigo-850 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="text-[11px] text-rose-500 hover:text-rose-700 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Add Form / Toggle Drawer */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          {!isAddingInline ? (
            <button
              onClick={() => setIsAddingInline(true)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3 py-2.5 rounded-lg shadow-sm transition"
            >
              <Plus className="h-4 w-4" /> Add Task for {new Date(selectedDate).getDate()} {MONTH_NAMES[new Date(selectedDate).getMonth()]}
            </button>
          ) : (
            <form onSubmit={handleCreateTask} className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2">
                <span className="text-xs font-bold text-slate-700">New Work Entry</span>
                <button
                  type="button"
                  onClick={() => setIsAddingInline(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {currentUser && (currentUser.role === 'manager' || currentUser.role === 'admin') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Log Author (Engineer)</label>
                  <select
                    value={newEngineer}
                    onChange={(e) => setNewEngineer(e.target.value)}
                    className="w-full mt-1 bg-white border border-slate-200 text-xs rounded-md p-1.5 outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                  >
                    {usersList && usersList.length > 0 ? (
                      usersList.map((user) => (
                        <option key={user.username} value={user.name}>
                          {user.name} ({user.designation || user.role})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Balarathu">Balarathu (Sr. Engineer)</option>
                        <option value="Sarah Thompson">Sarah Thompson (Automation)</option>
                        <option value="Markus V">Markus V (Specialist)</option>
                        <option value="Admin User">Admin User (Admin)</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Project / Office Focus</label>
                <select
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-200 text-xs rounded-md p-1.5 outline-none focus:border-indigo-500"
                >
                  {projects.map((proj) => (
                    <option key={proj} value={proj}>
                      {proj}
                    </option>
                  ))}
                  <option value="Office Work">General Office Work</option>
                  <option value="General Support">General Support</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Work Category</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as TaskCategory)}
                  className="w-full mt-1 bg-white border border-slate-200 text-xs rounded-md p-1.5 outline-none focus:border-indigo-500"
                >
                  {(Object.keys(labels) as TaskCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {labels[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Hours Spent</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={newHours}
                  onChange={(e) => setNewHours(Number(e.target.value))}
                  className="w-full mt-1 bg-white border border-slate-200 text-xs rounded-md p-1.5 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Status</label>
                <div className="flex gap-2 mt-1">
                  {(['In Progress', 'Completed', 'Blocked'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`flex-1 py-1 text-[10px] rounded border font-medium transition ${
                        newStatus === st
                          ? 'bg-indigo-600 text-white border-transparent'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Work Summary</label>
                <textarea
                  required
                  placeholder="What specifically did you accomplish? e.g. loops checked, licenses completed..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  className="w-full mt-1 bg-white border border-slate-200 text-xs rounded-md p-1.5 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2 rounded shadow transition"
              >
                Log Entry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
