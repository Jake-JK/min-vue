import {mutableHandler,readonlyHandler} from './baseHandler'

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

export function reactive(raw) {
  return new Proxy(raw, mutableHandler)
}

export function readonly(target) {
  return new Proxy(target, readonlyHandler)
}

export function isReadonly(target){
  return !!target[ReactiveFlags.IS_READONLY]
}

export function isReactive(target) {
  return target[ReactiveFlags.IS_REACTIVE]
}