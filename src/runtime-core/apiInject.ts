import { getCurrentInstance } from "./component";


export function provide(key, value) {
  let currentInstance: any = getCurrentInstance();
  if(!currentInstance) return
  let parentProvides = currentInstance.parent.provides;
  let provides = currentInstance.provides
  if (provides === currentInstance.parent.provides) {
    currentInstance.provides = Object.create(parentProvides);
  }
  provides[key] = value

}

export function inject(key, defaultValue) {
  let instance: any = getCurrentInstance()
  return instance.parent.provides[key]
}