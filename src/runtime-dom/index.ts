import { createRenderer } from "../runtime-core/renderer";

const render:any = createRenderer({
  createElement(node) {
    return document.createElement(node.type);
  },
  patchProp(el, props) {
    let isOn = (e: string) => {
      return /^on[A-Z]/.test(e);
    };
    let getEvent = (e: string) => {
      return e.slice(2).toLowerCase();
    };
    for (const key in props) {
      if (isOn(key)) {
        el.addEventListener(getEvent(key), props[key]);
      } else {
        el.setAttribute(key, props[key]);
      }
    }
  },
  insert(container, el){
    container.append(el)
  }
});

export function createApp(...arg){
   return render.createApp(...arg)
}

export * from '../runtime-core';



