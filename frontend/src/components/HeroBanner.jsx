import { Link } from 'react-router-dom';
import { ShaderFill } from '@figma/expressive-components';
import {
  setup,
  render,
  manifest,
} from '../lib/custom-effects/CodeComponentId_82d4e1bcae1acd5e2ab56d5abec9d1eee17436de_434';

// Tham số shader lấy nguyên từ Figma (node 1:294). Hiệu ứng cần trình duyệt hỗ trợ WebGPU.
const nebulaParams = {
  colorB: { r: 0.1, g: 0.3, b: 0.9, a: 1 },
  seed: 0,
  colorA: { r: 0.5, g: 0.2, b: 0.8, a: 1 },
  colorC: { r: 0.8, g: 0.1, b: 0.5, a: 1 },
  brightness: 0.8,
  center: { x: 50, y: 50 },
  travel: 0,
  starDensity: 0.1,
};

/** Banner "Sự kiện đặc biệt" (Figma: node 1:293). */
export default function HeroBanner({ event }) {
  return (
    <section className="relative h-[360px] overflow-hidden rounded-3xl bg-card md:h-[463px] md:rounded-section">
      <div className="absolute -inset-x-6 -inset-y-[21px]" aria-hidden="true">
        <ShaderFill className="absolute size-full" shader={{ setup, render, params: nebulaParams, manifest }} />
      </div>
      <div className="absolute left-5 top-[70px] flex max-w-[660px] flex-col items-start gap-4 md:left-[61px] md:top-[139px]">
        <span className="rounded-[10px] bg-accent/62 px-1.5 text-[22px] font-extrabold md:text-[35px]">{event.tag}</span>
        <h1 className="m-0 text-[26px] font-bold leading-[1.15] md:text-[40px]">{event.title}</h1>
        <p className="m-0 text-sm text-white/62">{event.description}</p>
        <Link to={event.to} className="rounded-[10px] bg-accent px-3 py-[7px] text-2xl font-extrabold">
          {event.cta}
        </Link>
      </div>
    </section>
  );
}
