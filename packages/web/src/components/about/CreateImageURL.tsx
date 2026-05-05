import { origin, cdnOrigin } from '../../util/helpers';

export const CreateImageURL = () => {
  const url = new URL('/', origin);
  url.searchParams.set('type', 'line');
  url.searchParams.append('data', '3;2;3;4;2;5');
  url.searchParams.append('data', '4;3;2;5;6;4');

  return (
    <>
      <p>Generate chart images directly via URL. Append chart parameters as query strings to the image endpoint.</p>

      <p>
        Base URL:{' '}
        <code>
          {cdnOrigin}/i/chart.{'<ext>'}
        </code>
      </p>

      <ul class="list-inside list-disc pl-4">
        <li>
          Supported formats: <code>.svg</code>, <code>.png</code>, <code>.webp</code>, <code>.avif</code>
        </li>
        <li>All chart URL parameters (above) are supported</li>
      </ul>

      <h4 class="text-2xl mt-4">Additional image parameters</h4>

      <ul class="list-inside list-disc pl-4">
        <li>
          <code>w</code>
          <ul class="list-inside list-disc pl-8">
            <li>image width in pixels</li>
            <li>
              default: <code>1200</code>, max: <code>3840</code>
            </li>
          </ul>
        </li>
        <li>
          <code>h</code>
          <ul class="list-inside list-disc pl-8">
            <li>image height in pixels</li>
            <li>
              default: <code>630</code>, max: <code>2160</code>
            </li>
          </ul>
        </li>
        <li>
          <code>q</code>
          <ul class="list-inside list-disc pl-8">
            <li>image quality (webp/avif only; png is lossless)</li>
            <li>
              default: lossless; setting <code>q</code> switches to lossy, range: <code>1</code>-<code>100</code>
            </li>
          </ul>
        </li>
        <li>
          <code>pad</code>
          <ul class="list-inside list-disc pl-8">
            <li>outer padding in pixels (clamped to half the smaller dimension)</li>
            <li>
              default: <code>0</code>
            </li>
          </ul>
        </li>
        <li>
          <code>theme</code>
          <ul class="list-inside list-disc pl-8">
            <li>color theme</li>
            <li>
              default: <code>dark</code> (raster); SVG auto-adapts to viewer/parent unless set
            </li>
            <li>
              values: <code>dark</code>, <code>light</code>, <code>high-contrast</code>
            </li>
          </ul>
        </li>
      </ul>

      <p>Example:</p>
      <p>
        <code class="break-all">{cdnOrigin}/i/chart.png?type=line&data=3,2,3,4&data=4,3,2,5</code>
      </p>
    </>
  );
};
