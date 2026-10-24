"use client";

import { useId } from "react";
import Modal from "@/components/Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();

  return (
    <Modal describedBy={messageId} labelledBy={titleId} onClose={onCancel}>
      <div className="dialog-heading">
        <div>
          <p className="eyebrow">PLEASE CONFIRM</p>
          <h2 id={titleId}>{title}</h2>
        </div>
      </div>
      <p className="form-hint" id={messageId}>
        {message}
      </p>
      <div className="dialog-actions">
        <button
          className="button button-secondary"
          data-autofocus
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button className="button button-primary button-danger" onClick={onConfirm} type="button">
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
