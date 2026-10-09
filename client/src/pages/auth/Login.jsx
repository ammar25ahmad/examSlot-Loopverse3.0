import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { homeFor } from '../../components/routing/guards.jsx';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('student');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    try {
      const data = await login(values.email, values.password, role);
      toast.success(`Welcome back, ${data.user.fullName || 'administrator'}!`);
      navigate(location.state?.from || homeFor(data.role, data.user), { replace: true });
    } catch (err) {
      toast.error(err.message || 'Unable to sign in');
    }
  };

  const roleTabs = [
    { key: 'student', label: 'Student', icon: GraduationCap },
    { key: 'admin', label: 'Administrator', icon: ShieldCheck },
  ];

  return (
    <AuthLayout title="Sign in" subtitle="Access your ExamSlot dashboard with your university account.">
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-night-800">
        {roleTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setRole(key)}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              role === key
                ? 'bg-white text-brand-700 shadow-sm dark:bg-night-900 dark:text-brand-300'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder={role === 'admin' ? 'admin@examslot.local' : 'you@university.edu'}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs muted dark:border-night-700 dark:bg-night-800">
        New students: your account is activated via the setup link emailed by the examinations office.
      </p>
    </AuthLayout>
  );
}
