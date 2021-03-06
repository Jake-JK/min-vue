import { isObject, extend } from "../shared/index";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";

export let get = createGetter()
export let set = createSetter()
export let readonlyGet = createGetter(true)
export let shallowReadonlyGet = createGetter(true, true)
//返回一个get方法，ps:闭包
function createGetter(isReadonly: boolean = false, shallow = false) {
  return function get(target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }

    let val = Reflect.get(target, key);
    if (shallow) {
      return val
    }
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
    console.warn(`${String(key)} set失败， 因为 target 为 readonly 对象,不可被改变`)
    return true
  }
}

export const shallowReadonlyHandler = extend({}, readonlyHandler, {
  get: shallowReadonlyGet
})