"use client";

import { useEffect, useRef, useState } from "react";

export function ProgressBar({ value }: { value: number }) {
  const [width, setWidth] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const id = requestAnimationFrame(() => setWidth(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <div className="h-2 w-full rounded-full bg-plum-100">
      <div
        className="h-2 rounded-full bg-petale-500 transition-[width] duration-[600ms] ease-out"
        style={{ width: `${Math.round(width * 100)}%` }}
      />
    </div>
  );
}
