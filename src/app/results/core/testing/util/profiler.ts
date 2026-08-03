interface ProfileItem {
  name: string;
  duration: number;
  children: ProfileItem[];
}

const stack = [] as ProfileItem[];

let currentProfileItem: ProfileItem;

export const profileFn = <T extends any[], U>(
  name: string,
  fn: (...args: T) => U
): ((...args: T) => U) => {
  return (...args: T): U => {
    const parentProfileItem = currentProfileItem;
    const profileItem = {
      name,
      duration: 0,
      children: []
    };

    currentProfileItem = profileItem;
    const startTime = Date.now();
    const result = fn(...args);
    const endTime = Date.now();
    currentProfileItem = parentProfileItem;

    profileItem.duration = endTime - startTime;
    (parentProfileItem ? parentProfileItem.children : stack).push(profileItem);

    if (!currentProfileItem) {
      console.log(stack[stack.length - 1]);
    }
    return result;
  };
};

export const getResults = () => {
  return stack;
};

export const clearResults = () => {
  stack.length = 0;
};
