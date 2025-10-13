import { cn } from "@/lib/utils";
import React from "react";

type ProgressRingProps = {
  value: number; // 0-100
  size?: number; // px
  stroke?: number; // px
  className?: string;
  label?: string;
};

export function ProgressRing({ value, size = 128, stroke = 10, className, label }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn("inline-grid place-items-center", className)}>
      <svg
        width={size}
        height={size}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Completion"}
        className="text-muted-foreground"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={stroke}
          opacity={0.2}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="hsl(var(--color-primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={progress}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-foreground text-xl font-semibold"
        >
          {clamped}%
        </text>
      </svg>
    </div>
  );
}

