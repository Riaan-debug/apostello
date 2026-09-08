import { cn } from '@/lib/cn';
import type { OpeningHour } from '@/lib/db/types';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function Hours({
  hours,
  note,
  tone = 'light',
}: {
  hours: OpeningHour[];
  note?: string;
  tone?: 'light' | 'dark';
}) {
  const todayName = DAY_ORDER[
    (new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' })).getDay() + 6) %
      7
  ];

  return (
    <div>
      {hours.length === 0 ? (
        <p className={cn('text-sm', tone === 'dark' ? 'text-cream/70' : 'text-steel')}>
          Hours coming soon
        </p>
      ) : (
        <dl className="divide-y divide-current/10">
          {hours.map((hour) => {
            const isToday = hour.day === todayName;
            return (
              <div
                key={hour.day}
                className={cn(
                  'flex items-baseline justify-between gap-6 py-2.5 text-sm',
                  isToday && 'font-semibold',
                )}
              >
                <dt className={cn(isToday ? '' : tone === 'dark' ? 'text-cream/70' : 'text-steel')}>
                  {hour.day}
                  {isToday && (
                    <span
                      className={cn(
                        'ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                        tone === 'dark' ? 'bg-cream/15 text-cream' : 'bg-ink text-cream',
                      )}
                    >
                      Today
                    </span>
                  )}
                </dt>
                <dd
                  className={cn(
                    'tabular',
                    hour.closed && (tone === 'dark' ? 'text-cream/40' : 'text-steel-light'),
                  )}
                >
                  {hour.closed || !hour.open ? 'Closed' : `${hour.open} – ${hour.close}`}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
      {note && (
        <p className={cn('mt-4 text-xs', tone === 'dark' ? 'text-cream/50' : 'text-steel')}>{note}</p>
      )}
    </div>
  );
}
