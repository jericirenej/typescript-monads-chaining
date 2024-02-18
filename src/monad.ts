import { isNullish } from "./helpers";
import type {
  Bind,
  Callback,
  DefaultMaybe,
  DefaultNullType,
  DropFirst,
} from "./types";

export const bind: Bind = (callback, nullishTypes, firstArgument, ...rest) => {
  if (isNullish(firstArgument, nullishTypes)) {
    return firstArgument;
  }
  return callback(...([firstArgument, ...rest] as Parameters<typeof callback>));
};

export const pipe =
  <FirstArgument, Nullish>(
    prev: FirstArgument | Nullish,
    nullishTypes: Nullish[],
  ) =>
  <Args extends [FirstArgument, ...unknown[]], Result>(
    callback: Callback<Args, Result, Nullish>,
    ...rest: DropFirst<Args>
  ) => {
    const value = bind(callback, nullishTypes, prev, ...rest);
    return { value, pipe: pipe(value, nullishTypes) };
  };

export const monad = <FirstArgument, Nullish>(
  firstArgument: FirstArgument | Nullish,
  ...nullishTypes: Nullish[]
) => ({ value: firstArgument, pipe: pipe(firstArgument, nullishTypes) });

/** Create monad with default nullish type (here `undefined`
 * and run the provided callback and arguments immediately. */
export const monadRun = <
  FirstArgument,
  Args extends [FirstArgument, ...unknown[]],
  Result,
>(
  callback: Callback<Args, Result, DefaultNullType>,
  firstArgument: DefaultMaybe<FirstArgument>,
  ...rest: DropFirst<Args>
) => {
  const nullishTypes: DefaultNullType[] = [undefined];
  return monad(firstArgument, ...nullishTypes).pipe(callback, ...rest);
};

/** Setup the nullish types for a monad and return a monadic
 * function which will execute the provided callback and arguments. */
export const monadSetup =
  <Nullish>(...nullishTypes: Nullish[]) =>
  <FirstArgument, Args extends [FirstArgument, ...unknown[]], Result>(
    callback: Callback<Args, Result, Nullish>,
    firstArgument: FirstArgument | Nullish,
    ...rest: DropFirst<Args>
  ) =>
    monad(firstArgument, ...nullishTypes).pipe(callback, ...rest);
