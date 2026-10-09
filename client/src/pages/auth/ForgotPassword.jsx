import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MailCheck } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { authApi } from '../../api/endpoints.js';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const onSubmit = async (values) => {
    try {
      await authApi.forgotPassword(values);
      setSent(true);
    } catch (err) {
      toast.error(err.message || 'Unable to start password reset');
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We’ll email you a secure link to choose a new password.">
      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-8 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <MailCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            If that email is registered, a reset link has been sent.
          </p>
          <Link to="/login" className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Email" type="email" placeholder="you@university.edu" error={errors.email?.message} {...register('email')} />
          <Button type="submit" loading={isSubmitting} className="w-full">
            Send reset link
          </Button>
          <Link to="/login" className="block text-center text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
