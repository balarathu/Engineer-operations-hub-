import React, { useState, useRef } from 'react';
import { TaskEntry, TaskCategory, CATEGORY_LABELS, CATEGORY_COLORS, AppUser } from '../types';
import { Download, Upload, Plus, Search, Trash2, Edit2, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SheetViewProps {
  tasks: TaskEntry[];
  projects: string[];
  onAddTask: (task: Omit<TaskEntry, 'id'>) => void;
  onUpdateTask: (task: TaskEntry) => void;
  onDeleteTask: (id: string) => void;
  onBulkImport: (importedTasks: TaskEntry[]) => void;
  currentUser?: AppUser;
  categoryLabels?: Record<TaskCategory, string>;
  usersList?: AppUser[];
}

export default function SheetView({
  tasks,
  projects,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onBulkImport,
  currentUser,
  categoryLabels,
  usersList,
}: SheetViewProps) {
  const labels = categoryLabels || CATEGORY_LABELS;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterEngineer, setFilterEngineer] = useState<string>(() => {
    // If the logged-in user is an engineer, focus on their own tasks by default
    if (currentUser && currentUser.role === 'engineer') {
      return currentUser.name;
    }
    return 'ALL';
  });

  // Multi-editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editProject, setEditProject] = useState('');
  const [editCategory, setEditCategory] = useState<TaskCategory>('PROJECT_TRACK');
  const [editDescription, setEditDescription] = useState('');
  const [editTimeSpent, setEditTimeSpent] = useState(0);
  const [editStatus, setEditStatus] = useState<TaskEntry['status']>('In Progress');
  const [editEngineer, setEditEngineer] = useState('Balarathu');

  // Inline Quick Add Row States
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [quickProject, setQuickProject] = useState(projects[0] || 'Office Work');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('PROJECT_TRACK');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickHours, setQuickHours] = useState(2);
  const [quickStatus, setQuickStatus] = useState<TaskEntry['status']>('In Progress');
  const [quickEngineer, setQuickEngineer] = useState(() => {
    if (currentUser && currentUser.role === 'engineer') {
      return currentUser.name;
    }
    return 'Balarathu';
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEditing = (task: TaskEntry) => {
    setEditingId(task.id);
    setEditDate(task.date);
    setEditProject(task.project);
    setEditCategory(task.category);
    setEditDescription(task.description);
    setEditTimeSpent(task.timeSpent);
    setEditStatus(task.status);
    setEditEngineer(task.engineer || 'Balarathu');
  };

  const saveEditing = () => {
    if (!editingId) return;
    onUpdateTask({
      id: editingId,
      date: editDate,
      project: editProject,
      category: editCategory,
      description: editDescription,
      timeSpent: Number(editTimeSpent),
      status: editStatus,
      completedDate: editStatus === 'Completed' ? editDate : undefined,
      engineer: editEngineer,
    });
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDesc.trim()) return;

    onAddTask({
      date: quickDate,
      project: quickProject,
      category: quickCategory,
      description: quickDesc,
      status: quickStatus,
      timeSpent: Number(quickHours),
      completedDate: quickStatus === 'Completed' ? quickDate : undefined,
      engineer: quickEngineer,
    });

    setQuickDesc('');
  };

  // Filter Tasks List
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCategory === 'ALL' || t.category === filterCategory;
    const matchesProj = filterProject === 'ALL' || t.project === filterProject;
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const matchesEngineer = filterEngineer === 'ALL' || (t.engineer || 'Balarathu') === filterEngineer;

    return matchesSearch && matchesCat && matchesProj && matchesStatus && matchesEngineer;
  });

  // Export filtered tasks to CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Project', 'Activity Category', 'Work Summary Description', 'Hours Spent', 'Status', 'Completed Date', 'Engineer'];
    const rows = filteredTasks.map((t) => [
      t.date,
      `"${t.project.replace(/"/g, '""')}"`,
      labels[t.category],
      `"${t.description.replace(/"/g, '""')}"`,
      t.timeSpent,
      t.status,
      t.completedDate || '',
      `"${(t.engineer || 'Balarathu').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + // Include BOM for Excel Unicode compatibility
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Project_Planner_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export filtered tasks to real Excel (.xlsx) file
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredTasks.map((t) => ({
        'Date': t.date,
        'Project Name': t.project,
        'Activity Category': labels[t.category],
        'Work Summary Description': t.description,
        'Hours Spent': t.timeSpent,
        'Status': t.status,
        'Completed Date': t.completedDate || '',
        'Engineer Info': t.engineer || 'Balarathu'
      }));

      // Create a worksheet
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      
      // Auto-fit column widths elegantly
      const maxLens = dataToExport.reduce((acc, row) => {
        Object.keys(row).forEach((key) => {
          const valStr = String(row[key as keyof typeof row] || '');
          acc[key] = Math.max(acc[key] || key.length, valStr.length);
        });
        return acc;
      }, {} as Record<string, number>);

      worksheet['!cols'] = Object.keys(maxLens).map((key) => ({
        wch: Math.min(Math.max(maxLens[key] + 3, 11), 60)
      }));

      // Create a new workbook and append the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Logged Operations');

      // Write and download the .xlsx file
      XLSX.writeFile(workbook, `Project_Planner_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Failed to export Excel file:', err);
      alert('Failed to generate Excel file, falling back to CSV export.');
      handleExportCSV();
    }
  };

  // Import from CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) return;

        const lines = text.split('\n');
        if (lines.length <= 1) return;

        const importedList: TaskEntry[] = [];
        // Skip first row (headers)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Simple CSV parser supporting quotes
          const cells: string[] = [];
          let currentCell = '';
          let insideQuote = false;

          for (let c = 0; c < line.length; c++) {
            const char = line[c];
            if (char === '"') {
              insideQuote = !insideQuote;
            } else if (char === ',' && !insideQuote) {
              cells.push(currentCell.trim());
              currentCell = '';
            } else {
              currentCell += char;
            }
          }
          cells.push(currentCell.trim());

          if (cells.length >= 6) {
            const [dateRaw, projectRaw, categoryLabel, descriptionRaw, hoursRaw, statusRaw, completedDateRaw] = cells;

            // Map category label back to enum
            let category: TaskCategory = 'PROJECT_TRACK';
            for (const [key, val] of Object.entries(labels)) {
              if (val.toLowerCase() === categoryLabel.toLowerCase() || key === categoryLabel) {
                category = key as TaskCategory;
                break;
              }
            }

            // Extract values
            const cleanProject = projectRaw.replace(/^"(.*)"$/, '$1');
            const cleanDescription = descriptionRaw.replace(/^"(.*)"$/, '$1');
            const hours = parseFloat(hoursRaw) || 1;
            const status = (statusRaw === 'Completed' || statusRaw === 'Blocked' || statusRaw === 'In Progress')
              ? statusRaw
              : 'In Progress';

            importedList.push({
              id: 'imp_' + Math.random().toString(36).substr(2, 9),
              date: dateRaw || new Date().toISOString().split('T')[0],
              project: cleanProject || 'General Office',
              category,
              description: cleanDescription,
              timeSpent: hours,
              status,
              completedDate: completedDateRaw || (status === 'Completed' ? dateRaw : undefined),
            });
          }
        }

        if (importedList.length > 0) {
          onBulkImport(importedList);
          alert(`Successfully imported ${importedList.length} tasks from CSV!`);
        } else {
          alert('No valid rows found in the CSV. Please make sure the header names match the export structure.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse CSV file. Ensure standard format.');
      }
    };
    reader.readAsText(file);
  };

  // Stats calculation
  const totalHoursFiltered = filteredTasks.reduce((sum, t) => sum + t.timeSpent, 0);

  return (
    <div id="sheet_view_container" className="flex flex-col gap-6">
      {/* Search and Filters Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Spreadsheet Manager</h2>
            <p className="text-xs text-slate-500 mt-0.5">Edit, filter, search and import/export task data</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Export to Excel (.xlsx)
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Export to CSV
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportCSV}
              accept=".csv"
              className="hidden"
            />
          </div>
        </div>

        {/* Dynamic Filters Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search description/project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
            >
              <option value="ALL">All Categories</option>
              {(Object.keys(labels) as TaskCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {labels[cat]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
            >
              <option value="ALL">All Projects</option>
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
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

          <div>
            <select
              value={filterEngineer}
              onChange={(e) => setFilterEngineer(e.target.value)}
              disabled={currentUser?.role === 'engineer'}
              className="w-full bg-slate-50/50 border border-indigo-200 focus:border-indigo-550 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              <option value="ALL">All Engineers (Tracking)</option>
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
        </div>

        {/* Dynamic calculations list */}
        <div className="flex flex-wrap gap-4 mt-4 text-[11px] font-mono border-t border-slate-100 pt-3 text-slate-500">
          <div>
            Found: <span className="text-slate-800 font-bold">{filteredTasks.length}</span> entries
          </div>
          <div>
            Total Filtered Hours: <span className="text-slate-800 font-bold">{totalHoursFiltered} hrs</span>
          </div>
          <div>
            Average Hours/Entry:{' '}
            <span className="text-slate-800 font-bold">
              {filteredTasks.length ? (totalHoursFiltered / filteredTasks.length).toFixed(1) : 0} hrs
            </span>
          </div>
        </div>
      </div>

      {/* Spreadsheet grid table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto font-sans">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <th className="p-3 w-32 border-r border-slate-200/50">Date</th>
              <th className="p-3 w-40 border-r border-slate-200/50">Project</th>
              <th className="p-3 w-40 border-r border-slate-200/50">Category</th>
              <th className="p-3 w-36 border-r border-slate-200/50">Log Author</th>
              <th className="p-3 border-r border-slate-200/50">Activity Description</th>
              <th className="p-3 w-20 text-center border-r border-slate-200/50">Hours</th>
              <th className="p-3 w-32 border-r border-slate-200/50">Status</th>
              <th className="p-3 w-24 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-xs text-slate-700">
            {/* INLINE QUICK ADD ROW */}
            <tr className="bg-indigo-50/20 group">
              <td className="p-1 border-r border-slate-250">
                <input
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded p-1 text-xs"
                />
              </td>
              <td className="p-1 border-r border-slate-250">
                <select
                  value={quickProject}
                  onChange={(e) => setQuickProject(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded p-1 text-xs"
                >
                  {projects.map((proj) => (
                    <option key={proj} value={proj}>
                      {proj}
                    </option>
                  ))}
                  <option value="Office Work">General Office Work</option>
                  <option value="General Support">General Support</option>
                </select>
              </td>
              <td className="p-1 border-r border-slate-250">
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
                  className="w-full bg-white border border-slate-200 rounded p-1 text-xs"
                >
                  {(Object.keys(labels) as TaskCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {labels[cat]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-1 border-r border-slate-250">
                {currentUser && (currentUser.role === 'manager' || currentUser.role === 'admin') ? (
                  <select
                    value={quickEngineer}
                    onChange={(e) => setQuickEngineer(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1 text-xs font-mono font-bold text-indigo-700 cursor-pointer"
                  >
                    {usersList && usersList.length > 0 ? (
                      usersList.map((user) => (
                        <option key={user.username} value={user.name}>
                          {user.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Balarathu">Balarathu</option>
                        <option value="Sarah Thompson">Sarah Thompson</option>
                        <option value="Markus V">Markus V</option>
                        <option value="Admin User">Admin User</option>
                      </>
                    )}
                  </select>
                ) : (
                  <div className="text-center font-bold font-mono text-indigo-600 text-[10px] select-none p-1.5">
                    {quickEngineer}
                  </div>
                )}
              </td>
              <td className="p-1 border-r border-slate-250">
                <form id="quick_add_form" onSubmit={handleQuickAdd} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="+ Quick log a task then press Enter..."
                    value={quickDesc}
                    onChange={(e) => setQuickDesc(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1 text-xs outline-none focus:border-indigo-500"
                  />
                </form>
              </td>
              <td className="p-1 border-r border-slate-250">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={quickHours}
                  onChange={(e) => setQuickHours(Number(e.target.value))}
                  className="w-full text-center bg-white border border-slate-200 rounded p-1 text-xs"
                />
              </td>
              <td className="p-1 border-r border-slate-250">
                <select
                  value={quickStatus}
                  onChange={(e) => setQuickStatus(e.target.value as TaskEntry['status'])}
                  className="w-full bg-white border border-slate-200 rounded p-1 text-xs"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </td>
              <td className="p-1 text-center">
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded transition"
                  title="Quick Save Row"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </td>
            </tr>

            {/* TASKS ITERATION */}
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-slate-400 font-medium">
                  No tasks found matching current database filters.
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => {
                const isEditing = editingId === task.id;

                if (isEditing) {
                  return (
                    <tr key={task.id} className="bg-amber-50/20">
                      <td className="p-1 border-r border-slate-200/50">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded p-1 text-xs font-mono"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200/50">
                        <select
                          value={editProject}
                          onChange={(e) => setEditProject(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded p-1 text-xs"
                        >
                          {projects.map((proj) => (
                            <option key={proj} value={proj}>
                              {proj}
                            </option>
                          ))}
                          <option value="Office Work">General Office Work</option>
                          <option value="General Support">General Support</option>
                        </select>
                      </td>
                      <td className="p-1 border-r border-slate-200/50">
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as TaskCategory)}
                          className="w-full bg-white border border-slate-250 rounded p-1 text-xs"
                        >
                          {(Object.keys(labels) as TaskCategory[]).map((cat) => (
                            <option key={cat} value={cat}>
                              {labels[cat]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1 border-r border-slate-200/50">
                        {currentUser && (currentUser.role === 'manager' || currentUser.role === 'admin') ? (
                          <select
                            value={editEngineer}
                            onChange={(e) => setEditEngineer(e.target.value)}
                            className="w-full bg-white border border-slate-250 rounded p-1 text-xs font-mono font-bold text-indigo-700 cursor-pointer"
                          >
                            {usersList && usersList.length > 0 ? (
                              usersList.map((user) => (
                                <option key={user.username} value={user.name}>
                                  {user.name}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="Balarathu">Balarathu</option>
                                <option value="Sarah Thompson">Sarah Thompson</option>
                                <option value="Markus V">Markus V</option>
                                <option value="Admin User">Admin User</option>
                              </>
                            )}
                          </select>
                        ) : (
                          <div className="text-center font-bold font-mono text-indigo-650 text-[10px] select-none p-1.5">
                            {editEngineer}
                          </div>
                        )}
                      </td>
                      <td className="p-1 border-r border-slate-200/50">
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded p-1 text-xs"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200/50">
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="24"
                          value={editTimeSpent}
                          onChange={(e) => setEditTimeSpent(Number(e.target.value))}
                          className="w-full text-center bg-white border border-slate-250 rounded p-1 text-xs font-mono"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200/50">
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as TaskEntry['status'])}
                          className="w-full bg-white border border-slate-250 rounded p-1 text-xs font-mono"
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                      </td>
                      <td className="p-1 text-center space-x-1">
                        <button
                          onClick={saveEditing}
                          className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-1.5 py-0.5 rounded shadow transition cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-[10px] bg-slate-550 hover:bg-slate-650 text-white px-1.5 py-0.5 rounded shadow transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={task.id} className="hover:bg-slate-50 border-b border-slate-100 transition">
                    {/* Date */}
                    <td className="p-3 border-r border-slate-100 font-mono text-slate-500">{task.date}</td>

                    {/* Project */}
                    <td className="p-3 border-r border-slate-100 font-semibold text-slate-700">{task.project}</td>

                    {/* Category Column */}
                    <td className="p-3 border-r border-slate-100">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CATEGORY_COLORS[task.category]}`}>
                        {labels[task.category]}
                      </span>
                    </td>

                    {/* Log Author / Engineer */}
                    <td className="p-3 border-r border-slate-100 font-semibold font-mono text-indigo-600">{task.engineer || 'Balarathu'}</td>

                    {/* Description Text */}
                    <td className="p-3 border-r border-slate-100 text-slate-600 leading-relaxed max-w-sm break-words whitespace-pre-wrap">
                      {task.description}
                    </td>

                    {/* Hours Spent */}
                    <td className="p-3 border-r border-slate-100 font-mono text-center font-bold text-slate-700">
                      {task.timeSpent}
                    </td>

                    {/* Status badge and actions */}
                    <td className="p-3 border-r border-slate-100">
                      <div className="flex items-center gap-1.5 font-medium">
                        {task.status === 'Completed' ? (
                          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 fill-emerald-100" /> Done
                          </span>
                        ) : task.status === 'Blocked' ? (
                          <span className="flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            <AlertCircle className="h-3 w-3 text-rose-500 fill-rose-50" /> Blocked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-indigo-750 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            <PlayCircle className="h-3 w-3 text-indigo-655" /> Working
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions tools */}
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => startEditing(task)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                          title="Modify Entry"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                          title="Delete Entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
