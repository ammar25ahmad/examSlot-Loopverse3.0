import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('2h'),
  CLIENT_URL: z
    .string()
    .min(1, 'CLIENT_URL is required')
    .refine(
      (value) =>
        value.split(',').every((part) => {
          const origin = part.trim();
          if (!origin) return false;
          try {
            new URL(origin);
            return true;
          } catch {
            return false;
          }
        }),
      'CLIENT_URL must be a comma-separated list of valid URLs (e.g. https://example.com)'
    ),
  UNIVERSITY_TIMEZONE: z.string().default('Asia/Karachi'),
  DEFAULT_EXAM_DURATION_MINUTES: z.coerce.number().int().positive().default(180),
  RESEND_API_KEY: z.string().optional().default(''),
  RESEND_FROM_EMAIL: z.string().optional().default(''),
  ADMIN_NAME: z.string().default('ExamSlot Administrator'),
  ADMIN_EMAIL: z.string().email().default('admin@examslot.local'),
  ADMIN_PASSWORD: z.string().default('Admin@ExamSlot123'),
  DEMO_STUDENT_PASSWORD: z.string().default('Student@ExamSlot123'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(
    `\n[ExamSlot] Invalid environment configuration.\n${issues}\n\n` +
      'Copy server/.env.example to server/.env and provide valid values.\n'
  );
  process.exit(1);
}

const data = parsed.data;
const placeholderSender =
  !data.RESEND_FROM_EMAIL || data.RESEND_FROM_EMAIL.includes('your-verified-domain');

// Origins allowed by CORS (comma-separated CLIENT_URL). `clientUrl` is the
// primary frontend origin used to build links in emails/token flows.
const clientOrigins = data.CLIENT_URL.split(',').map((part) => new URL(part.trim()).origin);

export const env = {
  ...data,
  clientUrl: clientOrigins[0],
  clientOrigins,
  isProduction: data.NODE_ENV === 'production',
  isTest: data.NODE_ENV === 'test',
  // Email is only considered configured when a real key + real sender are present.
  isEmailConfigured: Boolean(data.RESEND_API_KEY && !placeholderSender),
};

export default env;
