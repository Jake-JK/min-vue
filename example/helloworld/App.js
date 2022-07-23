import { h } from '../../lib/mini-vue.esm.js'
window.self = null

window.to = function(num){
  return Number(num).toString('2')
};
export const App = {
  render() {

    self = this
    // ui
    return h("div", {
      id:"root",
      class: ["red", "green"]
    },
    // "hi, " + this.msg
    [h("p", { class:"red"}, "hi," + this.msg), h("p", {class:"green"}, "mini-vue")]
    )
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
