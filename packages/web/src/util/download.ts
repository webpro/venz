export type ImageFormat = 'png' | 'svg' | 'webp' | 'avif';

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
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      rect.setAttribute('r', '1e5');
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

  const originalColor = svgElement.style.color;
  if (backgroundColor === '#000') svgElement.style.color = 'white';
  const svgData = new XMLSerializer().serializeToString(svgElement);
  if (backgroundColor === '#000') svgElement.style.color = originalColor;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  canvas.width = (svgElement.clientWidth + padding * 2) * scale;
  canvas.height = (svgElement.clientHeight + padding * 2) * scale;

  img.onload = () => {
    if (ctx) {
      ctx.scale(scale, scale);
      if (backgroundColor !== 'none') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, padding / scale, padding / scale);
      const a = document.createElement('a');
      a.download = `venz-chart.${format}`;
      a.href = canvas.toDataURL(`image/${format}`);
      a.click();
    }
  };

  img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
};
