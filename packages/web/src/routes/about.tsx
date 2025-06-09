import Shell from '../components/Shell';
import { Link } from '../components/Button';
import { Unlabeled } from '../components/about/Unlabeled';
import { Labeled } from '../components/about/Labeled';
import { LabeledColumns } from '../components/about/LabeledColumns';
import { LabeledNumberSeriesJSON, LabeledNumbersJSON, NumbersJSON } from '../components/about/JSON';
import { Hyperfine } from '../components/about/Hyperfine';
import { Title } from '@solidjs/meta';
import { CreateURL } from '../components/about/CreateURL';
import { Mitata } from '../components/about/Mitata';

export default function About() {
  return (
    <Shell>
      <Title>About | Venz</Title>

      <div class="flex flex-col gap-8 w-full text-xl">
        <h2 class="text-3xl">About Venz</h2>

        <p>Venz makes it easy to create a chart from numbers.</p>

        <p>
          Venz visualizes numeric data using SVG charts. You feed it numbers and it tries to detect the data structure
          automatically. The chart can then be downloaded in SVG, PNG, webP or AVIF format. Or create a link that
          contains all details to share.
        </p>

        <p>There are multiple ways to create a chart:</p>

        <ul class="list-inside list-disc">
          <li>By pasting text</li>
          <li>By dropping a file onto the chart</li>
          <li>By creating a URL</li>
        </ul>

        <p>The numbers can be in plain text or JSON format.</p>

        <h3 class="text-3xl">Contents</h3>

        <ul class="list-inside list-disc">
          <li>
            <Link href="#unlabeled">Unlabeled numbers</Link>
          </li>
          <li>
            <Link href="#labeled">Labeled numbers in rows</Link>
          </li>
          <li>
            <Link href="#labeled-columns">Labeled numbers in columns</Link>
          </li>
          <li>
            <Link href="#json">JSON with numbers</Link>
          </li>
          <li>
            <Link href="#json-labeled">JSON with labels and numbers</Link>
          </li>
          <li>
            <Link href="#hyperfine">Hyperfine</Link>
          </li>
          <li>
            <Link href="#mitata">Mitata</Link>
          </li>
          <li>
            <Link href="#url">Create URL</Link>
          </li>
        </ul>

        <h3 id="unlabeled" class="text-3xl">
          <a href="#unlabeled">Unlabeled numbers</a>
        </h3>

        <Unlabeled />

        <h3 id="labeled" class="text-3xl">
          <a href="#labeled">Labeled numbers in rows</a>
        </h3>

        <Labeled />

        <h3 id="labeled-columns" class="text-3xl">
          <a href="#labeled-columns">Labeled numbers in columns</a>
        </h3>

        <LabeledColumns />

        <h3 id="json" class="text-3xl">
          <a href="#json">JSON with numbers</a>
        </h3>

        <NumbersJSON />

        <h3 id="json-labeled" class="text-3xl">
          <a href="#json-labeled">JSON with labels and numbers</a>
        </h3>

        <LabeledNumbersJSON />

        <h3 id="json-labeled" class="text-3xl">
          <a href="#json-labeled">JSON with labels and numbers series</a>
        </h3>

        <LabeledNumberSeriesJSON />

        <h3 id="hyperfine" class="text-3xl">
          <a href="#hyperfine">Hyperfine</a>
        </h3>

        <Hyperfine />

        <h3 id="mitata" class="text-3xl">
          <a href="#mitata">Mitata</a>
        </h3>

        <Mitata />

        <h3 id="url" class="text-3xl">
          <a href="#url">Create URL</a>
        </h3>

        <CreateURL />
      </div>
    </Shell>
  );
}
