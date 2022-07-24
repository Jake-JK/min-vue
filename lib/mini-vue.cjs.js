'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var extend = Object.assign;
var isObject = function (val) {
    return val !== null && typeof val === 'object';
};
var isOwn = function (target, key) { return Object.prototype.hasOwnProperty.call(target, key); };

/**
 * 依赖收集
 */
var targetMap = new Map();
/**
 * 触发依赖方法
 * @param target
 * @param key
 */
function trigger(target, key) {
    var despMap = targetMap.get(target);
    var dep = despMap === null || despMap === void 0 ? void 0 : despMap.get(key);
    if (dep) {
        triggerEffect(dep);
    }
}
function triggerEffect(dep) {
    for (var _i = 0, dep_1 = dep; _i < dep_1.length; _i++) {
        var effect_1 = dep_1[_i];
        if (effect_1.scheduler) {
            effect_1.scheduler();
        }
        else {
            effect_1.run();
        }
    }
}

var get = createGetter();
var set = createSetter();
var readonlyGet = createGetter(true);
var shallowReadonlyGet = createGetter(true, true);
//返回一个get方法，ps:闭包
function createGetter(isReadonly, shallow) {
    if (isReadonly === void 0) { isReadonly = false; }
    if (shallow === void 0) { shallow = false; }
    return function get(target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        var val = Reflect.get(target, key);
        if (shallow) {
            return val;
        }
        if (isObject(val)) {
            return isReadonly ? readonly(val) : reactive(val);
        }
        return val;
    };
}
function createSetter() {
    return function (target, key, value) {
        var res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
var mutableHandler = {
    get: get,
    set: set
};
var readonlyHandler = {
    get: readonlyGet,
    set: function (target, key, value) {
        console.warn("".concat(String(key), " set\u5931\u8D25\uFF0C \u56E0\u4E3A target \u4E3A readonly \u5BF9\u8C61,\u4E0D\u53EF\u88AB\u6539\u53D8"));
        return true;
    }
};
var shallowReadonlyHandler = extend({}, readonlyHandler, {
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
        console.warn("target ".concat(target, " \u5FC5\u987B\u662F\u4E00\u4E2A\u5BF9\u8C61"));
        return target;
    }
    return new Proxy(target, baseHandles);
}

function emit(instance, event) {
    var arg = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        arg[_i - 2] = arguments[_i];
    }
    var props = instance.props;
    //on + event
    var getOnEvent = function (e) {
        if (/^on[A-Z]/.test(e))
            return e;
        return "on".concat(e.charAt(0).toUpperCase()).concat(e.slice(1));
    };
    //foo-add -> fooAdd
    var camelize = function (e) {
        return e.replace(/\-(\w)/g, function (_, c) {
            return c ? c.toUpperCase() : '';
        });
    };
    var handleName = camelize(event);
    handleName = getOnEvent(handleName);
    var handle = props[handleName];
    handle && handle.apply(void 0, arg);
}

var initProps = function (instance, rawProps) {
    instance.props = rawProps || {};
    return instance;
};

var publicPropertiesMap = {
    $el: function (i) { return i.vnode.el; },
};
var PublicInstanceProxyHandlers = {
    get: function (_a, key) {
        var instance = _a._;
        // setupState
        var setupState = instance.setupState, props = instance.props;
        if (isOwn(setupState, key)) {
            return setupState[key];
        }
        else if (isOwn(props, key)) {
            return props[key];
        }
        var publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function createComponentInstance(vnode) {
    var component = {
        vnode: vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: function () { }
    };
    return component;
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    // initSlots()  
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    var Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    var setup = Component.setup;
    var props = instance.props;
    if (setup) {
        var _emit = emit.bind(null, instance);
        var setupResult = setup(shallowReadonly(props), {
            emit: _emit
        });
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    // TODO function
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    var Component = instance.type;
    // if (!Component.render) {
    instance.render = Component.render;
    // }
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
function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    var shapeFlag = vnode.shapeFlag;
    if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
    else if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
    }
}
function processElement(vnode, container) {
    var el = (vnode.el = document.createElement(vnode.type));
    var children = vnode.children, props = vnode.props, shapeFlag = vnode.shapeFlag;
    if (props) {
        var isOn = function (e) {
            return /^on[A-Z]/.test(e);
        };
        var getEvent = function (e) {
            return e.slice(2).toLowerCase();
        };
        for (var key in props) {
            if (isOn(key)) {
                el.addEventListener(getEvent(key), props[key]);
            }
            else {
                el.setAttribute(key, props[key]);
            }
        }
    }
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(children, el);
    }
    container.append(el);
}
function mountChildren(children, el) {
    children.forEach(function (item) {
        patch(item, el);
    });
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    var instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container) {
    var proxy = instance.proxy;
    var subTreeVnode = instance.render.call(proxy);
    //处理完所有element 递归处理
    patch(subTreeVnode, container);
    instance.vnode.el = subTreeVnode.el;
}

function createVNode(type, props, children) {
    var vnode = {
        type: type,
        props: props,
        children: children,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type == 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function createApp(rootComponent) {
    return {
        mount: function (rootContainer) {
            var vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
