'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/app/lib/utils';

// ─── Animated Counter ─────────────────────────────────────────────────────────

interface CounterProps {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ to, prefix = '', suffix = '', decimals = 0, duration = 1.4, className }: CounterProps) {
  const count = useMotionValue(0);
  const displayValue = useTransform(count, (v) => {
    const formatted = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString();
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    const controls = animate(count, to, { duration, ease: 'easeOut' });
    return controls.stop;
  }, [to, duration]);

  return <motion.span className={className}>{displayValue}</motion.span>;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  change?: number; // percentage vs prior period, e.g. 12.5 = +12.5%
  icon: React.ElementType;
  iconBg?: string;
  sparkData?: number[];
  delay?: number;
}

export function KpiCard({
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  change,
  icon: Icon,
  iconBg = 'bg-parmore-cream',
  sparkData,
  delay = 0,
}: KpiCardProps) {
  const positive = change !== undefined && change > 0;
  const negative = change !== undefined && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-white rounded-sm border border-zinc-100 shadow-luxury p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-parmore-slate font-medium tracking-wide uppercase">{label}</p>
          <p className="text-2xl font-bold text-parmore-black mt-1 font-serif">
            <AnimatedCounter to={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          </p>
        </div>
        <div className={cn('h-10 w-10 rounded-sm flex items-center justify-center', iconBg)}>
          <Icon className="h-5 w-5 text-parmore-black" strokeWidth={1.5} />
        </div>
      </div>

      {sparkData && (
        <div className="mb-3">
          <Sparkline data={sparkData} />
        </div>
      )}

      {change !== undefined && (
        <div className={cn(
          'inline-flex items-center gap-1 text-xs font-medium',
          positive ? 'text-emerald-600' : negative ? 'text-red-500' : 'text-zinc-400'
        )}>
          {positive ? <TrendingUp className="h-3 w-3" /> : negative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          {change > 0 ? '+' : ''}{change.toFixed(1)}% vs last month
        </div>
      )}
    </motion.div>
  );
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

export function Sparkline({ data, color = '#c9a84c', height = 48 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  const W = 280;
  const H = height;
  const pad = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / range) * (H - pad * 2),
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${(W - pad).toFixed(1)},${H} L${pad},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace('#', '')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────────────────

interface BarItem {
  label: string;
  value: number;
  sublabel?: string;
}

interface HBarChartProps {
  items: BarItem[];
  valuePrefix?: string;
  valueSuffix?: string;
  color?: string;
  maxItems?: number;
}

export function HBarChart({ items, valuePrefix = '', valueSuffix = '', color = '#c9a84c', maxItems = 8 }: HBarChartProps) {
  const visible = items.slice(0, maxItems);
  const max = Math.max(...visible.map((i) => i.value));

  return (
    <div className="space-y-2.5">
      {visible.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <span className="text-xs text-parmore-slate w-28 shrink-0 truncate text-right">
            {item.label}
          </span>
          <div className="flex-1 h-5 bg-zinc-100 rounded-sm overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.1 + 0.05 * i, ease: 'easeOut' }}
              className="h-full rounded-sm flex items-center justify-end pr-2"
              style={{ backgroundColor: color }}
            >
              <span className="text-2xs text-parmore-black font-bold whitespace-nowrap">
                {valuePrefix}{item.value.toLocaleString()}{valueSuffix}
              </span>
            </motion.div>
          </div>
          {item.sublabel && (
            <span className="text-xs text-parmore-slate shrink-0 w-16 text-right">{item.sublabel}</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

export function ChartSection({ title, subtitle, children, className }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-white rounded-sm border border-zinc-100 shadow-luxury p-5', className)}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-parmore-black">{title}</h3>
        {subtitle && <p className="text-xs text-parmore-slate mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
