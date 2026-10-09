import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
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

export default function ResetPassword() {
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
      await authApi.resetPassword({ token, password: values.password });
      setDone(true);
      toast.success('Password updated. You can now sign in.');
      setTimeout(() => navigate('/login', { replace: true }), 1600);
    } catch (err) {
      toast.error(err.message || 'Unable to reset your password');
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This reset link is missing or malformed.">
        <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Your new password must meet the university strength rules.">
      {done ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-8 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Password reset. Redirecting to sign in…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="New password" type="password" error={errors.password?.message} {...register('password')} />
          <Input label="Confirm password" type="password" error={errors.confirm?.message} {...register('confirm')} />
          <Button type="submit" loading={isSubmitting} className="w-full">
            Reset password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
