import { el } from '../../utils/dom.js';

export class Modal {
  constructor() {
    this.root = document.getElementById('modal-root');
  }

  get isOpen() {
    return this.root.children.length > 0;
  }

  /** En üstteki pencereyi kapatır (Esc). */
  closeLast() {
    this.root.lastElementChild?.remove();
  }

  /**
   * @param {{title:string, body:string|Node, wide?:boolean, buttons?:{label:string, class?:string, onClick?:()=>any, keepOpen?:boolean}[]}} opts
   */
  show({ title, body, buttons = [{ label: 'Tamam', class: 'btn-primary' }], wide = false }) {
    const close = () => overlay.remove();
    const content = typeof body === 'string' ? el('div', { class: 'modal-body', html: body }) : el('div', { class: 'modal-body' }, body);
    const overlay = el('div', { class: 'modal-overlay', onclick: (e) => e.target === overlay && close() }, [
      el('div', { class: wide ? 'modal modal-wide' : 'modal' }, [
        el('h2', { class: 'modal-title', text: title }),
        content,
        el(
          'div',
          { class: 'modal-actions' },
          buttons.map((b) =>
            el('button', {
              class: `btn ${b.class ?? ''}`,
              text: b.label,
              onclick: () => {
                const result = b.onClick?.();
                if (!b.keepOpen && result !== false) close();
              },
            })
          )
        ),
      ]),
    ]);
    this.root.append(overlay);
    return close;
  }

  confirm(title, text, confirmLabel = 'Evet', danger = false) {
    return new Promise((resolve) => {
      this.show({
        title,
        body: text,
        buttons: [
          { label: 'Vazgeç', onClick: () => resolve(false) },
          { label: confirmLabel, class: danger ? 'btn-danger' : 'btn-primary', onClick: () => resolve(true) },
        ],
      });
    });
  }
}
