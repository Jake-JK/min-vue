'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal);
};
const isOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

let activeEffect;
let shouldTrack = false;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.dep = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    /**
     * 执行_fn
     * @returns
     */
    run() {
        if (!this.active) {
            return this._fn();
        }
        activeEffect = this;
        shouldTrack = true;
        //执行点_fn 会进行依赖收集
        let result = this._fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            clearupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
/**
 * 清除effect 的 dep
 * @param effect
 */
function clearupEffect(effect) {
    effect.dep.forEach((item) => {
        item.delete(effect);
    });
    effect.dep.length = 0;
}
function isTracking() {
    return activeEffect && shouldTrack;
}
/**
 * 依赖收集
 */
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffect(dep);
}
function trackEffect(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.dep.push(dep);
}
/**
 * 触发依赖方法
 * @param target
 * @param key
 */
function trigger(target, key) {
    let despMap = targetMap.get(target);
    let dep = despMap === null || despMap === void 0 ? void 0 : despMap.get(key);
    if (dep) {
        triggerEffect(dep);
    }
}
function triggerEffect(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, option = {}) {
    let curEffect = new ReactiveEffect(fn, option.scheduler);
    extend(curEffect, option);
    curEffect.run();
    let runner = curEffect.run.bind(curEffect);
    runner.effect = curEffect;
    return runner;
}

let get = createGetter();
let set = createSetter();
let readonlyGet = createGetter(true);
let shallowReadonlyGet = createGetter(true, true);
//返回一个get方法，ps:闭包
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        let val = Reflect.get(target, key);
        if (shallow) {
            return val;
        }
        if (isObject(val)) {
            return isReadonly ? readonly(val) : reactive(val);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return val;
    };
}
function createSetter() {
    return function (target, key, value) {
        let res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandler = {
    get, set
};
const readonlyHandler = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`${String(key)} set失败， 因为 target 为 readonly 对象,不可被改变`);
        return true;
    }
};
const shallowReadonlyHandler = extend({}, readonlyHandler, {
    get: shallowReadonlyGet
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandler);
}
function readonly(target) {
    return createReactiveObject(target, readonlyHandler);
}
function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyHandler);
}
function createReactiveObject(target, baseHandles) {
    if (!isObject(target)) {
        console.warn(`target ${target} 必须是一个对象`);
        return target;
    }
    return new Proxy(target, baseHandles);
}

class RefImpl {
    constructor(val) {
        this.__v_isRef = true;
        this._rawValue = val;
        this._value = covert(val);
        this.dep = new Set();
    }
    get value() {
        if (isTracking()) {
            //依赖收集
            trackEffect(this.dep);
        }
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = covert(newValue);
            triggerEffect(this.dep);
        }
    }
}
function covert(val) {
    return isObject(val) ? reactive(val) : val;
}
function ref(val) {
    return new RefImpl(val);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(val) {
    if (isRef(val)) {
        return val.value;
    }
    return val;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

function emit(instance, event, ...arg) {
    let { props } = instance;
    //on + event
    const getOnEvent = (e) => {
        if (/^on[A-Z]/.test(e))
            return e;
        return `on${e.charAt(0).toUpperCase()}${e.slice(1)}`;
    };
    //foo-add -> fooAdd
    const camelize = (e) => {
        return e.replace(/\-(\w)/g, (_, c) => {
            return c ? c.toUpperCase() : '';
        });
    };
    let handleName = camelize(event);
    handleName = getOnEvent(handleName);
    let handle = props[handleName];
    handle && handle(...arg);
}

const initProps = (instance, rawProps) => {
    instance.props = rawProps || {};
    return instance;
};

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState
        const { setupState, props } = instance;
        if (isOwn(setupState, key)) {
            return setupState[key];
        }
        else if (isOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parentComponent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        parent: parentComponent,
        provides: parentComponent ? parentComponent.provides : {},
        isMounted: false,
        subTree: {},
        emit: () => { }
    };
    return component;
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
let currentInstance = null;
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    const { props } = instance;
    if (setup) {
        const _emit = emit.bind(null, instance);
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(props), {
            emit: _emit
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    // TODO function
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // if (!Component.render) {
    instance.render = Component.render;
    // }
}
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (isObject(children)) {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type == 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function createAppApi(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer, null);
            }
        };
    };
}

/**
 * render 流程
 * patch 触发渲染
 *   processCompnent 处理组件
 *   mountComponent 挂载组件
 *      createComponentInstance 创建组件实例
*       {
            vnode,
            type: vnode.type
        }
        setupComponent setUp
 *
 */
function createRenderer(options) {
    const { createElement, patchProp: hostPathProp, insert } = options;
    function render(vnode, container, parentComponent) {
        patch(null, vnode, container, parentComponent);
    }
    function patch(n1, n2, container, parentComponent) {
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        let el = (n2.el = document.createTextNode(n2.children));
        container.append(el);
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2);
        }
    }
    function mountElement(vnode, container, parentComponent) {
        const el = (vnode.el = createElement(vnode));
        const { children, props, shapeFlag } = vnode;
        if (props) {
            for (const key in props) {
                hostPathProp(el, key, null, props);
            }
        }
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(children, el, parentComponent);
        }
        insert(container, el);
    }
    function patchElement(n1, n2, container) {
        console.log("patchElement");
        console.log("n1", n1);
        console.log("n2", n2);
        let prevProps = n1.props || EMPTY_OBJ;
        let nextProps = n2.props || EMPTY_OBJ;
        let el = (n2.el = n1.el);
        console.log("prevProps:", prevProps);
        console.log("nextProps:", nextProps);
        patchProps(el, prevProps, nextProps);
    }
    function patchProps(el, prevProps, nextProps) {
        for (const key in nextProps) {
            if (prevProps[key] !== nextProps[key]) {
                hostPathProp(el, key, prevProps, nextProps);
            }
        }
        if (prevProps !== EMPTY_OBJ) {
            for (const key in prevProps) {
                if (!nextProps[key]) {
                    hostPathProp(el, key, null, nextProps);
                }
            }
        }
    }
    function mountChildren(children, el, parentComponent) {
        children.forEach((item) => {
            patch(null, item, el, parentComponent);
        });
    }
    function processComponent(n1, vnode, container, parentComponent) {
        mountComponent(vnode, container, parentComponent);
    }
    function mountComponent(initialVNode, container, parentComponent) {
        const instance = createComponentInstance(initialVNode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container);
    }
    function setupRenderEffect(instance, initialVNode, container) {
        effect(() => {
            if (!instance.isMounted) {
                let { proxy } = instance;
                const subTreeVnode = instance.render.call(proxy);
                instance.subTree = subTreeVnode;
                //处理完所有element 递归处理
                patch(null, subTreeVnode, container, instance);
                initialVNode.el = subTreeVnode.el;
                instance.isMounted = true;
            }
            else {
                console.log("update");
                let { proxy } = instance;
                const subTreeVnode = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTreeVnode;
                patch(prevSubTree, subTreeVnode, container, instance);
            }
        });
    }
    return {
        createApp: createAppApi(render),
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function provide(key, value) {
    let currentInstance = getCurrentInstance();
    if (!currentInstance)
        return;
    let parentProvides = currentInstance.parent.provides;
    let provides = currentInstance.provides;
    if (provides === currentInstance.parent.provides) {
        currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
}
function inject(key, defaultValue) {
    let instance = getCurrentInstance();
    let res = instance.parent.provides[key];
    if (typeof defaultValue == 'function') {
        defaultValue = defaultValue();
    }
    return res ? res : defaultValue;
}

const render = createRenderer({
    createElement(node) {
        return document.createElement(node.type);
    },
    patchProp(el, key, prevProps, nextProps) {
        let isOn = (e) => {
            return /^on[A-Z]/.test(e);
        };
        let getEvent = (e) => {
            return e.slice(2).toLowerCase();
        };
        if (isOn(key)) {
            el.addEventListener(getEvent(key), nextProps[key]);
        }
        else {
            if (nextProps[key] === null || nextProps[key] === undefined) {
                el.removeAttribute(key, nextProps[key]);
            }
            else {
                el.setAttribute(key, nextProps[key]);
            }
        }
    },
    insert(container, el) {
        container.append(el);
    },
});
function createApp(...arg) {
    return render.createApp(...arg);
}

exports.createApp = createApp;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
