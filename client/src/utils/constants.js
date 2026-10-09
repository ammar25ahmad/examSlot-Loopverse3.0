export const REQUEST_TYPE_LABEL = {
  BRANCH_CHANGE: 'Branch change',
  DATE_SHEET_CHANGE: 'Date sheet change',
};

export const REQUEST_STATUS_STYLE = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

export const ACCOUNT_STATUS_LABEL = {
  PENDING_SETUP: 'Pending setup',
  ACTIVE: 'Active',
  DISABLED: 'Disabled',
};

export const ACCOUNT_STATUS_STYLE = {
  PENDING_SETUP: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  DISABLED: 'bg-slate-200 text-slate-600 dark:bg-night-700 dark:text-slate-300',
};

export const EMAIL_STATUS_LABEL = {
  PENDING: 'Not sent',
  SENT: 'Sent',
  FAILED: 'Delivery failed',
  DISABLED: 'Email disabled',
};

export const EMAIL_STATUS_STYLE = {
  PENDING: 'bg-slate-200 text-slate-600 dark:bg-night-700 dark:text-slate-300',
  SENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  DISABLED: 'bg-slate-200 text-slate-600 dark:bg-night-700 dark:text-slate-300',
};

export const AUDIT_LABEL = {
  ADMIN_LOGIN: 'Admin signed in',
  STUDENT_CREATED: 'Student created',
  STUDENT_UPDATED: 'Student updated',
  STUDENT_DEACTIVATED: 'Student deactivated',
  BRANCH_CREATED: 'Branch created',
  BRANCH_UPDATED: 'Branch updated',
  BRANCH_DEACTIVATED: 'Branch deactivated',
  COURSE_CREATED: 'Course created',
  COURSE_UPDATED: 'Course updated',
  COURSE_DEACTIVATED: 'Course deactivated',
  SLOT_CREATED: 'Slot created',
  SLOT_UPDATED: 'Slot updated',
  SLOT_DEACTIVATED: 'Slot deactivated',
  ASSIGNMENT_UPDATED: 'Assignments updated',
  REQUEST_REVIEWED: 'Request reviewed',
  SETUP_EMAIL_RESENT: 'Setup email resent',
};

export const GENDER_LABEL = { male: 'Male', female: 'Female', other: 'Other' };
