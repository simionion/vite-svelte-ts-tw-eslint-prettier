import Main from './Main.svelte';

export default function start(selector: string) {
  return new Main({
    target: document.querySelector(selector) || document.body,
  });
}
