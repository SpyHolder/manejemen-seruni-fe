import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', type = 'danger' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const colorStyles = {
    danger: {
      iconBg: 'bg-red-100 dark:bg-red-500/20',
      iconColor: 'text-red-600 dark:text-red-500',
      btnBg: 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20',
    },
    warning: {
      iconBg: 'bg-orange-100 dark:bg-orange-500/20',
      iconColor: 'text-orange-600 dark:text-orange-500',
      btnBg: 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20',
    },
    primary: {
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      btnBg: 'bg-primary hover:bg-primary/90 text-white shadow-primary/20',
    }
  };

  const style = colorStyles[type] || colorStyles.primary;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
      <div className="relative bg-white dark:bg-stone-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-up border border-stone-200 dark:border-stone-700">
        
        <button onClick={onCancel} className="absolute top-4 right-4 p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors">
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${style.iconBg} ${style.iconColor}`}>
            <AlertTriangle size={28} />
          </div>
          
          <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">{message}</p>
          
          <div className="flex w-full gap-3">
            <button 
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm();
              }}
              className={`flex-1 py-2.5 rounded-xl font-semibold shadow-sm transition-colors ${style.btnBg}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
