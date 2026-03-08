import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { ErrorBoundary, Suspense, For, Show } from 'solid-js';
import './app.css';
import { ToastContext, createToastStore } from './stores/toast';
import Toast from './components/Toast';
import { ThemeProvider } from './stores/theme';
import { Meta, MetaProvider, Title } from '@solidjs/meta';
import { Canonical } from './components/Canonical';
import { OgImageContext, createOgImageStore } from './stores/og-image';

export default function App() {
  const toastStore = createToastStore();
  const ogImageStore = createOgImageStore();

  return (
    <ThemeProvider>
      <MetaProvider>
        <Title>Venz</Title>
        <Meta property="og:image" content={ogImageStore.ogImage()} />

        <OgImageContext.Provider value={ogImageStore}>
        <ToastContext.Provider value={toastStore}>
          <Router
            root={props => (
              <ErrorBoundary
                fallback={err => {
                  console.log(err);
                  return <div>{err.message} (check console)</div>;
                }}
              >
                <Canonical />
                <Suspense>{props.children}</Suspense>
              </ErrorBoundary>
            )}
          >
            <FileRoutes />
          </Router>
          <Show when={toastStore.toasts.length > 0}>
            <div class="fixed bottom-4 right-4 flex flex-col">
              <For each={toastStore.toasts}>
                {toast => (
                  <Toast id={toast.id} message={toast.message} type={toast.type} onClose={toastStore.removeToast} />
                )}
              </For>
            </div>
          </Show>
        </ToastContext.Provider>
        </OgImageContext.Provider>
      </MetaProvider>
    </ThemeProvider>
  );
}
