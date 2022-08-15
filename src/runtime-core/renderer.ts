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
    patch(null, vnode, container, parentComponent, null);
  }

  function patch(
    n1: vnode | null,
    n2: vnode,
    container: any,
    parentComponent,
    archor
  ) {
    const { shapeFlag, type } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, archor);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, archor);
        } else if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, archor);
        }
        break;
    }
  }

  function processText(n1, n2: any, container: any) {
    let el = (n2.el = document.createTextNode(n2.children));

    container.append(el);
  }

  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    archor
  ) {
    mountChildren(n2.children, container, parentComponent, archor);
  }

  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    archor
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, archor);
    } else {
      patchElement(n1, n2, parentComponent, archor);
    }
  }

  function mountElement(
    vnode: any,
    container: any,
    parentComponent: any,
    archor
  ) {
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
      mountChildren(children, el, parentComponent, archor);
    }
    hostInsert(container, el, archor);
  }

  function patchElement(n1, n2, parentCompoent, archor) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);

    let prevProps = n1.props || EMPTY_OBJ;
    let nextProps = n2.props || EMPTY_OBJ;

    let el = (n2.el = n1.el);
    console.log("prevProps:", prevProps);
    console.log("nextProps:", nextProps);
    patchChildren(el, n1, n2, parentCompoent, archor);
    patchProps(el, prevProps, nextProps);
  }

  function patchChildren(el, n1, n2, parentCompoent, archor) {
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
      if (prevShapFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(el, "");
        mountChildren(nextChildren, el, parentCompoent, archor);
      }
      if (prevShapFlag & ShapeFlags.ARRAY_CHILDREN) {
        console.log("ArrayToArray");
        patchKeyedChildren(prevChildren, nextChildren, el, parentCompoent);
      }
    }
  }

  function patchKeyedChildren(n1, n2, container, parentComponent) {
    //左侧对比
    let i = 0;
    let e1 = n1.length - 1;
    let e2 = n2.length - 1;

    function isSameChilren(c1, c2) {
      return c1.type === c2.type && c1.props.key === c2.props.key;
    }

    while (i <= e1 && i <= e2) {
      let c1 = n1[i];
      let c2 = n2[i];
      if (isSameChilren(c1, c2)) {
        patch(c1, c2, container, parentComponent, null);
      } else {
        break;
      }
      i++;
    }

    console.log("i", i);

    //右侧对比
    while (e1 >= i && e2 >= i) {
      let c1 = n1[e1];
      let c2 = n2[e2];
      if (isSameChilren(c1, c2)) {
        patch(c1, c2, container, parentComponent, null);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    console.log("e1", e1);
    console.log("e2", e2);

    //新的比老的长  - 新增
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < n2.length ? n2[nextPos].el : null;
        while (i <= e2) {
          patch(null, n2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(n1[i].el);
        i++;
      }
    } else {
      //中间部分
      /**
       * 移动逻辑
       * 1、求出新序列中对旧序列中的下标映射
       * 2、求出下标映射中的最长递增子序列
       * 3、遍历新序列中下标是否存在最长子序列中，如果不存在，则移动
       */
      let s1 = i;
      let s2 = i;

      let newIndexMap = new Map();

      for (let i = s2; i <= e2; i++) {
        newIndexMap.set(n2[i].props.key, i);
      }

      let newIndex;
      let toBePatch = e2 - s2 + 1;
      let newIndexToOldIndexMap = new Array(toBePatch);
      for (let i = 0; i < toBePatch; i++) {
        newIndexToOldIndexMap[i] = 0;
      }
      let patchTimes = 0;
      for (let i = s1; i <= e1; i++) {
        let prevNode = n1[i];
        if (patchTimes >= toBePatch) {
          hostRemove(prevNode.el);
          continue;
        }

        let key = prevNode.props.key;
        if (newIndexMap.has(key)) {
          newIndex = newIndexMap.get(key);
          //1.求出新序列中对旧序列中的下标映射.
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(prevNode, n2[newIndex], container, parentComponent, null);
        } else {
          hostRemove(prevNode.el);
          patchTimes++;
        }
      }

      //2.求出最长递增子序列
      let increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
      console.log(`新旧下标映射`, newIndexToOldIndexMap)
      console.log(`最长递增子序列`, increasingNewIndexSequence);
      
      let j = increasingNewIndexSequence.length -1; //incresasingNewIndexSequence 初始下标
      //3、遍历新序列中的中间序列
      for (let i = toBePatch-1; i >= 0 ; i--) {
        let nextPos = i+s2;
        let nextChild = n2[nextPos];
        let anchor = nextPos + 1 < n2.length ? n2[nextPos+1].el : null;

        if(newIndexToOldIndexMap[nextPos-s2] == 0){
          patch(null, nextChild, container, parentComponent, anchor);
        }else if(increasingNewIndexSequence[j] !== i){
          hostInsert( container, nextChild.el,anchor)
          console.log('移动');
        }else{
          j--
        }
      }

      console.log(newIndexMap);
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

  function mountChildren(
    children: Array<any>,
    el: any,
    parentComponent,
    archor
  ) {
    children.forEach((item) => {
      patch(null, item, el, parentComponent, archor);
    });
  }

  function processComponent(
    n1,
    vnode: vnode,
    container: any,
    parentComponent,
    archor
  ) {
    mountComponent(vnode, container, parentComponent, archor);
  }

  function mountComponent(
    initialVNode: vnode,
    container: any,
    parentComponent,
    archor
  ) {
    const instance = createComponentInstance(initialVNode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, archor);
  }
  function setupRenderEffect(
    instance: any,
    initialVNode: vnode,
    container: any,
    archor
  ) {
    effect(() => {
      if (!instance.isMounted) {
        let { proxy } = instance;
        const subTreeVnode = instance.render.call(proxy);
        instance.subTree = subTreeVnode;
        //处理完所有element 递归处理
        patch(null, subTreeVnode, container, instance, archor);
        initialVNode.el = subTreeVnode.el;
        instance.isMounted = true;
      } else {
        console.log("update");
        let { proxy } = instance;
        const subTreeVnode = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        instance.subTree = subTreeVnode;
        patch(prevSubTree, subTreeVnode, container, instance, archor);
      }
    });
  }

  return {
    createApp: createAppApi(render),
  };
}

function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
