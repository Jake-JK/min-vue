import { isObject } from "../shared";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";

export let get = createGetter()
export let set = createSetter()
export let readonlyGet = createGetter(true)


function createGetter(isReadonly: boolean = false) {
  return function (target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }
    let val = Reflect.get(target, key);
    if (isObject(val)) {
      return isReadonly ? readonly(val) : reactive(val)
    }
    if (!isReadonly) {
      track(target, key)
    }
    return val;
  }
}

function createSetter() {
  return function (target, key, value) {
    let res = Reflect.set(target, key, value)
    trigger(target, key)
    return res
  }
}

export const mutableHandler = {
  get, set
}

export const readonlyHandler = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`${target} 为 readonly 对象,不可被改变`)
    return true
  }
}