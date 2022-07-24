import { isObject } from '../shared'
import { mutableHandler, readonlyHandler, shallowReadonlyHandler } from './baseHandler'

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandler)
}

export function readonly(target) {
  return createReactiveObject(target, readonlyHandler)
}

export function shallowReadonly(target) {
  return createReactiveObject(target, shallowReadonlyHandler)
}

export function isReadonly(target) {
  return !!target[ReactiveFlags.IS_READONLY]
}

export function isReactive(target) {
  return target[ReactiveFlags.IS_REACTIVE]
}

export function isProxy(target) {
  return isReactive(target) || isReadonly(target)
}

function createReactiveObject(target, baseHandles) {
  if (!isObject(target)) {
    console.warn(`target ${target} 必须是一个对象`);
    return target
  }

  return new Proxy(target, baseHandles);
}
