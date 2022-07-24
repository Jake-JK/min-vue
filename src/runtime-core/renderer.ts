import { ShapeFlags } from "../shared/ShapeFlags"
import { createComponentInstance, setupComponent } from "./component"

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
export function render(vnode, container) {
  patch(vnode, container)
}
function patch(vnode: any, container: any) {
  const { shapeFlag } = vnode
  if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    processComponent(vnode, container)
  } else if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container)
  }
}

function processElement(vnode: any, container: any) {
  const el = (vnode.el = document.createElement(vnode.type))
  const { children, props, shapeFlag } = vnode;
  if (props) {
    let isOn = (e:string) => {
      return /^on[A-Z]/.test(e)
    }
    let getEvent = (e:string) => {
      return e.slice(2).toLowerCase()
    }
    for (const key in props) {
      if(isOn(key)) {
        el.addEventListener(getEvent(key), props[key])
      }
      el.setAttribute(key, props[key])
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

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container)
}
function mountComponent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode)
  setupComponent(instance)
  setupRenderEffect(instance, vnode, container)
}
function setupRenderEffect(instance: any, vnode, container: any) {
  let { proxy } = instance;
  const subTreeVnode = instance.render.call(proxy)
  //处理完所有element 递归处理
  patch(subTreeVnode, container)
  instance.vnode.el = subTreeVnode.el
}