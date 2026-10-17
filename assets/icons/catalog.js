import { icon } from '../../src/ui/icons.js';

const manifest = await fetch('./manifest.json').then((res) => res.json());
const gallery = document.getElementById('gallery');
const search = document.getElementById('search');
const category = document.getElementById('category');
function render() {
  const query = search.value.toLocaleLowerCase('tr');
  const visible = manifest.filter((a) => (category.value === 'all' || a.sheet === category.value) && `${a.label} ${a.id}`.toLocaleLowerCase('tr').includes(query));
  gallery.replaceChildren(...visible.map((a) => {
    const figure = document.createElement('figure');
    const caption = document.createElement('figcaption');
    caption.textContent = a.label;
    const id = document.createElement('small');
    id.textContent = a.id;
    caption.append(id);
    figure.append(icon(a.id), caption);
    return figure;
  }));
  document.getElementById('count').textContent = `${visible.length} / ${manifest.length} ikon`;
}
search.addEventListener('input', render);
category.addEventListener('change', render);
render();
