import { effect } from "../effect";
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
