import { hasChanged, isObject } from "../shared"
import { isTracking, trackEffect, triggerEffect } from "./effect"
import { reactive } from "./reactive"
class RefImpl {
  private _value: any
  public dep: Set<any>
  private _rawValue: any
  public __v_isRef = true
  constructor(val) {
    this._rawValue = val
    this._value = covert(val)
    this.dep = new Set()
  }
  get value() {
    if (isTracking()) {
      //依赖收集
      trackEffect(this.dep)
    }

    return this._value
  }
  set value(newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue
      this._value = covert(newValue)
      triggerEffect(this.dep)
    }
  }
}

function covert(val) {
  return isObject(val) ? reactive(val) : val
}


export function ref(val) {
  return new RefImpl(val)
}

export function isRef(ref) {
  return !!ref.__v_isRef
}

export function unRef(val) {
  if (isRef(val)) {
    return val.value
  }
  return val
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key))
    },
    set(target, key, value) {
      if(isRef(target[key]) && !isRef(value)){
        return target[key].value = value
      }else{
        return Reflect.set(target, key, value)
      }
    }
  })
}