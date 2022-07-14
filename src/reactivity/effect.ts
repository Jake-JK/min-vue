let activeEffect: ReactiveEffect
class ReactiveEffect {
  private _fn: Function
  constructor(fn) {
    this._fn = fn
  }
  run() {
    activeEffect = this
    return this._fn()
  }
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
  dep.add(activeEffect)
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
      effect.run();
    }
  }
}



export function effect(fn):Function {
  let curEffect = new ReactiveEffect(fn);
  curEffect.run()
  return curEffect.run.bind(curEffect)
}