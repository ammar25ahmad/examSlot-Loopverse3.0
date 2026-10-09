import { Link } from 'react-router-dom';
import { GraduationCap, CalendarCheck, ShieldCheck, Clock } from 'lucide-react';

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-night-900 p-10 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600">
            <GraduationCap className="h-6 w-6" />
          </span>
          <span className="text-lg font-bold">ExamSlot</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight">Your exams. Your schedule. Your choice.</h1>
          <p className="mt-3 text-slate-300">
            Plan a conflict-free exam timetable across every branch, with seat capacity and change requests handled end to end.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            <li className="flex items-center gap-3"><CalendarCheck className="h-4 w-4 text-brand-400" /> Build and lock your own date sheet</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Secure accounts with admin-controlled setup</li>
            <li className="flex items-center gap-3"><Clock className="h-4 w-4 text-amber-400" /> Live seat availability &amp; conflict detection</li>
          </ul>
        </div>

        <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} ExamSlot · Multi-branch virtual university</p>
      </div>

      <div className="flex items-center justify-center bg-slate-50 px-5 py-10 dark:bg-night-950">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
              <GraduationCap className="h-6 w-6" />
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">ExamSlot</span>
          </div>
          {title && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
              {subtitle && <p className="mt-1 text-sm muted">{subtitle}</p>}
            </div>
          )}
          {children}
          <p className="mt-8 text-center text-xs muted">
            By signing in you agree to the university exam policy.{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Policies
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
