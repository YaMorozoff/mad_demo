"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  labelledBy: string;
  describedBy?: string;
  locked?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({
  labelledBy,
  describedBy,
  locked = false,
  onClose,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<Element | null>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    openerRef.current ??= document.activeElement;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    return () => {
      const opener = openerRef.current;
      if (!(opener instanceof HTMLElement)) return;
      requestAnimationFrame(() => {
        if (opener.isConnected) opener.focus();
      });
    };
  }, []);

  return (
    <dialog
      aria-describedby={describedBy}
      aria-labelledby={labelledBy}
      className="dialog-backdrop"
      onCancel={(event) => {
        event.preventDefault();
        if (!locked) onClose();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !locked) onClose();
      }}
      ref={dialogRef}
    >
      <section className="booking-dialog">{children}</section>
    </dialog>
  );
}
