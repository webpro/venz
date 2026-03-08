export type ImageFormat = 'png' | 'svg' | 'webp';

type DownloadChartOptions = {
  format?: ImageFormat;
  scale?: number;
  padding?: number;
  backgroundColor?: string;
};

export const download = (svgElement: SVGSVGElement, options: DownloadChartOptions) => {
  const { format = 'svg', scale = 2, padding = 0, backgroundColor = 'none' } = options;

  if (format === 'svg') {
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('class', 'venz-chart');
    svgClone.setAttribute(
      'viewBox',
      `-${padding} -${padding} ${svgElement.clientWidth + padding * 2} ${svgElement.clientHeight + padding * 2}`
    );
    if (backgroundColor !== 'none') {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', backgroundColor);
      svgClone.insertBefore(rect, svgClone.firstChild);
      if (backgroundColor === '#000') svgClone.setAttribute('style', 'color: white');
    }
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const a = document.createElement('a');
    a.download = 'venz-chart.svg';
    a.href = `data:image/svg+xml;base64,${btoa(svgData)}`;
    a.click();
    return;
  }

  const w = svgElement.clientWidth;
  const h = svgElement.clientHeight;

  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
  svgClone.setAttribute('width', String(w));
  svgClone.setAttribute('height', String(h));
  if (backgroundColor === '#000') svgClone.setAttribute('style', 'color: white');
  const svgData = new XMLSerializer().serializeToString(svgClone);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  canvas.width = (w + padding * 2) * scale;
  canvas.height = (h + padding * 2) * scale;

  const mime = `image/${format}`;

  img.onload = () => {
    if (ctx) {
      ctx.scale(scale, scale);
      if (backgroundColor !== 'none') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, padding, padding);
      const a = document.createElement('a');
      a.download = `venz-chart.${format}`;
      a.href = canvas.toDataURL(mime);
      a.click();
    }
  };

  img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
};
