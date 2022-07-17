import { hasChanged, isObject } from "../shared"
import { isTracking, trackEffect, triggerEffect } from "./effect"
import { reactive } from "./reactive"

class RefImpl {
  private _value: any
  public dep: Set<any>
  private _rawValue: any
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
    if(hasChanged(newValue, this._rawValue)){
      this._rawValue = newValue
      this._value = covert(newValue)
      triggerEffect(this.dep)
    }
  }
}

function covert(val){
  return isObject(val)? reactive(val) : val
}


export function ref(val) {
  return new RefImpl(val)
}
