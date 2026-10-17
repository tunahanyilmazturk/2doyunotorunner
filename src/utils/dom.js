/**
 * Küçük DOM yardımcısı: el('div', { class: 'x', onclick: fn }, [çocuklar])
 */
import { decorateIcons } from '../ui/icons.js';

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'style' && typeof value === 'object') {
      for (const [prop, v] of Object.entries(value)) {
        if (prop.startsWith('--')) node.style.setProperty(prop, v);
        else node.style[prop] = v;
      }
    }
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  decorateIcons(node);
  return node;
}

export const $ = (selector, root = document) => root.querySelector(selector);

/** HTML'e gömülecek metni kaçış karakterleriyle güvenli hale getirir. */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Her düğüme en son yazdığımız metni hatırlar. `textContent` ataması düğümün
// metin çocuğunu silip yeniden oluşturur; bu da MutationObserver'ı tetikleyip
// simge taramasını baştan çalıştırır. Her karede aynı değeri yazmamak bu
// döngüyü tamamen ortadan kaldırır.
const lastText = new WeakMap();

/**
 * Değer değişmediyse DOM'a dokunmaz (kare başına gereksiz düğüm kurulumunu önler).
 * Simge dönüşümü metni sildiği için karşılaştırma DOM'a değil, önbelleğe göre yapılır.
 */
export function setText(node, value) {
  const text = String(value);
  if (lastText.get(node) === text) return text;
  lastText.set(node, text);
  node.textContent = text;
  return text;
}
