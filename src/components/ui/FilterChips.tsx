import { useRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterChipsProps<T extends string = string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * FilterChips — Emil-spec animated active indicator
 * Uses layout measurement for smooth gliding active pill background indicator.
 * WCAG AA compliant contrast and keyboard navigable.
 */
export function FilterChips<T extends string = string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: FilterChipsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });
  const [isReady, setIsReady] = useState(false);

  // Update active indicator position
  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector<HTMLButtonElement>(
      `[data-chip-value="${value}"]`
    );
    if (activeEl) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
      });
      setIsReady(true);
    }
  }, [value, options]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const activeEl = containerRef.current.querySelector<HTMLButtonElement>(
        `[data-chip-value="${value}"]`
      );
      if (activeEl) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        setIndicatorStyle({
          left: activeRect.left - containerRect.left,
          width: activeRect.width,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [value]);

  return (
    <>
      {/* Mobile Badges (< 640px) */}
      <div
        role="radiogroup"
        aria-label="Filter"
        className={clsx(
          'flex sm:hidden items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full select-none',
          className
        )}
      >
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(opt.value)}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer select-none active:scale-95',
                isActive
                  ? 'bg-blue-600 text-white shadow-xs border border-blue-600'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/90'
              )}
            >
              <span>{opt.label}</span>
              {typeof opt.count === 'number' && (
                <span
                  className={clsx(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums font-bold leading-tight',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700'
                  )}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop Segmented Control (>= 640px) */}
      <div
        ref={containerRef}
        role="radiogroup"
        aria-label="Filter"
        className={clsx(
          'hidden sm:inline-flex relative items-center gap-1 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 shadow-inner select-none overflow-x-auto no-scrollbar',
          className
        )}
      >
        {/* Sliding Active Pill Background */}
        {isReady && (
          <span
            className="absolute top-1 bottom-1 rounded-lg bg-blue-600 shadow-sm pointer-events-none transition-all duration-200 ease-out"
            style={{
              transform: `translateX(${indicatorStyle.left - 4}px)`,
              width: `${indicatorStyle.width}px`,
            }}
            aria-hidden="true"
          />
        )}

        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              data-chip-value={opt.value}
              onClick={() => onChange(opt.value)}
              className={clsx(
                'relative z-10 inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap',
                size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm',
                isActive
                  ? 'text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              )}
            >
              <span>{opt.label}</span>
              {typeof opt.count === 'number' && (
                <span
                  className={clsx(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums font-bold leading-tight',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700'
                  )}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
