import { A, useLocation, useParams } from '@solidjs/router';
import ThemeSwitch from './ThemeSwitch';
import { Logo } from './icons/Logo';
import { GitHub } from './icons/GitHub';

export default ({ children }) => {
  const { pathname } = useLocation();
  const params = useParams();
  const logoLink =
    pathname === '/config' || pathname === '/about'
      ? '/'
      : pathname.startsWith('/chart') && params.id
        ? `/config/${params.id}`
        : '/config';

  return (
    <div class="p-4 flex flex-col gap-4 max-w-[960px] m-auto gap-8">
      <header role="banner" class="flex flex-row justify-between items-center gap-2">
        <h1>
          <A href={logoLink} class="block w-12 h-12">
            <Logo />
          </A>
        </h1>

        <div class="flex items-center gap-4">
          <ThemeSwitch />
        </div>
      </header>

      <main role="main">{children}</main>

      <footer role="contentinfo" class="mt-24 mb-12 mx-auto text-center flex flex-col items-center gap-8">
        <p class="text-xs high-contrast:text-base">No worries, your data won't leave your browser.</p>
        <p class="flex gap-4">
          <span class="flex gap-2 items-center">
            Made by
            <a href="https://webpro.nl" title="webpro.nl" class="text-gray-500 hover:text-gray-700">
              <img src="/webpro-logo.svg" alt="WebPro logo" class="w-8 h-8 inline" />
            </a>
          </span>
          <span class="flex gap-2 items-center">
            Code on
            <a
              href="https://github.com/webpro/venz"
              title="Venz on GitHub"
              class="w-8 h-8 text-gray-500 hover:text-gray-700"
            >
              <GitHub />
            </a>
          </span>
        </p>
      </footer>
    </div>
  );
};
