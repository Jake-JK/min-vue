import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    emit: ()=>{}
  }
  return component
}


export function setupComponent(instance) {
  // TODO
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  setupStatefulComponent(instance)
}
 
let currentInstance = null;
function setupStatefulComponent(instance: any) {
  const Component = instance.type
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)
  const { setup } = Component;
  const { props } = instance
  if (setup) {
    const _emit = emit.bind(null, instance)
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(props),{
      emit: _emit 
    })
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(instance: any, setupResult: any) {
  // function Object
  // TODO function
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult
  }


  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type
  // if (!Component.render) {
  instance.render = Component.render
  // }
}

export function getCurrentInstance(){
  return currentInstance
}

function setCurrentInstance(instance){
  currentInstance = instance
}