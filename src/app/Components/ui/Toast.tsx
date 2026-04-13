"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type ToastKind = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  subtitle?: string;
};

type ToastContextValue = {
  show: (t: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function tone(kind: ToastKind): { wrap: string; title: string; icon: string } {
  if (kind === "success") {
    return { wrap: "border-green-400/30 bg-green-500/10", title: "text-green-200", icon: "fa-solid fa-circle-check text-green-300" };
  }
  if (kind === "error") {
    return { wrap: "border-red-400/30 bg-red-500/10", title: "text-red-200", icon: "fa-solid fa-circle-xmark text-red-300" };
  }
  return { wrap: "border-[#8ec5eb]/35 bg-[#8ec5eb]/10", title: "text-[#cde2f2]", icon: "fa-solid fa-circle-info text-[#8ec5eb]" };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    const t = timers.current.get(id);
    if (t) window.clearTimeout(t);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const item: ToastItem = { id, ...t };
      setItems((prev) => [item, ...prev].slice(0, 4));
      const timeout = window.setTimeout(() => remove(id), 3500);
      timers.current.set(id, timeout);
    },
    [remove],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 left-1/2 z-[1000] w-[min(520px,calc(100vw-24px))] -translate-x-1/2 space-y-2">
        {items.map((it) => {
          const st = tone(it.kind);
          return (
            <div
              key={it.id}
              className={`pointer-events-auto rounded-2xl border ${st.wrap} backdrop-blur-md px-4 py-3 shadow-2xl`}
              role="status"
            >
              <div className="flex items-start gap-3">
                <i className={`${st.icon} mt-0.5`} />
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold ${st.title}`}>{it.title}</div>
                  {it.subtitle ? <div className="mt-0.5 text-xs text-white/70">{it.subtitle}</div> : null}
                </div>
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="text-white/50 hover:text-white/80"
                  aria-label="Dismiss"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

