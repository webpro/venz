import { createHandler, StartServer } from '@solidjs/start/server';

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/logo.svg" type="image/svg+xml" />
          <link rel="icon" href="/favicon.ico" sizes="48x48" />

          <title>Venz</title>

          <meta name="title" content="Venz" />
          <meta name="description" content="Easy and accessible dataviz" />

          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://try.venz.dev" />
          <meta property="og:title" content="Venz" />
          <meta property="og:description" content="Easy and accessible dataviz" />
          <meta property="og:image" content="https://try.venz.dev/logo-w.webp" />

          <script innerHTML={`document.documentElement.className = localStorage.getItem('theme') || 'dark';`} />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
