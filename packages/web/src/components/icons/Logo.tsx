export const Logo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="icon-logo">
    <style>{`
    .high-contrast svg.icon-logo {
      rect {
        fill: rgb(var(--foreground-rgb));
      }
      line {
        stroke: rgb(var(--background-rgb));
      }
    }
    `}</style>
    <title>Venz logo</title>
    <rect width="256" height="256" rx="5" fill="#f56e0f" />
    <g stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="13">
      <line x1="32" y1="32" x2="64" y2="64" />
      <line x1="64" y1="64" x2="32" y2="96" />
      <line x1="76" y1="100" x2="112" y2="100" />
      <line x1="84" y1="172" x2="84" y2="212" />
      <line x1="116" y1="152" x2="116" y2="212" />
      <line x1="148" y1="160" x2="148" y2="212" />
      <line x1="180" y1="112" x2="180" y2="212" />
      <line x1="212" y1="72" x2="212" y2="212" />
    </g>
  </svg>
);
