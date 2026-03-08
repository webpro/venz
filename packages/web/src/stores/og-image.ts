import { createSignal, createContext, useContext } from 'solid-js';

const DEFAULT_OG_IMAGE = 'https://try.venz.dev/logo-w.webp';

type OgImageStore = { ogImage: () => string; setOgImage: (url: string) => void };

const OgImageContext = createContext<OgImageStore>();

export function createOgImageStore(): OgImageStore {
  const [ogImage, setOgImage] = createSignal(DEFAULT_OG_IMAGE);
  return { ogImage, setOgImage };
}

export { OgImageContext };

export function useSetOgImage() {
  const ctx = useContext(OgImageContext);
  if (!ctx) throw new Error('OgImageContext missing');
  return ctx.setOgImage;
}
