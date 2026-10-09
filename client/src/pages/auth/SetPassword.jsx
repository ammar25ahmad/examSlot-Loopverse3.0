import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { authApi } from '../../api/endpoints.js';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/\d/, 'Include a number'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export default function SetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { password: '', confirm: '' } });

  const onSubmit = async (values) => {
    try {
      await authApi.setPassword({ token, password: values.password });
      setDone(true);
      toast.success('Account activated. You can now sign in.');
      setTimeout(() => navigate('/login', { replace: true }), 1600);
    } catch (err) {
      toast.error(err.message || 'Unable to set your password');
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This setup link is missing or malformed.">
        <Link to="/login" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Back to sign in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set your password" subtitle="Create a strong password to activate your student account.">
      {done ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-8 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <KeyRound className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Password set. Redirecting to sign in…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="New password" type="password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />
          <Input label="Confirm password" type="password" placeholder="Re-enter password" error={errors.confirm?.message} {...register('confirm')} />
          <Button type="submit" loading={isSubmitting} className="w-full">
            Activate account
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
