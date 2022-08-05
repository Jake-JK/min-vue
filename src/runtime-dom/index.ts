import { createRenderer } from "../runtime-core/renderer";

const render: any = createRenderer({
  createElement(node) {
    return document.createElement(node.type);
  },
  patchProp(el, key, prevProps, nextProps) {
    let isOn = (e: string) => {
      return /^on[A-Z]/.test(e);
    };
    let getEvent = (e: string) => {
      return e.slice(2).toLowerCase();
    };
    if (isOn(key)) {
      el.addEventListener(getEvent(key), nextProps[key]);
    } else {
      if (nextProps[key] === null || nextProps[key] === undefined) {
        el.removeAttribute(key, nextProps[key]);
      } else {
        el.setAttribute(key, nextProps[key]);
      }
    }
  },
  insert(container, el) {
    container.append(el);
  },
});

export function createApp(...arg) {
  return render.createApp(...arg);
}

export * from "../runtime-core";
