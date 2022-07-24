
import {h} from '../../lib/mini-vue.esm.js'

export const Foo = {
  name:'Foo',
  setup(props){
    //props is shallowReadony 
    props.count ++
    console.log(props);
  },
  render(){
    return h('div', {} ,`foo:${this.count} `)
  }
}