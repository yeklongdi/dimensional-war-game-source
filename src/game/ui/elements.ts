export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

export function button(text: string, testid: string, action: () => void) {
  const node = element('button', 'action-button', text);
  node.type = 'button';
  node.dataset.testid = testid;
  node.addEventListener('click', event => {
    event.stopPropagation();
    if (event.detail > 1) return;
    action();
  });
  return node;
}
