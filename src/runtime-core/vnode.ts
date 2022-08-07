import { isObject } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";

export const Fragment = Symbol('Fragment');
export const Text = Symbol('Text');

export type vnode = {
  type: any,
  props: Object,
  children: Array<vnode>,
  shapeFlag: number,
  key?,
  el: Element | null
}
export function createVNode(type, props?, children?) :vnode {
  const vnode :vnode = {
    type,
    props,
    key: props && props.key,
    children,
    shapeFlag: getShapeFlag(type),
    el: null
  };

  if(typeof children === 'string'){
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
  }else if(Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

  if(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT){
    if(isObject(children)){
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN
    }
  }

  return vnode;
}
function getShapeFlag(type: any) {
  return typeof type == 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT
}

export function createTextVNode(text:string){
  return createVNode(Text, {}, text)
}