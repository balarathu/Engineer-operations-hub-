import React from 'react';
import { TaskEntry, TaskCategory, CATEGORY_LABELS, ProjectInfo, AppUser } from '../types';
import {
  Clock,
  TrendingUp,
  Sliders,
  CheckCircle,
  FileBadge,
  Sparkles,
  Layers,
  ShoppingBag,
  Heart,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Save,
  X
} from 'lucide-react';

interface DashboardViewProps {
  tasks: TaskEntry[];
  projects: ProjectInfo[];
  onAddProject: (proj: ProjectInfo) => void;
  onDeleteProject: (name: string) => void;
  onUpdateProjectStatus: (name: string, status: ProjectInfo['status']) => void;
  onUpdateProject: (oldName: string, updated: ProjectInfo) => void;
  currentUser?: AppUser;
  categoryLabels?: Record<TaskCategory, string>;
  usersList?: AppUser[];
}

export default function DashboardView({
  tasks,
  projects,
  onAddProject,
  onDeleteProject,
  onUpdateProjectStatus,
  onUpdateProject,
  currentUser,
  categoryLabels,
  usersList,
}: DashboardViewProps) {
  const labels = categoryLabels || CATEGORY_LABELS;
  // New project states
  const [newProjName, setNewProjName] = React.useState('');
  const [newProjDesc, setNewProjDesc] = React.useState('');
  const [newProjStatus, setNewProjStatus] = React.useState<ProjectInfo['status']>('On Track');
  const [isAddingProject, setIsAddingProject] = React.useState(false);
  const [selectedEngineers, setSelectedEngineers] = React.useState<string[]>([]);

  // Project editing state
  const [editingProjectName, setEditingProjectName] = React.useState<string | null>(null);
  const [editProjName, setEditProjName] = React.useState('');
  const [editProjDesc, setEditProjDesc] = React.useState('');
  const [editProjStatus, setEditProjStatus] = React.useState<ProjectInfo['status']>('On Track');
  const [editProjAssigned, setEditProjAssigned] = React.useState<string[]>([]);

  const startEditingProject = (proj: ProjectInfo) => {
    setEditingProjectName(proj.name);
    setEditProjName(proj.name);
    setEditProjDesc(proj.description);
    setEditProjStatus(proj.status);
    setEditProjAssigned(proj.assignedEngineers || [proj.leadEngineer]);
  };

  const handleSaveProjectEdit = (oldName: string) => {
    if (!editProjName.trim()) return;
    onUpdateProject(oldName, {
      name: editProjName.trim(),
      status: editProjStatus,
      leadEngineer: editProjAssigned[0] || 'Balarathu',
      description: editProjDesc.trim(),
      assignedEngineers: editProjAssigned,
    });
    setEditingProjectName(null);
  };

  const handleToggleEditEngineerSelected = (name: string) => {
    setEditProjAssigned((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };


  const handleToggleEngineerSelected = (name: string) => {
    setSelectedEngineers((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    // Auto-include current user if they are an engineer
    let assigned = [...selectedEngineers];
    if (currentUser && currentUser.role === 'engineer' && !assigned.includes(currentUser.name)) {
      assigned.push(currentUser.name);
    }
    // Default fallback if empty
    if (assigned.length === 0) {
      assigned = [currentUser?.name || 'Balarathu'];
    }

    onAddProject({
      name: newProjName.trim(),
      status: newProjStatus,
      leadEngineer: assigned[0] || currentUser?.name || 'Balarathu',
      description: newProjDesc.trim() || 'No description provided.',
      assignedEngineers: assigned,
    });

    setNewProjName('');
    setNewProjDesc('');
    setSelectedEngineers([]);
    setIsAddingProject(false);
  };

  // Time aggregate metrics
  const totalHoursLogged = tasks.reduce((sum, t) => sum + t.timeSpent, 0);
  const completedTasks = tasks.filter((t) => t.status === 'Completed');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 105) : 0; // standard ceiling formatting

  // Track counts for specific engineer responsibilities
  const licenseTransfersCount = tasks.filter((t) => t.category === 'LICENSE_TRANSFER').length;
  const salesSupportCount = tasks.filter((t) => t.category === 'SALES_SUPPORT').length;
  const onlineSupportCount = tasks.filter((t) => t.category === 'ONLINE_SUPPORT').length;
  const customerEmailCount = tasks.filter((t) => t.category === 'CUSTOMER_EMAIL').length;

  // 1. Group tasks by date for the last 7 distinct dates
  const uniqueDatesSorted = Array.from(new Set(tasks.map((t) => t.date))).sort().slice(-7);
  const chartData = uniqueDatesSorted.map((date) => {
    const dailyTasks = tasks.filter((t) => t.date === date);
    const dayTotal = dailyTasks.reduce((sum, t) => sum + t.timeSpent, 0);
    return {
      date,
      label: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
      hours: dayTotal,
    };
  });

  // Calculate high-bound for scaling the SVG chart (minimum scale height of 8 hours)
  const maxHoursInChart = Math.max(...chartData.map((d) => d.hours), 8);

  // 2. Group hours by Category for visual bar breakdown
  const categoryHrsMap: Record<TaskCategory, number> = {
    PROJECT_TRACK: 0,
    SALES_SUPPORT: 0,
    ONLINE_SUPPORT: 0,
    LICENSE_TRANSFER: 0,
    CUSTOMER_EMAIL: 0,
    OTHER: 0,
  };
  tasks.forEach((t) => {
    categoryHrsMap[t.category] += t.timeSpent;
  });

  const categoryShares = (Object.keys(categoryHrsMap) as TaskCategory[]).map((cat) => {
    const hrs = categoryHrsMap[cat];
    const pct = totalHoursLogged > 0 ? Math.round((hrs / totalHoursLogged) * 100) : 0;
    return { category: cat, hours: hrs, percent: pct };
  }).sort((a, b) => b.hours - a.hours);

  return (
    <div id="dashboard_view" className="space-y-6">
      {/* KPI Overviews Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Core total Hours KPI */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Output</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-slate-800">{totalHoursLogged}</span>
              <span className="text-xs text-slate-500 font-mono">hours</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">across all logged activities</p>
          </div>
        </div>

        {/* Completion Gauge Percentage */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Completion Rate</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-slate-800">{completionRate}%</span>
              <span className="text-xs text-slate-500 font-mono">Done</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {completedTasks.length} of {tasks.length} tasks resolved
            </p>
          </div>
        </div>

        {/* Sales Response Task Counter */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition flex items-center gap-4">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Office & Requests</span>
            <div className="flex gap-4 mt-1">
              <div>
                <div className="text-sm font-bold text-slate-800">{salesSupportCount}</div>
                <div className="text-[9px] text-slate-500 font-bold">Sales Q&A</div>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <div className="text-sm font-bold text-slate-800">{licenseTransfersCount}</div>
                <div className="text-[9px] text-slate-500 font-bold">ALM Licenses</div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Client requests & quote responses</p>
          </div>
        </div>

        {/* Support Loop Counters */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Customer Care</span>
            <div className="flex gap-4 mt-1">
              <div>
                <div className="text-sm font-bold text-slate-800">{onlineSupportCount}</div>
                <div className="text-[9px] text-slate-500 font-bold">Online Support</div>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <div className="text-sm font-bold text-slate-800">{customerEmailCount}</div>
                <div className="text-[9px] text-slate-500 font-bold">Emails Sent</div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Support logs & email threads</p>
          </div>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Recent Activity (SVG Bar Chart) */}
        <div className="lg:col-span-3 bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-indigo-500" /> Daily Workload Distribution (Active Days)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Total hours of execution logged across recent calendars</p>
          </div>

          <div className="h-64 mt-6 flex items-end justify-between px-2 pt-4 pb-2 border-b border-l border-slate-100 relative">
            {chartData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                No calendar dates logged to build analytics yet.
              </div>
            ) : (
              chartData.map((d, i) => {
                const barHeightPct = (d.hours / maxHoursInChart) * 80 + 10; // offset so even 0 has minor presence or cap size
                return (
                  <div key={i} className="flex flex-col items-center justify-end flex-1 h-full gap-2 group cursor-pointer">
                    <span className="text-[10px] font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition duration-150 transform -translate-y-1">
                      {d.hours} hrs
                    </span>
                    <div
                      style={{ height: `${barHeightPct}%` }}
                      className="w-8 sm:w-10 bg-indigo-500 hover:bg-indigo-600 rounded-t-lg transition duration-200 shadow-inner relative"
                    >
                      {/* Gradient overlay on bar */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-white/10 rounded-t-lg" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 max-w-[50px] truncate text-center">
                      {d.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-2 text-right">
            <span className="text-[9px] font-mono text-slate-400">Peak scale: {maxHoursInChart.toFixed(1)} hrs/day</span>
          </div>
        </div>

        {/* Right Column: Time Spent Breakdown by Role Category */}
        <div className="lg:col-span-2 bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-emerald-500" /> Time Spent by Responsibility
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Aggregate hours tracked under distinct task divisions</p>
          </div>

          <div className="space-y-4 my-6">
            {categoryShares.map(({ category, hours, percent }) => {
              let barColor = 'bg-slate-400';
              if (category === 'PROJECT_TRACK') barColor = 'bg-emerald-500';
              if (category === 'SALES_SUPPORT') barColor = 'bg-indigo-500';
              if (category === 'ONLINE_SUPPORT') barColor = 'bg-cyan-500';
              if (category === 'LICENSE_TRANSFER') barColor = 'bg-amber-500';
              if (category === 'CUSTOMER_EMAIL') barColor = 'bg-sky-500';

              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{labels[category]}</span>
                    <span className="font-mono text-slate-500 font-medium">
                      {hours} hrs ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${percent}%` }} className={`h-full ${barColor} rounded-full transition-all duration-500`} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-150 flex items-center justify-between text-xs text-slate-600">
            <span>Primary Focus:</span>
            <span className="font-bold text-slate-800">
              {categoryShares[0]?.hours > 0 ? labels[categoryShares[0].category] : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Projects List & Creation Section */}
      <div id="projects_management" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Project Track Statuses</h3>
            <p className="text-xs text-slate-500 mt-0.5">Maintain, prioritize and register active engineer projects</p>
          </div>

          <button
            onClick={() => setIsAddingProject(!isAddingProject)}
            className="flex items-center gap-1 bg-indigo-650 hover:bg-indigo-700 text-slate-700 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" /> {isAddingProject ? 'Cancel' : 'Register Project'}
          </button>
        </div>

        {/* Add Project Form (Inline Collapse) */}
        {isAddingProject && (
          <form onSubmit={handleCreateProject} className="bg-slate-50 p-4 border border-slate-200 rounded-lg mb-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase">Register New Client or Factory Project</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Line 5 Conveyor Commissioning"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500">Initial Project Health</label>
                <select
                  value={newProjStatus}
                  onChange={(e) => setNewProjStatus(e.target.value as ProjectInfo['status'])}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
                >
                  <option value="On Track">On Track</option>
                  <option value="In Progress">In Progress (Active)</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500">Scope / Details</label>
              <textarea
                placeholder="Briefly explain technical deliverables, controller types involved, or customer sites..."
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
                rows={2}
                className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Assign Engineers to Project</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-3 border border-slate-200 rounded-lg">
                {((usersList && usersList.length > 0) ? usersList : [
                  { username: 'balarathu', name: 'Balarathu', avatarInitials: 'BL', designation: 'Senior Project Engineer', role: 'engineer' as const },
                  { username: 'sarah', name: 'Sarah Thompson', avatarInitials: 'ST', designation: 'Automation Engineer', role: 'engineer' as const },
                  { username: 'markus', name: 'Markus V', avatarInitials: 'MV', designation: 'Systems Specialist', role: 'engineer' as const },
                ]).map((eng) => {
                  const isChecked = selectedEngineers.includes(eng.name) || (currentUser?.role === 'engineer' && eng.name === currentUser.name);
                  const isReadOnly = currentUser?.role === 'engineer' && eng.name === currentUser.name;
                  return (
                    <label 
                      key={eng.username || eng.name} 
                      className={`flex items-center space-x-2.5 p-2 rounded-lg border transition text-xs font-medium cursor-pointer ${
                        isChecked 
                          ? 'border-indigo-500 bg-indigo-50/40 text-indigo-950 font-bold' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-650'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        disabled={isReadOnly}
                        onChange={() => handleToggleEngineerSelected(eng.name)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="leading-tight">
                        <p>{eng.name}</p>
                        <p className="text-[9px] text-slate-400 font-normal">{eng.designation}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Users assigned will be the only ones who can view, log, and filter tasks for this project.</p>
            </div>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded shadow transition cursor-pointer"
            >
              Add Project
            </button>
          </form>
        )}

        {/* Existing Projects Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map((proj) => {
            const isEditing = editingProjectName === proj.name;
            let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
            if (proj.status === 'On Track') badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            if (proj.status === 'At Risk') badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
            if (proj.status === 'Delayed') badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
            if (proj.status === 'Completed') badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';

            if (isEditing) {
              return (
                <div
                  key={proj.name}
                  className="border border-indigo-300 rounded-xl p-4 flex flex-col justify-between bg-white shadow-md animate-fade-in space-y-3"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase">Edit Project Details</span>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Project Name</label>
                      <input
                        type="text"
                        value={editProjName}
                        onChange={(e) => setEditProjName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none focus:border-indigo-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Description</label>
                      <textarea
                        value={editProjDesc}
                        onChange={(e) => setEditProjDesc(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Status</label>
                      <select
                        value={editProjStatus}
                        onChange={(e) => setEditProjStatus(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none focus:border-indigo-500 font-bold"
                      >
                        <option value="On Track">On Track</option>
                        <option value="Delayed">Delayed</option>
                        <option value="At Risk">At Risk</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Assign Team</label>
                      <div className="space-y-1 bg-slate-50 p-2 rounded border border-slate-200 text-[10px]">
                        {((usersList && usersList.length > 0) ? usersList.map((u) => u.name) : ['Balarathu', 'Sarah Thompson', 'Markus V']).map((engName) => {
                          const isAssigned = editProjAssigned.includes(engName);
                          return (
                            <label key={engName} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => handleToggleEditEngineerSelected(engName)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-slate-700 font-medium">{engName}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 border-t border-slate-100 pt-2.5">
                    <button
                      type="button"
                      onClick={() => setEditingProjectName(null)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-205 text-[10px] font-bold rounded text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveProjectEdit(proj.name)}
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold rounded text-white shadow-inner flex items-center gap-0.5 cursor-pointer"
                    >
                      <Save className="h-3 w-3" /> Save
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={proj.name}
                className="border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:border-slate-250 transition bg-slate-50/30"
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 ${badgeClass}`}>
                      {proj.status}
                    </span>
                    {proj.name !== 'Office Work' && proj.name !== 'General Support' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditingProject(proj)}
                          className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition"
                          title="Edit Project"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProject(proj.name)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                          title="Remove Project"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 mt-2.5 leading-tight">{proj.name}</h4>
                  <p className="text-xs text-slate-550 mt-1 lines-clamp-2 h-8 overflow-hidden leading-relaxed">
                    {proj.description}
                  </p>
                </div>

                <div className="mt-3 bg-slate-100 p-2 border border-slate-200 rounded-lg text-[10px] space-y-1 text-slate-500">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-200/50">
                    <span className="font-semibold text-slate-600">Assigned Team:</span>
                    <span className="font-bold text-[9px] bg-slate-200 px-1 py-0.2 rounded text-slate-700">
                      {(proj.assignedEngineers || [proj.leadEngineer]).length} active
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {(proj.assignedEngineers || [proj.leadEngineer]).map((engName, idx) => {
                      const initials = engName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                      return (
                        <span 
                          key={idx} 
                          title={`${engName} assigned`}
                          className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-[10px] text-slate-700 flex items-center gap-1 font-medium"
                        >
                          <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white text-[7px] font-bold flex items-center justify-center font-mono">
                            {initials}
                          </span>
                          <span className="truncate max-w-[60px]">{engName}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-mono">Lead: {proj.leadEngineer || 'Balarathu'}</span>
                  <select
                    value={proj.status}
                    onChange={(e) => onUpdateProjectStatus(proj.name, e.target.value as ProjectInfo['status'])}
                    className="bg-white border border-slate-200 rounded px-1 py-0.5 text-[9px] font-bold text-slate-600 outline-none"
                  >
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
