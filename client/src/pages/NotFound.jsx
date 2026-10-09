import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center dark:bg-night-950">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
        <Compass className="h-7 w-7" />
      </span>
      <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">404</h1>
      <p className="max-w-sm text-sm muted">The page you were looking for doesn’t exist or has moved.</p>
      <Link to="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
