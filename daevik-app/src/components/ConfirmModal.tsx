'use client';

import { useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  requireMatch?: string; // e.g., "DELETE"
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  requireMatch,
  onConfirm,
  onCancel,
  isDestructive = true,
}: ConfirmModalProps) {
  const [matchInput, setMatchInput] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireMatch && matchInput !== requireMatch) {
      return;
    }
    onConfirm();
    setMatchInput('');
  };

  const handleCancel = () => {
    onCancel();
    setMatchInput('');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-4)',
    }}>
      <div className="card animate-scale-in" style={{
        maxWidth: '400px',
        width: '100%',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-xl)',
        background: 'var(--color-bg-card)',
      }}>
        <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>{title}</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 1.5 }}>
          {message}
        </p>

        {requireMatch && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label className="form-label">
              Please type <strong>{requireMatch}</strong> to confirm:
            </label>
            <input
              type="text"
              className="form-input"
              value={matchInput}
              onChange={(e) => setMatchInput(e.target.value)}
              placeholder={requireMatch}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary" onClick={handleCancel}>
            {cancelText}
          </button>
          <button
            className={`btn ${isDestructive ? 'btn-primary' : 'btn-gold'}`}
            style={isDestructive ? { backgroundColor: 'var(--color-error)', color: 'white', borderColor: 'var(--color-error)' } : {}}
            onClick={handleConfirm}
            disabled={requireMatch ? matchInput !== requireMatch : false}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
