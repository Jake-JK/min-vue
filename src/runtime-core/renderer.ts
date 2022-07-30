import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppApi } from "./createApp";
import { Fragment, vnode, Text } from "./vnode";

/**
 * render 流程
 * patch 触发渲染
 *   processCompnent 处理组件
 *   mountComponent 挂载组件
 *      createComponentInstance 创建组件实例  
*       {
            vnode,
            type: vnode.type
        }
        setupComponent setUp 
 *  
 */



export function createRenderer(options) {
  const { createElement, patchProp, insert } = options;
  function render(vnode: vnode, container, parentComponent) {
    patch(vnode, container, parentComponent);
  }
  function patch(vnode: vnode, container: any, parentComponent) {
    const { shapeFlag, type } = vnode;
    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent);
        break;
      case Text:
        processText(vnode, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode, container, parentComponent);
        }
        break;
    }
  }

  function processText(vnode: any, container: any) {
    let el = (vnode.el = document.createTextNode(vnode.children));

    container.append(el);
  }

  function processFragment(vnode: any, container: any, parentComponent) {
    mountChildren(vnode.children, container, parentComponent);
  }

  function processElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = createElement(vnode));

    const { children, props, shapeFlag } = vnode;
    if (props) {
      patchProp(el, props);
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent);
    }
    // container.append(el);
    insert(container, el);
  }

  function mountChildren(children: Array<any>, el: any, parentComponent) {
    children.forEach((item) => {
      patch(item, el, parentComponent);
    });
  }

  function processComponent(vnode: vnode, container: any, parentComponent) {
    mountComponent(vnode, container, parentComponent);
  }
  function mountComponent(
    initialVNode: vnode,
    container: any,
    parentComponent
  ) {
    const instance = createComponentInstance(initialVNode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
  }
  function setupRenderEffect(
    instance: any,
    initialVNode: vnode,
    container: any
  ) {
    let { proxy } = instance;
    const subTreeVnode = instance.render.call(proxy);
    //处理完所有element 递归处理
    patch(subTreeVnode, container, instance);
    initialVNode.el = subTreeVnode.el;
  }

  return {
    createApp: createAppApi(render),
  };
}
