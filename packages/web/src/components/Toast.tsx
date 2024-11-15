import { type Component, onMount } from 'solid-js';

interface ToastProps {
  id: number;
  message: string;
  type: 'error' | 'success';
  onClose: (id: number) => void;
}

const Toast: Component<ToastProps> = props => {
  onMount(() => {
    setTimeout(() => props.onClose(props.id), 2000);
  });

  return (
    <div
      class="p-4 rounded-sm shadow-lg mb-2"
      classList={{
        'bg-red-500 text-white': props.type === 'error',
        'bg-green-500 text-white': props.type === 'success',
      }}
    >
      <div class="flex items-center gap-2">
        <span>{props.message}</span>
        <button onClick={() => props.onClose(props.id)} class="ml-2">
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
