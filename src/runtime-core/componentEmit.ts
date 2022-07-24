

export function emit(instance, event, ...arg) {


  let { props } = instance
  

  //on + event
  const getOnEvent = (e:string)=> {
    if(/^on[A-Z]/.test(e)) return e;
    return `on${e.charAt(0).toUpperCase()}${e.slice(1)}`
  }

  //foo-add -> fooAdd
  const camelize = (e:string)=>{
    return e.replace(/\-(\w)/g, (_, c:string)=>{
      return c? c.toUpperCase() : ''
    })
  }


  
  let handleName = camelize(event);
   handleName = getOnEvent(handleName);
  

  let handle = props[handleName]
  handle && handle(...arg)
}