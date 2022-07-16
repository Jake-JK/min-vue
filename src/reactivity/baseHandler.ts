import { track, trigger } from "./effect";

export let get = createGetter()
export let set = createSetter()
export let readonlyGet = createGetter(true)


function createGetter(isReadonly: boolean = false) {
  return function (target, key) {
    let val = Reflect.get(target, key);
    if (!isReadonly) {
      track(target, key)
    }
    return val;
  }
}

function createSetter(){
  return function (target, key, value){
    let res = Reflect.set(target, key, value)
    trigger(target, key)
    return res    
  }
}

export const  mutableHandler = {
  get, set
} 

export const readonlyHandler = {
  get: readonlyGet,
  set(target, key, value){
    console.warn(`${target} 为 readonly 对象,不可被改变`)
    return true
  }
}