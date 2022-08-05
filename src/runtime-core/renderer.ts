import { EMPTY_OBJ } from "./../shared/index";
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
  const {
    createElement: hostCreateElement,
    patchProp: hostPathProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  function render(vnode: vnode, container, parentComponent) {
    patch(null, vnode, container, parentComponent);
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

  function processText(n1, n2: any, container: any) {
    let el = (n2.el = document.createTextNode(n2.children));

    container.append(el);
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2.children, container, parentComponent);
  }

  function processElement(n1, n2: any, container: any, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, parentComponent);
    }
  }

  function mountElement(vnode: any, container: any, parentComponent: any) {
    const el = (vnode.el = hostCreateElement(vnode));
    const { children, props, shapeFlag } = vnode;
    if (props) {
      for (const key in props) {
        hostPathProp(el, key, null, props);
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent);
    }
    hostInsert(container, el);
  }

  function patchElement(n1, n2, parentCompoent) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);

    let prevProps = n1.props || EMPTY_OBJ;
    let nextProps = n2.props || EMPTY_OBJ;

    let el = (n2.el = n1.el);
    console.log("prevProps:", prevProps);
    console.log("nextProps:", nextProps);
    patchChildren(el, n1, n2, parentCompoent);
    patchProps(el, prevProps, nextProps);
  }

  function patchChildren(el, n1, n2, parentCompoent) {
    let prevShapFlag = n1.shapeFlag;
    let nextShapFlag = n2.shapeFlag;
    let prevChildren = n1.children;
    let nextChildren = n2.children;

    if (nextShapFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(prevChildren);
      }

      if (prevChildren !== nextChildren) {
        hostSetElementText(el, nextChildren);
      }
    } else {
      hostSetElementText(el, "");
      mountChildren(nextChildren, el, parentCompoent);
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      let item = children[i].el;
      hostRemove(item);
    }
  }

  function patchProps(el, prevProps, nextProps) {
    for (const key in nextProps) {
      if (prevProps[key] !== nextProps[key]) {
        hostPathProp(el, key, prevProps, nextProps);
      }
    }

    if (prevProps !== EMPTY_OBJ) {
      for (const key in prevProps) {
        if (!nextProps[key]) {
          hostPathProp(el, key, null, nextProps);
        }
      }
    }
  }

  function mountChildren(children: Array<any>, el: any, parentComponent) {
    children.forEach((item) => {
      patch(null, item, el, parentComponent);
    });
  }

  function processComponent(n1, vnode: vnode, container: any, parentComponent) {
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
        patch(null, subTreeVnode, container, instance);
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
