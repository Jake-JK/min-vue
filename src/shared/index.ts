export const extend = Object.assign;

export const EMPTY_OBJ = {};

export const isObject = (val: any) => {
  return val !== null && typeof val === "object";
};

export const hasChanged = (val, newVal) => {
  return !Object.is(val, newVal);
};

export const isOwn = (target, key) =>
  Object.prototype.hasOwnProperty.call(target, key);
