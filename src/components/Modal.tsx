"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
};

export default function Modal({ title, children, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const el = dialogRef.current?.querySelector("input,button,select,textarea,[tabindex]") as HTMLElement | null;
    el?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      previouslyFocused.current?.focus();
    };
  }, [onClose]);

  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onMouseDown={onBackdropClick}>
      <div className="absolute inset-0 bg-black/50" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "dialog"}
        ref={dialogRef}
        className="relative z-10 w-full max-w-xl bg-white/90 backdrop-blur rounded p-8 shadow-lg mx-4"
      >
        {title && <h2 className="text-2xl font-semibold mb-4">{title}</h2>}
        <div>{children}</div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
