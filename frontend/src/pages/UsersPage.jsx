import { API_BASE_URL } from '../utils/apiConfig.js';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Clock,
  Calendar as CalendarIcon,
  Users,
  FileText,
  GitBranch,
  Settings,
  Plus,
  Search,
  X,
  ChevronDown,
  Moon,
  Sun,
  Cross,
  Sparkles,
  HelpCircle,
  MoreVertical,
  Edit3,
  Trash2,
  UserCheck,
  Shield,
  Stethoscope,
  Mail,
  Phone,
  UserPlus,
  CalendarOff,
  KeyRound,
  Lock,
  Activity,
} from 'lucide-react';
import CustomDropdown from '../components/common/CustomDropdown';

export default function UsersPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuUserId, setActiveMenuUserId] = useState(null);

  const menuContainerRef = useRef(null);

  const [userProfile, setUserProfile] = useState({
    name: 'Dr. Sagar Sharma',
    email: 'dr.sagar@healthdock.in',
    organization: 'HealthDock Clinic',
  });

  // Dark mode synchronization
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Close three-dot menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target)) {
        setActiveMenuUserId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch logged in profile & users list
  const loadUsers = async () => {
    try {
      const userStr = localStorage.getItem('healthdock_user') || localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setUserProfile(prev => ({
          ...prev,
          name: u.full_name || prev.name,
          email: u.email || prev.email,
        }));
      }

      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/doctor/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const menuItems = [
    { id: 'Dashboard', icon: LayoutDashboard, link: '/dashboard' },
    { id: 'Bookings', icon: BookOpen, link: '/bookings' },
    { id: 'Availability', icon: Clock, link: '/availability' },
    { id: 'Holidays', icon: CalendarOff, link: '/holidays' },
    { id: 'Calendar', icon: CalendarIcon, link: '/dashboard' },
    { id: 'Contacts', icon: Users, link: '/dashboard' },
    { id: 'Pages', icon: FileText, link: '/pages' },
    { id: 'Users', icon: Users, link: '/users', active: true },
    { id: 'Workflows', icon: GitBranch, link: '/dashboard' },
    { id: 'Settings', icon: Settings, link: '/dashboard' },
  ];

  // Options for Role / Doctors Dropdown
  const roleOptions = [
    { label: 'All Roles / Doctors', value: 'ALL' },
    { label: 'Doctors', value: 'DOCTOR', icon: Stethoscope },
    { label: 'Clinic Admins', value: 'CLINIC_ADMIN', icon: Shield },
    { label: 'Receptionists', value: 'RECEPTIONIST' },
    { label: 'Medical Staff', value: 'STAFF' },
  ];

  // Options for Status Dropdown
  const statusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE', colorDot: 'bg-emerald-500' },
    { label: 'Pending Invite', value: 'INVITED', colorDot: 'bg-amber-500' },
    { label: 'Inactive', value: 'INACTIVE', colorDot: 'bg-slate-400' },
  ];

  const handleUserAdded = (newUser) => {
    setUsers(prev => [newUser, ...prev]);
  };

  const handleDeleteUser = async (userId) => {
    setActiveMenuUserId(null);
    if (!window.confirm('Are you sure you want to remove this user from the clinic?')) {
      return;
    }

    try {
      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/doctor/users/${userId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove user');
      }
    } catch (err) {
      console.error(err);
      alert('Error removing user');
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = u.full_name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchPhone = u.phone?.toLowerCase().includes(q);
      const matchRole = u.role?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchRole) return false;
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      if (u.role !== roleFilter) return false;
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      const s = u.status || 'ACTIVE';
      if (s !== statusFilter) return false;
    }

    return true;
  });

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto" ref={menuContainerRef}>
        
        {/* Top Header: Title & Subtitle on left, "Add User" button on top right */}
        <header className="p-6 lg:px-8 pb-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-[#071224]/50 backdrop-blur-sm sticky top-0 z-10 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Top Left: Heading and small para */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold font-serif text-[#0B192C] dark:text-white tracking-tight">
                Users
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
                Manage doctors, medical specialists, receptionists, and staff accounts across your practice.
              </p>
            </div>

            {/* Top Right: One button for Add User */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/users/new')}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-serif font-medium rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] flex-shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Row below: Search input on the left, filter options on the right */}
          <div className="pt-1 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search input on the left */}
            <div className="flex-1 min-w-[220px] max-w-md relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#101927] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Right side filter options: Role/Doctor dropdown and Status dropdown */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              
              {/* 1. All Doctor / Role dropdown */}
              <div className="w-full sm:w-auto min-w-[170px]">
                <CustomDropdown
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={roleOptions}
                  placeholder="All Roles"
                  icon={Shield}
                  className="w-full"
                />
              </div>

              {/* 2. Filter for Active and other type option (Status dropdown) */}
              <div className="w-full sm:w-auto min-w-[155px]">
                <CustomDropdown
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusOptions}
                  placeholder="All Statuses"
                  className="w-full"
                />
              </div>

            </div>

          </div>

        </header>

        {/* Content Body: Users Table */}
        <div className="p-6 lg:px-8 space-y-6">
          
          {loading ? (
            <div className="w-full py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-serif">Loading clinic members...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="w-full bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 text-center shadow-sm flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                No Users Found
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No users match your active filters or search terms. Try clearing filters.'
                  : 'Add your clinic doctors, receptionists, and medical staff to collaborate on patient appointments.'}
              </p>
              {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-500/40 cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/users/new')}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-serif font-medium shadow-md shadow-teal-500/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add First User</span>
                </button>
              )}
            </div>
          ) : (
            /* Table of Users */
            <div className="w-full bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-visible">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  
                  {/* Table Header */}
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                      <th className="py-3.5 px-6 font-medium">User</th>
                      <th className="py-3.5 px-6 font-medium">Role</th>
                      <th className="py-3.5 px-6 font-medium">Clinical Specialty</th>
                      <th className="py-3.5 px-6 font-medium">Status</th>
                      <th className="py-3.5 px-6 font-medium">Contact</th>
                      <th className="py-3.5 px-6 font-medium">Forgot Password</th>
                      <th className="py-3.5 px-6 font-medium w-16 text-center"></th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-700 dark:text-slate-200">
                    {filteredUsers.map((user) => {
                      const isMenuOpen = activeMenuUserId === user.id;
                      const userInitial = user.full_name ? user.full_name[0].toUpperCase() : 'U';
                      const isDoctor = user.role === 'DOCTOR';
                      const statusVal = user.status || 'ACTIVE';

                      return (
                        <tr 
                          key={user.id} 
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* 1. User Column */}
                          <td className="py-4 px-6 align-middle">
                            <div className="flex items-center gap-3">
                              
                              {/* Avatar circle */}
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                                {userInitial}
                              </div>

                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-sm text-slate-900 dark:text-white font-serif truncate">
                                  {user.full_name}
                                </span>
                                <span className="text-[11px] text-slate-400 truncate">
                                  {user.email}
                                </span>
                              </div>

                            </div>
                          </td>

                          {/* 2. Role Column */}
                          <td className="py-4 px-6 align-middle">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                              {user.role === 'DOCTOR' ? (
                                <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              ) : user.role === 'CLINIC_ADMIN' ? (
                                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                              ) : user.role === 'RECEPTIONIST' ? (
                                <Users className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <Activity className="w-3.5 h-3.5 text-sky-500" />
                              )}
                              <span>
                                {user.role === 'DOCTOR'
                                  ? 'Consulting Doctor'
                                  : user.role === 'CLINIC_ADMIN'
                                  ? 'Clinic Administrator'
                                  : user.role === 'RECEPTIONIST'
                                  ? 'Receptionist'
                                  : user.role || 'Staff'}
                              </span>
                            </span>
                          </td>

                          {/* 3. Clinical Specialty Column */}
                          <td className="py-4 px-6 align-middle">
                            {user.specialty && user.specialty !== 'None' ? (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                                <Stethoscope className="w-3.5 h-3.5 text-teal-600/70 dark:text-teal-400/70" />
                                <span>{user.specialty}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 font-medium">-</span>
                            )}
                          </td>

                          {/* 4. Status Column */}
                          <td className="py-4 px-6 align-middle">
                            {statusVal === 'ACTIVE' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active
                              </span>
                            ) : statusVal === 'INVITED' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Pending Invite
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* 5. Contact Column */}
                          <td className="py-4 px-6 align-middle text-slate-600 dark:text-slate-300 text-xs">
                            {user.phone ? (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{user.phone}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            )}
                          </td>

                          {/* 6. Forgot Password Column */}
                          <td className="py-4 px-6 align-middle">
                            <button
                              type="button"
                              onClick={() => navigate(`/users/edit/${user.id}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101927] hover:border-teal-500/50 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 transition-all text-xs font-medium shadow-xs group/btn cursor-pointer"
                              title="Reset password or edit credentials"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 group-hover/btn:rotate-12 transition-transform" />
                              <span>Forgot Password</span>
                            </button>
                          </td>

                          {/* 6. Menu Column */}
                          <td className="py-4 px-6 text-center align-middle relative">
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={() => setActiveMenuUserId(isMenuOpen ? null : user.id)}
                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:border-teal-500/40 transition-colors shadow-sm cursor-pointer"
                                title="User actions"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {/* Dropdown Menu */}
                              {isMenuOpen && (
                                <div className="absolute right-0 mt-1 z-50 w-40 bg-white dark:bg-[#0E1624] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 animate-in fade-in-50 zoom-in-95 duration-150">
                                  
                                  {/* Edit / Reset Credentials Option */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuUserId(null);
                                      navigate(`/users/edit/${user.id}`);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left font-medium cursor-pointer"
                                  >
                                    <KeyRound className="w-3.5 h-3.5 text-teal-500" />
                                    <span>Reset Password</span>
                                  </button>

                                  {/* Delete / Remove Option */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left font-medium cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Remove User</span>
                                  </button>

                                </div>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Showing {filteredUsers.length} clinic {filteredUsers.length === 1 ? 'user' : 'users'}</span>
                <span className="font-mono text-[11px] text-teal-600 dark:text-teal-400 font-medium">Practice authorization active</span>
              </div>
            </div>
          )}

        </div>

      </main>
  );
}
