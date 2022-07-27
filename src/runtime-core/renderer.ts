import { ShapeFlags } from "../shared/ShapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { Fragment, vnode, Text } from "./vnode"

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
export function render(vnode: vnode, container) {
  patch(vnode, container)
}
function patch(vnode: vnode, container: any) {
  const { shapeFlag, type } = vnode
  switch (type) {
    case Fragment:
      processFragment(vnode, container);
      break;
    case Text:
      processText(vnode, container);
      break
    default:
      if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container)
      } else if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container)
      }
      break;
  }
}

function processText(vnode: any, container: any) {
  let el = (vnode.el = document.createTextNode(vnode.children));
  
  container.append(el)
}

function processFragment(vnode: any, container: any) {
  mountChildren(vnode.children, container)
}

function processElement(vnode: any, container: any) {
  const el = (vnode.el = document.createElement(vnode.type))
  const { children, props, shapeFlag } = vnode;
  if (props) {
    let isOn = (e: string) => {
      return /^on[A-Z]/.test(e)
    }
    let getEvent = (e: string) => {
      return e.slice(2).toLowerCase()
    }
    for (const key in props) {
      if (isOn(key)) {
        el.addEventListener(getEvent(key), props[key])
      } else {
        el.setAttribute(key, props[key])
      }
    }
  }
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el)
  }
  container.append(el)
}

function mountChildren(children: Array<any>, el: any) {
  children.forEach(item => {
    patch(item, el)
  })
}

function processComponent(vnode: vnode, container: any) {
  mountComponent(vnode, container)
}
function mountComponent(initialVNode: vnode, container: any) {
  const instance = createComponentInstance(initialVNode)
  setupComponent(instance)
  setupRenderEffect(instance, initialVNode, container)
}
function setupRenderEffect(instance: any, initialVNode: vnode, container: any) {
  let { proxy } = instance;
  const subTreeVnode = instance.render.call(proxy)
  //处理完所有element 递归处理
  patch(subTreeVnode, container)
  initialVNode.el = subTreeVnode.el
}