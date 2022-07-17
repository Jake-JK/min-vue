import { isReadonly, shallowReadonly } from "../reactive";

describe("shallowReadonly", () => {
  test("should not make non-reactive properties reactive", () => {
    const props = shallowReadonly({ n: { foo: 1 } });
    expect(isReadonly(props)).toBe(true);
    expect(isReadonly(props.n)).toBe(false);
  });

  it("should call console.warn when set", () => {
    console.warn = jest.fn();
    const user = shallowReadonly({
      age: 10,
      like:['food']
    });

    user.age = 11;
    expect(console.warn).toHaveBeenCalled();
    user.like[1] = 'drink'
    expect(console.warn).toHaveBeenCalledTimes(1);

  });
});
