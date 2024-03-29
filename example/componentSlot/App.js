import { h,createTextVNode } from "../../lib/mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App");
    // object key
    const app2 = h(
      Foo,
      {},
      {
        header: ({ age }) => [h("p", {}, "header" + age)],
        footer: () => h("p", {}, "footer"),
        text: () => createTextVNode('this is a text  for header')
      },
      
    );
    // 数组 vnode
    // const foo = h(Foo, {},  h("p", {}, "123"));
    return h("div", {}, [app, app2]);
  },

  setup() {
    return {};
  },
};
