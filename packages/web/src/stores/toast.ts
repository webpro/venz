import { createStore } from 'solid-js/store';
import { createContext, useContext } from 'solid-js';

interface Toast {
  id: number;
  message: string;
  type?: 'error' | 'success';
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: number) => void;
}

const [store, setStore] = createStore<{ toasts: Toast[] }>({ toasts: [] });
let toastId = 0;

export const ToastContext = createContext<ToastStore>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function createToastStore() {
  const addToast = (message: string, type: Toast['type'] = 'success') => {
    setStore('toasts', toasts => [...toasts, { id: toastId++, message, type }]);
  };

  const removeToast = (id: number) => {
    setStore('toasts', toasts => toasts.filter(t => t.id !== id));
  };

  return {
    get toasts() {
      return store.toasts;
    },
    addToast,
    removeToast,
  };
}

export function useToast() {
  return useContext(ToastContext);
}
