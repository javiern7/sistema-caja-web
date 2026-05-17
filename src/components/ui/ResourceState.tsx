import type { ReactNode } from 'react';

type ResourceStateProps = {
  title: string;
  body: string;
  tone?: 'default' | 'warning' | 'danger';
  action?: ReactNode;
};

const toneClasses = {
  default: 'border-slate-200 bg-slate-50 text-slate-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
};

export function ResourceState({ title, body, tone = 'default', action }: ResourceStateProps) {
  return (
    <div className={`rounded-3xl border p-5 ${toneClasses[tone]}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
