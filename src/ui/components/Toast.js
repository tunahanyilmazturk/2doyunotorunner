const MAX_TOASTS = 5;

export class ToastManager {
  constructor() {
    this.root = document.getElementById('toasts');
  }

  show(text, type = 'info', duration = 2600) {
    while (this.root.children.length >= MAX_TOASTS) this.root.firstChild.remove();
    const node = document.createElement('div');
    node.className = `toast toast-${type}`;
    node.textContent = text;
    this.root.append(node);
    requestAnimationFrame(() => node.classList.add('show'));
    setTimeout(() => {
      node.classList.remove('show');
      setTimeout(() => node.remove(), 300);
    }, duration);
  }
}
