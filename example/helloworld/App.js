import { h } from '../../lib/mini-vue.esm.js'
import {Foo} from './Foo.js'
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
      class: ["red", "green"],
      onClick :() => {
        console.log('click')
      },
      onMousedown:() => {
        console.log('mouseDown')
        
      }
      

    },
    [h('div',{},"hi, " + this.msg), h(Foo,{
      count:1
    })]
    
    // [h("p", { class:"red",onClick:()=>console.log('click')}, "hi," + this.msg), h("p", {class:"green"}, "mini-vue")]
    )
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
