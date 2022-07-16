import { extend } from "../shared";

let activeEffect: ReactiveEffect
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
    let parent: any = activeEffect;
    activeEffect = this
    return this._fn()
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
}
/**
 * 依赖收集
 */
const targetMap: Map<Object, Map<Object, Set<ReactiveEffect>>> = new Map()
export function track(target: Object, key: string | symbol) {
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
  if (!activeEffect) return
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