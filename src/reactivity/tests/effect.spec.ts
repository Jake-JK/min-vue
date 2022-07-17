import { effect,stop } from "../effect";
import { reactive } from "../reactive";

describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });

    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);

    // update
    user.age++;
    expect(nextAge).toBe(12);
  });

  it('should return runner when call effect', ()=>{
    let foo = 0;
    let runner = effect(()=>{
      foo += 1
      return 'foo'
    })
    expect(foo).toBe(1)
    let c = runner()
    expect(foo).toBe(2)
    expect(c).toBe('foo')
  })

});

/**
 * 第一执行effect 里的第一个回调方法，
 * 如果第二个参数里有scheduler方法，
 * 当响应式对象发生改变，那么第二次及之后则调用scheduler方法 
 */
it("scheduler", () => {
  let dummy;
  let run: any;
  const scheduler = jest.fn(() => {
    run = runner;
  });
  const obj = reactive({ foo: 1 });
  const runner = effect(
    () => {
      dummy = obj.foo;
    },
    { scheduler }
  );
  expect(scheduler).not.toHaveBeenCalled();
  expect(dummy).toBe(1);
  // should be called on first trigger
  // 响应式对象发生改变， 调用 trigger
  obj.foo++;
  //scheduler 被调用过一次
  expect(scheduler).toHaveBeenCalledTimes(1);
  // // should not run yet
  expect(dummy).toBe(1);
  // // manually run
  run();
  // // should have run  expect(dummy).toBe(2);
  expect(dummy).toBe(2)
});

it("stop", () => {
  let dummy;
  const obj = reactive({ prop: 1 });
  const runner = effect(() => {
    //此处会 obj.prop 会触发get方法，并执行track 进行依赖收集
    dummy = obj.prop;
  });
  obj.prop = 2;
  expect(dummy).toBe(2);
  // stop 清空依赖，并将reactiveEffect 实例中active 置为false
  stop(runner);
  // obj.prop = 3;
  obj.prop ++
  // obj.prop = obj.prop +1
  expect(dummy).toBe(2);

  // stopped effect should still be manually callable
  runner();
  expect(dummy).toBe(3);
});

it('test repeat track', () => {
  let allName = '';
  let fristName = reactive({name:'lu'})
  let lastName = reactive({ name:'jinke' })
  
  const runner = effect(()=>{
    //此处会执行 响应式对象 fristName与obj的get方法
    allName = fristName.name + lastName.name
  })

  expect(allName).toBe('lujinke')
  fristName.name = 'liu'
  expect(allName).toBe('liujinke')
  
  let elseName = lastName.name + '_Jake'

  expect(allName).toBe('liujinke')

  
  
  
})

it("onStop", () => {
  const obj = reactive({
    foo: 1,
  });
  const onStop = jest.fn();
  let dummy;
  const runner = effect(
    () => {
      dummy = obj.foo;
    },
    {
      onStop,
    }
  );

  stop(runner);
  expect(onStop).toBeCalledTimes(1);
});
