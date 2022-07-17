import { ReactiveEffect } from "./effect"

class ComputedRefImpl {
  getter: any
  private _dirty: boolean
  effect: ReactiveEffect
  private _value: any
  constructor(getter) {
    this.getter = getter
    this._dirty = true
    this._value = undefined
    this.effect = new ReactiveEffect(this.getter, ()=>{
      if(!this._dirty){
        this._dirty = true
      }
    })
  }

  get value() {
    if(this._dirty){
      this._value = this.effect.run()
      this._dirty = false
    }
    return this._value
  }

}

export function computed(getter) {
  return new ComputedRefImpl(getter)
}