import { h } from '../../lib/mini-vue.esm.js'
export const App = {

  render() {
    // ui
    return h("div", {
      id:"root",
      class: ["red", "green"]
    },
    [h("p", { class:"red"}, "hi"), h("p", {class:"green"}, "mini-vue")]);
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
