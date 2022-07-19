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

  processComponent(vnode, container)
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