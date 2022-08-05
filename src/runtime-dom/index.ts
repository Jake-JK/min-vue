import { createRenderer } from "../runtime-core/renderer";

function createElement(node) {
  return document.createElement(node.type);
}

function patchProp(el, key, prevProps, nextProps) {
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
}
function insert(container, el) {
  container.append(el);
}

function remove(children) {
  const parent = children.parentElement;
  if (parent) {
    parent.removeChild(children);
  }
}

function setElementText(el, text){
  el.textContent = text
  
}

const render: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText
});

export function createApp(...arg) {
  return render.createApp(...arg);
}

export * from "../runtime-core";
