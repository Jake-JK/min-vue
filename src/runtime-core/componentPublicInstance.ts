import { isOwn } from "../shared/index";

const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // setupState
    const { setupState, props } = instance;
    if (isOwn(setupState, key)) {
      return setupState[key];
    }else if(isOwn(props, key)){
      return props[key]
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
