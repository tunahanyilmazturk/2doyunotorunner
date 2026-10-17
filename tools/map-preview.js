import { Background } from '../src/render/Background.js';
import { BIOMES } from '../src/data/biomes.js';

const descriptions = [
  'Yosunlu taş geçitler, orman deresi ve ateş böcekleri.',
  'Kum tepeleri, eski piramitler ve vahadaki dikilitaşlar.',
  'Kristal bahçeleri, yeraltı suyu ve ışıklı mineral damarları.',
  'Kutup ışıkları altında karla örtülmüş kaleler ve buz dağları.',
  'Dumanlı kraterler, lav akıntıları ve obsidyen kalıntılar.',
];
const views = BIOMES.map((biome, index) => {
  const figure = document.createElement('figure');
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 400;
  canvas.setAttribute('aria-label', biome.name);
  const caption = document.createElement('figcaption');
  const heading = document.createElement('h2');
  const description = document.createElement('p');
  heading.textContent = biome.name;
  description.textContent = descriptions[index];
  caption.append(heading, description);
  figure.append(canvas, caption);
  document.getElementById('atlas').append(figure);
  const background = new Background();
  background.setBiome(index);
  return { canvas, ctx: canvas.getContext('2d'), background };
});

let paused = false;
let last = performance.now();
let distance = 0;
document.getElementById('motion').addEventListener('click', (event) => {
  paused = !paused;
  event.currentTarget.textContent = paused ? 'Hareketi başlat' : 'Hareketi durdur';
  event.currentTarget.setAttribute('aria-pressed', String(paused));
});
function frame(now) {
  const dt = Math.min((now - last) / 1000, .05);
  last = now;
  if (!paused) distance += dt * 55;
  for (const { ctx, background } of views) {
    if (!paused) background.update(dt);
    ctx.imageSmoothingEnabled = false;
    background.draw(ctx, distance);
    background.drawForeground(ctx, distance);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
