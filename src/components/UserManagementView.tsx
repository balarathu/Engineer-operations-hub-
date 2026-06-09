import React, { useState } from 'react';
import { AppUser, TaskEntry, ProjectInfo, TaskCategory, encryptPassword, decryptPassword } from '../types';
import {
  User,
  Users,
  Shield,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Check,
  Clock,
  Briefcase,
  Layers,
  Key,
  Eye,
  EyeOff,
  Settings,
  Info
} from 'lucide-react';

interface UserManagementViewProps {
  currentUser: AppUser;
  usersList: AppUser[];
  tasks: TaskEntry[];
  projects: ProjectInfo[];
  onUpdateUser: (username: string, updated: AppUser) => void;
  onAddUser: (newUser: AppUser) => void;
  onDeleteUser: (username: string) => void;
  onUpdateCurrentUser: (updated: AppUser) => void;
  categoryLabels: Record<TaskCategory, string>;
  presets: any[];
  onUpdateCategoryLabels: (updated: Record<TaskCategory, string>) => void;
  onUpdatePresets: (updated: any[]) => void;
}

export default function UserManagementView({
  currentUser,
  usersList,
  tasks,
  projects,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  onUpdateCurrentUser,
  categoryLabels,
  presets,
  onUpdateCategoryLabels,
  onUpdatePresets,
}: UserManagementViewProps) {
  // Tabs: 'profile' (all users have it) | 'directory' (only manager/admin have it) | 'configuration' (only admin has it)
  const isManagerOrAdmin = currentUser.role === 'manager' || currentUser.role === 'admin';
  const isAdmin = currentUser.role === 'admin';
  const [subTab, setSubTab] = useState<'profile' | 'directory' | 'configuration'>(
    isAdmin ? 'configuration' : (isManagerOrAdmin ? 'directory' : 'profile')
  );

  // Local states for system hub configuration
  const [localCategories, setLocalCategories] = useState<Record<string, string>>(() => ({ ...categoryLabels }));
  const [localPresets, setLocalPresets] = useState<any[]>(() => JSON.parse(JSON.stringify(presets)));
  const [configSuccess, setConfigSuccess] = useState('');

  // Directory editing state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);

  // Password visibility states
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const togglePasswordVisibility = (username: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [username]: !prev[username] }));
  };

  // New user form states
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'engineer'>('engineer');
  const [newDesignation, setNewDesignation] = useState('');
  const [newInitials, setNewInitials] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState('');

  // Editing existing user details states
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'manager' | 'engineer'>('engineer');
  const [editDesignation, setEditDesignation] = useState('');
  const [editInitials, setEditInitials] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Profile Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileDesignation, setProfileDesignation] = useState(currentUser.designation);
  const [profileInitials, setProfileInitials] = useState(currentUser.avatarInitials);
  const [profilePassword, setProfilePassword] = useState(() => {
    const raw = currentUser.password || localStorage.getItem(`pw_${currentUser.username}`);
    return decryptPassword(raw, `${currentUser.username}123`);
  });
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Stats for the active profile user
  const userTasks = tasks.filter((t) => (t.engineer || 'Balarathu') === currentUser.name);
  const totalHoursWorked = userTasks.reduce((sum, t) => sum + t.timeSpent, 0);
  const userProjects = projects.filter((p) => p.assignedEngineers?.includes(currentUser.name));

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    if (!profileName.trim() || !profileInitials.trim()) {
      return;
    }

    const updated: AppUser = {
      ...currentUser,
      name: profileName.trim(),
      designation: profileDesignation.trim() || 'Project Engineer',
      avatarInitials: profileInitials.trim().substring(0, 2).toUpperCase(),
    };

    if (profilePassword.trim()) {
      const enc = encryptPassword(profilePassword.trim());
      updated.password = enc;
      localStorage.setItem(`pw_${currentUser.username}`, enc);
    }

    onUpdateCurrentUser(updated);
    setIsEditingProfile(false);
    setProfileSuccessMsg('Profile details successfully updated.');
    setTimeout(() => setProfileSuccessMsg(''), 4000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const formattedUsername = newUsername.trim().toLowerCase();
    if (!formattedUsername || !newName.trim()) {
      setFormError('Please fill in username and full name.');
      return;
    }

    // Check duplication
    if (usersList.some((u) => u.username.toLowerCase() === formattedUsername)) {
      setFormError('Username has already been claimed.');
      return;
    }

    const computedInitials = newInitials.trim() || newName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

    const newUser: AppUser = {
      username: formattedUsername,
      name: newName.trim(),
      role: newRole,
      designation: newDesignation.trim() || `${newRole.toUpperCase()} member`,
      avatarInitials: computedInitials,
    };

    const chosenPassword = newPassword.trim() || `${formattedUsername}123`;
    newUser.password = encryptPassword(chosenPassword);

    onAddUser(newUser);

    // Initial default or customized password setup
    localStorage.setItem(`pw_${formattedUsername}`, encryptPassword(chosenPassword));

    // Reset Form
    setNewUsername('');
    setNewName('');
    setNewRole('engineer');
    setNewDesignation('');
    setNewInitials('');
    setNewPassword('');
    setIsAddingUser(false);
  };

  const startEditUser = (user: AppUser) => {
    setEditingUsername(user.username);
    setEditName(user.name);
    setEditRole(user.role);
    setEditDesignation(user.designation);
    setEditInitials(user.avatarInitials);
    const rawPw = user.password || localStorage.getItem(`pw_${user.username}`);
    setEditPassword(decryptPassword(rawPw, `${user.username}123`));
  };

  const saveEditUser = (username: string) => {
    if (!editName.trim() || !editInitials.trim()) return;

    const matched = usersList.find((u) => u.username === username);
    if (!matched) return;

    const updated: AppUser = {
      ...matched,
      name: editName.trim(),
      role: editRole,
      designation: editDesignation.trim(),
      avatarInitials: editInitials.trim().substring(0, 2).toUpperCase(),
    };

    if (editPassword.trim()) {
      const enc = encryptPassword(editPassword.trim());
      updated.password = enc;
      localStorage.setItem(`pw_${username}`, enc);
    }

    onUpdateUser(username, updated);
    setEditingUsername(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in p-6">
      
      {/* View Header with Toggle tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            User Access & Profiles
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isManagerOrAdmin ? "Manage corporate engineers, credentials, and adjust operation bounds." : "View your technical stats, details, and adjust profile tags."}
          </p>
        </div>

        {isManagerOrAdmin && (
          <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setSubTab('directory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                subTab === 'directory'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" /> Staff Directory
            </button>
            <button
              onClick={() => setSubTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                subTab === 'profile'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="h-3.5 w-3.5" /> My Dynamic Profile
            </button>
            {isAdmin && (
              <button
                onClick={() => setSubTab('configuration')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  subTab === 'configuration'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Settings className="h-3.5 w-3.5 text-indigo-600" /> System Hub Config
              </button>
            )}
          </div>
        )}
      </div>

      {subTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Profile Card & Stats column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-150 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {currentUser.role}
              </div>
              
              <div className="w-16 h-16 rounded-full bg-indigo-600 text-white text-xl font-bold flex items-center justify-center uppercase shadow-md mb-3 border-4 border-white">
                {currentUser.avatarInitials}
              </div>

              <h3 className="font-bold text-slate-800 text-sm">{currentUser.name}</h3>
              <p className="text-xs text-slate-400 font-medium mb-4">{currentUser.designation}</p>

              <div className="w-full border-t border-slate-200/60 pt-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Logged Output:
                  </span>
                  <span className="font-bold text-slate-800 font-mono">{totalHoursWorked} hrs</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-slate-400" /> Task Entries:
                  </span>
                  <span className="font-bold text-slate-800 font-mono">{userTasks.length} logs</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" /> Projects Assigned:
                  </span>
                  <span className="font-bold text-indigo-600">{userProjects.length} active</span>
                </div>
              </div>
            </div>

            {/* List of assigned projects */}
            <div className="bg-white rounded-xl p-4 border border-slate-150 space-y-2.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> Working Projects Context
              </h4>
              <div className="space-y-1.5">
                {userProjects.length === 0 ? (
                  <p className="text-[11px] text-slate-450 italic">Not directly assigned to custom projects. View dynamic office tasks instead.</p>
                ) : (
                  userProjects.map((p) => (
                    <div key={p.name} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">{p.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 select-none border rounded ${
                        p.status === 'On Track' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-150 rounded-2xl p-5 sm:p-6 space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit2 className="h-3.5 w-3.5 text-indigo-500" /> Account & Profile Settings
                </h3>
                {!isEditingProfile ? (
                  <button
                    onClick={() => {
                      setProfileName(currentUser.name);
                      setProfileDesignation(currentUser.designation);
                      setProfileInitials(currentUser.avatarInitials);
                      setIsEditingProfile(true);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    Edit Profile Details
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {profileSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs py-2 px-3 rounded-lg flex items-center gap-2">
                  <Check className="h-4 w-4" /> {profileSuccessMsg}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">Username Profile</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.username}
                      className="w-full mt-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 font-mono font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">Author Name (Full)</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full mt-1.5 bg-white border border-slate-250 text-xs rounded-xl p-2.5 font-medium outline-none focus:border-indigo-500 transition disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">Role level</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.role.toUpperCase()}
                      className="w-full mt-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 font-mono font-bold text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">Avatar Initials</label>
                    <input
                      type="text"
                      disabled={!isEditingProfile}
                      required
                      maxLength={2}
                      value={profileInitials}
                      onChange={(e) => setProfileInitials(e.target.value)}
                      className="w-full mt-1.5 bg-white border border-slate-250 text-xs rounded-xl p-2.5 font-bold font-mono outline-none focus:border-indigo-500 transition disabled:bg-slate-50 disabled:cursor-not-allowed uppercase"
                    />
                  </div>
                </div>

                 <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Technical Designation</label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={profileDesignation}
                    onChange={(e) => setProfileDesignation(e.target.value)}
                    className="w-full mt-1.5 bg-white border border-slate-250 text-xs rounded-xl p-2.5 font-medium outline-none focus:border-indigo-500 transition disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
                    <Key className="h-4 w-4 text-indigo-500" /> Account Security Passcode
                  </div>
                  <div className="flex gap-2 relative">
                    <input
                      type={showProfilePassword ? "text" : "password"}
                      disabled={!isEditingProfile}
                      placeholder="Passcode to sign-in"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      className="flex-1 bg-white border border-slate-250 text-xs rounded-xl p-2.5 outline-none focus:border-indigo-500 transition disabled:bg-slate-50 disabled:cursor-not-allowed font-medium font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowProfilePassword(!showProfilePassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
                      title={showProfilePassword ? "Hide passcode" : "Show passcode"}
                    >
                      {showProfilePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Specify your secure passcode to sign in. Default is <span className="font-mono">{currentUser.username}123</span>.</p>
                </div>

                {isEditingProfile && (
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="text-slate-500 bg-slate-100 hover:bg-slate-200 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5" /> Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {subTab === 'directory' && (
        <div className="space-y-6">
          
          {/* Controls section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Corporate Hub Directory</span>
              <p className="text-[11px] text-slate-450">Active Engineers and Project Team member records</p>
            </div>
            
            <button
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 text-slate-700 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> {isAddingUser ? 'Collapse Form' : 'Register New Employee'}
            </button>
          </div>

          {/* New User Creator collapse */}
          {isAddingUser && (
            <form onSubmit={handleCreateUser} className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4 animate-fade-in">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 pb-2 border-b border-slate-200/50">
                <Users className="h-3.5 w-3.5 text-indigo-500" /> Employee Registration Protocol
              </h3>

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs py-1.5 px-3 rounded-lg font-bold">
                  Error: {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Username ID (lowercase)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. jsmith"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Smith"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Role Level</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="engineer">Engineer (Operational log limits)</option>
                    <option value="manager">Manager (Approve logs & assign projects)</option>
                    <option value="admin">Admin (System privilege limits)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Technical Designation / Role title</label>
                  <input
                    type="text"
                    placeholder="e.g. Automation Engineer"
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Avatar Initials (Optional)</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="e.g. JS"
                    value={newInitials}
                    onChange={(e) => setNewInitials(e.target.value.toUpperCase())}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-indigo-550" /> Account Security Passcode (Optional)
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Default is username123"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 pr-10 text-xs outline-none focus:border-indigo-500 font-mono font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
                      title={showNewPassword ? "Hide passcode" : "Show passcode"}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-3.5 py-1.5 bg-slate-200 text-slate-650 hover:bg-slate-350 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-lg transition shadow cursor-pointer"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          )}

          {/* User spreadsheet of staff */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 select-none uppercase text-[10px]">
                  <th className="p-3">Avatar</th>
                  <th className="p-3">Username ID</th>
                  <th className="p-3">Full Employee Name</th>
                  <th className="p-3">Role Authority</th>
                  <th className="p-3">Designation & Passcode</th>
                  <th className="p-3 text-center">Protocol Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((user) => {
                  const isEditing = editingUsername === user.username;
                  const canSelfModifyPrivilege = currentUser.username !== user.username; 
                  return (
                    <tr key={user.username} className="hover:bg-slate-50/50 transition">
                      {/* Avatar initials badge */}
                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="text"
                            maxLength={2}
                            value={editInitials}
                            onChange={(e) => setEditInitials(e.target.value.toUpperCase())}
                            className="w-12 border border-slate-200 rounded p-1 text-center font-mono font-bold text-indigo-700 bg-white"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center uppercase border border-slate-200">
                            {user.avatarInitials}
                          </div>
                        )}
                      </td>

                      {/* Username key */}
                      <td className="p-3 font-mono font-bold text-slate-500">
                        {user.username}
                      </td>

                      {/* Display name */}
                      <td className="p-3 font-semibold text-slate-800">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="border border-slate-200 rounded p-1 text-xs font-semibold text-slate-800 bg-white w-full max-w-[150px]"
                          />
                        ) : (
                          <span>{user.name}</span>
                        )}
                      </td>

                      {/* Role level authority */}
                      <td className="p-3">
                        {isEditing ? (
                          <select
                            value={editRole}
                            disabled={!canSelfModifyPrivilege}
                            onChange={(e) => setEditRole(e.target.value as any)}
                            className="border border-slate-200 rounded p-1 text-xs font-bold text-slate-700 bg-white"
                          >
                            <option value="engineer">Engineer</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 border rounded-full select-none ${
                            user.role === 'admin' 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : user.role === 'manager' 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </td>

                      {/* Designation and job tasks */}
                      <td className="p-3 font-medium text-slate-500">
                        {isEditing ? (
                          <div className="space-y-1.5 min-w-[150px]">
                            <input
                              type="text"
                              value={editDesignation}
                              onChange={(e) => setEditDesignation(e.target.value)}
                              className="border border-slate-200 rounded p-1 text-xs text-slate-650 bg-white w-full max-w-[180px]"
                              placeholder="Designation"
                            />
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-bold uppercase">
                              <Key className="h-3 w-3 text-indigo-500" /> Passcode:
                            </div>
                            <div className="relative max-w-[180px]">
                              <input
                                type={showEditPassword ? "text" : "password"}
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                className="border border-slate-200 rounded p-1 pr-7 text-xs font-mono font-bold text-slate-700 bg-white w-full"
                                placeholder="Passcode"
                              />
                              <button
                                type="button"
                                onClick={() => setShowEditPassword(!showEditPassword)}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
                                title={showEditPassword ? "Hide passcode" : "Show passcode"}
                              >
                                {showEditPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-700">{user.designation}</div>
                            <div className="text-[10px] text-slate-450 font-medium flex items-center gap-1.5 mt-0.5">
                              <Key className="h-3 w-3 text-slate-400" /> Passcode: 
                              <span className="font-mono bg-slate-100 px-1 py-0.2 rounded font-bold text-slate-600">
                                {visiblePasswords[user.username] ? decryptPassword(localStorage.getItem(`pw_${user.username}`), `${user.username}123`) : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(user.username)}
                                className="text-slate-400 hover:text-indigo-600 transition"
                                title={visiblePasswords[user.username] ? "Hide passcode" : "Reveal passcode"}
                              >
                                {visiblePasswords[user.username] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Editing Actions */}
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => saveEditUser(user.username)}
                              className="p-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] flex items-center gap-0.5 cursor-pointer shadow-sm"
                              title="Save Changes"
                            >
                              <Check className="h-3 w-3" /> Save
                            </button>
                            <button
                              onClick={() => setEditingUsername(null)}
                              className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="h-3 w-3" /> Discard
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => startEditUser(user)}
                              className="text-indigo-600 hover:text-indigo-850 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              <Edit2 className="h-3 w-3" /> Edit
                            </button>
                            {/* Deletion check protection (cannot delete self) */}
                            {currentUser.username !== user.username && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you absolutely sure you want to remove the employee record for '${user.name}'? This will prevent them from logging tasks.`)) {
                                    onDeleteUser(user.username);
                                  }
                                }}
                                className="text-rose-500 hover:text-rose-700 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer ml-2"
                              >
                                <Trash2 className="h-3 w-3" /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'configuration' && isAdmin && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Status Message */}
          {configSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3 text-xs shadow-sm font-semibold">
              <Check className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>{configSuccess}</div>
            </div>
          )}

          {/* Section 1: Work Category Labels Editor */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-start gap-3 border-b border-slate-100 pb-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-sans">1. Edit Work Category Name Labels</h3>
                <p className="text-xs text-slate-500">Customize human-readable labels associated with the engineers' work classifications across all tables, calendars, and charts.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(localCategories).map((catKey) => (
                <div key={catKey} className="flex flex-col gap-1 bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{catKey}</span>
                  <input
                    type="text"
                    value={localCategories[catKey]}
                    onChange={(e) => {
                      setLocalCategories((prev) => ({
                        ...prev,
                        [catKey]: e.target.value,
                      }));
                    }}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:border-indigo-500 outline-none"
                    placeholder="Enter custom display label"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  onUpdateCategoryLabels(localCategories as any);
                  setConfigSuccess('Custom Work Categories saved successfully! View the Sheet, Calendar, or Dashboard views to see the dynamically updated titles instantly.');
                  setTimeout(() => setConfigSuccess(''), 6000);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" /> Save Category Labels
              </button>
            </div>
          </div>

          {/* Section 2: Quick Log Preset Customizer */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-start gap-3 border-b border-slate-100 pb-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Settings className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-sans">2. Configure Quick Log Preset Buttons</h3>
                <p className="text-xs text-slate-500">Tailor the 3 dynamic quick actions displayed in the engineer's sidebar. Define title description templates, custom project assignments, category tags, and duration parameters.</p>
              </div>
            </div>

            <div className="space-y-6">
              {localPresets.map((preset, idx) => (
                <div key={preset.id} className="border border-slate-150 rounded-xl p-4 bg-slate-50 relative">
                  <div className="absolute top-3 right-3 text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Sidebar Slot #{idx + 1}
                  </div>

                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-3">
                    Preset Object: <span className="text-indigo-600">{preset.label || 'Unnamed Preset'}</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mb-3">
                    {/* Emoji */}
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Emoji Icon</label>
                      <input
                        type="text"
                        value={preset.emoji || ''}
                        onChange={(e) => {
                          const updated = [...localPresets];
                          updated[idx].emoji = e.target.value;
                          setLocalPresets(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-center font-bold"
                        maxLength={2}
                      />
                    </div>

                    {/* Button Name Label */}
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Preset Display Label</label>
                      <input
                        type="text"
                        value={preset.label || ''}
                        onChange={(e) => {
                          const updated = [...localPresets];
                          updated[idx].label = e.target.value;
                          setLocalPresets(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-bold text-slate-700"
                        placeholder="E.g., Siemens ALM Upgrade"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-3">
                    {/* Project Selector / Text input */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pre-Assigned Project</label>
                      <select
                        value={preset.project || ''}
                        onChange={(e) => {
                          const updated = [...localPresets];
                          updated[idx].project = e.target.value;
                          setLocalPresets(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-semibold text-slate-755"
                      >
                        {projects.map((p) => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                        <option value="Office Work">Office Work</option>
                        <option value="General Support">General Support</option>
                      </select>
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Default Work Category</label>
                      <select
                        value={preset.category || ''}
                        onChange={(e) => {
                          const updated = [...localPresets];
                          updated[idx].category = e.target.value;
                          setLocalPresets(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-semibold text-slate-700"
                      >
                        {Object.entries(localCategories).map(([key, labelVal]) => (
                          <option key={key} value={key}>{labelVal}</option>
                        ))}
                      </select>
                    </div>

                    {/* Hours Logged */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Time Spent (In Hours)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="24"
                        value={preset.timeSpent || 1.5}
                        onChange={(e) => {
                          const updated = [...localPresets];
                          updated[idx].timeSpent = parseFloat(e.target.value) || 1.0;
                          setLocalPresets(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-semibold text-slate-700 font-mono"
                      />
                    </div>
                  </div>

                  {/* Description template */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description Template / Activity Log Text</label>
                    <textarea
                      rows={2}
                      value={preset.description || ''}
                      onChange={(e) => {
                        const updated = [...localPresets];
                        updated[idx].description = e.target.value;
                        setLocalPresets(updated);
                      }}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-600 leading-normal"
                      placeholder="Enter detailed template explanation..."
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  onUpdatePresets(localPresets);
                  setConfigSuccess('Quick Log Presets saved successfully! Engineers will now instantly log operational tasks with your customized settings.');
                  setTimeout(() => setConfigSuccess(''), 6000);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" /> Save Sidebar Presets
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
