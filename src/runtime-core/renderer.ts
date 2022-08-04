import { effect } from "../reactivity/effect";
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
    patch(null ,vnode, container, parentComponent);
  }
  function patch(n1: vnode | null, n2: vnode, container: any, parentComponent) {
    const { shapeFlag, type } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  function processText(n1,n2: any, container: any) {
    let el = (n2.el = document.createTextNode(n2.children));

    container.append(el);
  }

  function processFragment(n1,n2: any, container: any, parentComponent) {
    mountChildren(n2.children, container, parentComponent);
  }

  function processElement(n1,n2: any, container: any, parentComponent) {
    if(!n1){
      mountElement(n2, container, parentComponent)
    }else{
      patchElement(n1, n2, container)
    }
  }
  function mountElement(vnode: any, container: any, parentComponent: any) {
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
    insert(container, el);
  }

  function patchElement(n1, n2, container){
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);
  }

  function mountChildren(children: Array<any>, el: any, parentComponent) {
    children.forEach((item) => {
      patch(null ,item, el, parentComponent);
    });
  }

  function processComponent(n1,vnode: vnode, container: any, parentComponent) {
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
    effect(() => {
      if (!instance.isMounted) {
        let { proxy } = instance;
        const subTreeVnode = instance.render.call(proxy);
        instance.subTree = subTreeVnode;
        //处理完所有element 递归处理
        patch(null,subTreeVnode, container, instance);
        initialVNode.el = subTreeVnode.el;
        instance.isMounted = true;
      } else {
        console.log("update");
        let { proxy } = instance;
        const subTreeVnode = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        instance.subTree = subTreeVnode;
        patch(prevSubTree, subTreeVnode, container, instance);
      }
    });
  }

  return {
    createApp: createAppApi(render),
  };
}

