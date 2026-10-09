import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ScrollText,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { initials } from '../utils/format.js';
import { Badge } from '../components/ui/Badge.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/branches', label: 'Branches', icon: Building2 },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/admin/exam-slots', label: 'Exam slots', icon: CalendarClock },
  { to: '/admin/requests', label: 'Requests', icon: Inbox },
  { to: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText },
];

function SidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold leading-tight text-white">ExamSlot</p>
          <p className="text-[11px] font-medium text-slate-400">Admin console</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-300 hover:bg-night-800 hover:text-white'
              }`
            }
          >
            <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-night-800 px-5 py-4">
        <p className="text-xs text-slate-500">ExamSlot v1.0 · Hackathon build</p>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-night-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-night-900 lg:block">
        <SidebarContent />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-64 bg-night-900">
            <button
              type="button"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-night-800"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-night-800 dark:bg-night-900/90 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" className="btn-ghost px-2 py-2 lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Administration</span>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={toggle} className="btn-ghost px-2.5 py-2" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 hover:bg-slate-100 dark:hover:bg-night-800"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {initials(user?.name || 'A')}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">{user?.name}</span>
                  <span className="block text-[11px] muted">Administrator</span>
                </span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop dark:border-night-700 dark:bg-night-900">
                    <div className="border-b border-slate-100 px-4 py-3 dark:border-night-800">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name}</p>
                      <p className="truncate text-xs muted">{user?.email}</p>
                      <div className="mt-2">
                        <Badge tone="brand">Admin</Badge>
                      </div>
                    </div>
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
