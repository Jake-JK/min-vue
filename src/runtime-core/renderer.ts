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
  if (typeof vnode.type == 'object') {
    processComponent(vnode, container)
  } else if (typeof vnode.type == 'string') {
    processElement(vnode, container)
  }
}

function processElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type)
  const { children, props } = vnode;
  
  if (props) {
    for (const key in props) {
      el.setAttribute(key, props[key])
    }
  }
  if (typeof children == 'string') {
    el.textContent = children
  } else if (Array.isArray(children)) {
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
  setupRenderEffect(instance, container)
}
function setupRenderEffect(instance: any, container: any) {
  const subTree = instance.render()

  patch(subTree, container)
}