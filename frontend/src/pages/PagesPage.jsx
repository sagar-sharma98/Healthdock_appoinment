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
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Cross,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  User,
  QrCode,
  MoreVertical,
  Edit3,
  Trash2,
  CalendarOff,
} from 'lucide-react';
import CustomDropdown from '../components/common/CustomDropdown';
import CreatePageModal from '../components/common/CreatePageModal';
import QrCodeModal from '../components/common/QrCodeModal';

export default function PagesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [qrModalPage, setQrModalPage] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const menuContainerRef = useRef(null);

  const [userProfile, setUserProfile] = useState({
    name: 'Dr. Sagar Sharma',
    email: 'dr.sagar@healthdock.in',
    organization: 'HealthDock Clinic',
  });

  // Close three-dot menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch logged in profile & booking pages from backend
  const loadPages = async () => {
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
      const res = await fetch(`${API_BASE_URL}/api/doctor/pages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const menuItems = [
    { id: 'Dashboard', icon: LayoutDashboard, link: '/dashboard' },
    { id: 'Bookings', icon: BookOpen, link: '/bookings' },
    { id: 'Availability', icon: Clock, link: '/availability' },
    { id: 'Holidays', icon: CalendarOff, link: '/holidays' },
    { id: 'Calendar', icon: CalendarIcon, link: '/dashboard' },
    { id: 'Contacts', icon: Users, link: '/dashboard' },
    { id: 'Pages', icon: FileText, link: '/pages', active: true },
    { id: 'Users', icon: Users, link: '/users' },
    { id: 'Workflows', icon: GitBranch, link: '/dashboard' },
    { id: 'Settings', icon: Settings, link: '/dashboard' },
  ];

  // Options for Doctor Dropdown
  const doctorOptions = React.useMemo(() => {
    const list = [{ label: 'All Doctors', value: 'ALL' }];
    const uniqueDocs = new Set();
    (pages || []).forEach(p => {
      if (p.doctor_name) uniqueDocs.add(p.doctor_name);
    });
    if (uniqueDocs.size > 0) {
      uniqueDocs.forEach(d => list.push({ label: d.startsWith('Dr.') ? d : `Dr. ${d}`, value: d }));
    } else if ((userProfile.role || '').toUpperCase() !== 'RECEPTIONIST' && userProfile.name) {
      const cleanName = userProfile.name.replace(/^Dr\.\s*/i, '');
      list.push({ label: `Dr. ${cleanName}`, value: 'current-doctor' });
    }
    return list;
  }, [pages, userProfile]);

  const handleCopyLink = (slug) => {
    const fullUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handlePageCreated = (newPage) => {
    setPages(prev => [newPage, ...prev]);
  };

  const handlePageUpdated = (updatedPage) => {
    setPages(prev => prev.map(p => (p.id === updatedPage.id ? { ...p, ...updatedPage } : p)));
    setEditingPage(null);
  };

  const handleDeletePage = async (pageId) => {
    setActiveMenuId(null);
    if (!window.confirm('Are you sure you want to delete this booking page?')) {
      return;
    }

    try {
      const token = localStorage.getItem('healthdock_token') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/doctor/pages/${pageId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setPages(prev => prev.filter(p => p.id !== pageId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete page');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting booking page');
    }
  };

  // Filtered pages
  const filteredPages = pages.filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.page_name?.toLowerCase().includes(q);
      const matchSlug = p.slug?.toLowerCase().includes(q);
      if (!matchName && !matchSlug) return false;
    }
    return true;
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, doctorFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPages.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPages = filteredPages.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto" ref={menuContainerRef}>
        
        {/* Top Header: Title & Subtitle on left, "Create Page" button on top right */}
        <header className="p-6 lg:px-8 pb-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-[#071224]/50 backdrop-blur-sm sticky top-0 z-10 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Top Left: Heading and small para */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold font-serif text-[#0B192C] dark:text-white tracking-tight">
                Pages
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
                Manage your public doctor appointment booking pages, shareable booking URLs, and visitor traffic.
              </p>
            </div>

            {/* Top Right: One button for Create Page */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-serif font-medium rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] flex-shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create Page</span>
              </button>
            </div>
          </div>

          {/* Row below: Search and All Doctor dropdown on the left side */}
          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            {/* Search input on the left */}
            <div className="w-full sm:w-72 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search pages by name or URL..."
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

            {/* All Doctor dropdown on the left side with content width */}
            <div className="w-full sm:w-auto min-w-[165px]">
              <CustomDropdown
                value={doctorFilter}
                onChange={setDoctorFilter}
                options={doctorOptions}
                placeholder="All Doctors"
                icon={User}
                className="w-full"
              />
            </div>

          </div>

        </header>

        {/* Content Body: Table */}
        <div className="p-6 lg:px-8 space-y-6">
          
          {loading ? (
            <div className="w-full py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-serif">Loading booking pages...</p>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="w-full bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 text-center shadow-sm flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                No Booking Pages Found
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                {searchQuery 
                  ? `No booking pages match "${searchQuery}". Try a different keyword.` 
                  : 'Click "Create Page" above to publish your first public appointment scheduling link.'}
              </p>
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-500/40"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-serif font-medium shadow-md shadow-teal-500/20 inline-flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Create First Page</span>
                </button>
              )}
            </div>
          ) : (
            /* Table of Pages */
            <div className="w-full bg-white dark:bg-[#101927] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden min-h-[500px] flex flex-col justify-between">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  
                  {/* Table Header: PAGE, VISITS, TOOLS, MENU */}
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                      <th className="py-3.5 px-6 font-medium">Page</th>
                      <th className="py-3.5 px-6 font-medium w-36 text-center">Visits</th>
                      <th className="py-3.5 px-6 font-medium w-40 text-center">Links & Tools</th>
                      <th className="py-3.5 px-6 font-medium w-20 text-center"></th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-700 dark:text-slate-200">
                    {paginatedPages.map((page) => {
                      const fullUrl = `${window.location.origin}/${page.slug}`;
                      const isCopied = copiedSlug === page.slug;
                      const isMenuOpen = activeMenuId === page.id;

                      return (
                        <tr 
                          key={page.id} 
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* 1. Page Column: Name and Below it the URL */}
                          <td className="py-4 px-6 align-middle">
                            <div className="flex flex-col space-y-1">
                              <Link
                                to={`/pages/edit/${page.id}`}
                                className="font-semibold text-sm text-slate-900 dark:text-white font-serif hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                              >
                                {page.page_name}
                              </Link>
                              
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-teal-600 dark:text-teal-400 hover:underline font-mono text-xs truncate max-w-sm sm:max-w-md block"
                              >
                                {fullUrl}
                              </a>
                            </div>
                          </td>

                          {/* 2. Visits Column */}
                          <td className="py-4 px-6 text-center align-middle">
                            <span className="font-serif font-bold text-sm text-slate-800 dark:text-slate-100">
                              {page.total_visits || 0}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-1">visits</span>
                          </td>

                          {/* 3. Column for Scanner, Copy, and Visit Icon */}
                          <td className="py-4 px-6 text-center align-middle">
                            <div className="inline-flex items-center justify-center gap-1.5">
                              
                              {/* 1. Scanner (QR Code) icon */}
                              <button
                                type="button"
                                onClick={() => setQrModalPage(page)}
                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:border-teal-500/40 transition-all shadow-sm"
                                title="Open QR Scanner Pass"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>

                              {/* 2. Copy URL icon */}
                              <button
                                type="button"
                                onClick={() => handleCopyLink(page.slug)}
                                className={`p-2 rounded-xl border transition-all shadow-sm ${
                                  isCopied
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:border-teal-500/40'
                                }`}
                                title={isCopied ? 'Link Copied!' : 'Copy Link'}
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* 3. Visit (Open in next tab) icon */}
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:border-teal-500/40 transition-all shadow-sm"
                                title="Open Link in New Tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                            </div>
                          </td>

                          {/* 4. Column for Three-Dot Menu (Edit & Delete) */}
                          <td className="py-4 px-6 text-center align-middle relative">
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={() => setActiveMenuId(isMenuOpen ? null : page.id)}
                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:border-teal-500/40 transition-colors shadow-sm"
                                title="More options"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {/* Dropdown Menu */}
                              {isMenuOpen && (
                                <div className="absolute right-0 mt-1 z-50 w-36 bg-white dark:bg-[#0E1624] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 animate-in fade-in-50 zoom-in-95 duration-150">
                                  
                                  {/* Edit Option */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      navigate(`/pages/edit/${page.id}`);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left font-medium"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Edit</span>
                                  </button>

                                  {/* Delete Option */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePage(page.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left font-medium"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Delete</span>
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

              {/* Table Footer with Pagination */}
              <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 mt-auto">
                <div className="flex items-center gap-2">
                  <span>
                    Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredPages.length === 0 ? 0 : startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(startIndex + itemsPerPage, filteredPages.length)}</span> of{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredPages.length}</span> public booking {filteredPages.length === 1 ? 'page' : 'pages'}
                  </span>
                </div>

                {/* Pagination Controls on the right */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 transition-colors shadow-xs cursor-pointer flex items-center gap-1 text-xs px-2.5 font-medium"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/30'
                              : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 transition-colors shadow-xs cursor-pointer flex items-center gap-1 text-xs px-2.5 font-medium"
                    title="Next page"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Create Page Modal */}
      <CreatePageModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPageCreated={handlePageCreated}
        doctorName={userProfile.name}
      />

      {/* QR Code Scanner Pass Modal */}
      <QrCodeModal
        isOpen={Boolean(qrModalPage)}
        page={qrModalPage}
        onClose={() => setQrModalPage(null)}
      />

    </>
  );
}
