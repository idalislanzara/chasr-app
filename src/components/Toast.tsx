import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { X, MessageCircle, Heart, Bell } from 'lucide-react';

interface Toast {
  id: string;
  type: 'message' | 'match' | 'info';
  title: string;
  body?: string;
  photo?: string;
  onClick?: () => void;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const iconMap = {
    message: <MessageCircle size={18} />,
    match: <Heart size={18} fill="currentColor" />,
    info: <Bell size={18} />,
  };

  const colorMap = {
    message: 'var(--accent)',
    match: '#f472b6',
    info: 'var(--green)',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="toast"
            onClick={() => { toast.onClick?.(); dismiss(toast.id); }}
          >
            {toast.photo && (
              <img src={toast.photo} alt="" className="toast-photo" />
            )}
            <div className="toast-icon" style={{ color: colorMap[toast.type] }}>
              {iconMap[toast.type]}
            </div>
            <div className="toast-content">
              <span className="toast-title">{toast.title}</span>
              {toast.body && <span className="toast-body">{toast.body}</span>}
            </div>
            <button className="toast-dismiss" onClick={(e) => { e.stopPropagation(); dismiss(toast.id); }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
