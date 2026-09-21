import type { ReactNode } from 'react';

export default function ChartCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description && <p className="text-sm text-ink-mute">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
