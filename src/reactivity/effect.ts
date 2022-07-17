import { extend } from "../shared";

export let activeEffect: ReactiveEffect
let shouldTrack: boolean = false  
class ReactiveEffect {
  private _fn: Function
  dep: Array<Set<ReactiveEffect>> = []
  active = true
  onStop?: ()=>void
  scheduler: Function | undefined 
  constructor(fn, scheduler: Function | undefined) {
    this._fn = fn
    this.scheduler = scheduler;
  }
  run() {
    if(!this.active) {
      return this._fn();
    }
    
    activeEffect = this
    shouldTrack = true
    //执行点_fn 会进行依赖收集
    let result = this._fn()
    shouldTrack = false 
    return result 
  }

  stop() {
    if (this.active) {
      clearupEffect(this)
      if(this.onStop){
        this.onStop()
      }
      this.active = false
    }
  }
}
/**
 * 清除effect 的 dep
 * @param effect 
 */
function clearupEffect(effect: ReactiveEffect){
  effect.dep.forEach((item: Set<ReactiveEffect>) => {
    item.delete(effect)
  }) 
  effect.dep.length = 0
}

function isTracking(){
  return activeEffect && shouldTrack
}

/**
 * 依赖收集
 */
const targetMap: Map<Object, Map<Object, Set<ReactiveEffect>>> = new Map()
export function track(target: Object, key: string | symbol) {
  if(!isTracking()) return
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep)
  }
  
  if (dep.has(activeEffect)) return
  dep.add(activeEffect)
  activeEffect.dep.push(dep)
}

/**
 * 触发依赖方法
 * @param target 
 * @param key 
 */
export function trigger(target, key) {
  let despMap = targetMap.get(target);
  let dep = despMap?.get(key)
  if (dep) {
    for (const effect of dep) {
      if (effect.scheduler) {
        effect.scheduler()
      } else {
        effect.run();
      }
    }
  }
}

export function stop(runner) {
  let effect = runner.effect
  effect.stop()
}



export function effect(fn, option: any = {}): Function {
  let curEffect = new ReactiveEffect(fn, option.scheduler);
  extend(curEffect, option)
  curEffect.run()
  let runner: any = curEffect.run.bind(curEffect)
  runner.effect = curEffect
  return runner
}

export function getActiveEffect(){
  return activeEffect
}