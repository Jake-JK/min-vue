import { effect, track, trigger } from "./effect";
import {get, mutableHandler, readonlyGet, readonlyHandler, set} from './baseHandler'



export function reactive(raw) {
  return new Proxy(raw, mutableHandler)
}

export function readonly(target) {
  return new Proxy(target, readonlyHandler)
}

