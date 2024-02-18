import { isNullish } from "./helpers";
import type {
  BindAsync,
  CallbackSyncOrAsync,
  DefaultMaybe,
  DefaultNullType,
  DropFirst,
  SyncOrPromise,
} from "./types";

export const bindAsync: BindAsync = async (
  callback,
  nullishTypes,
  firstArgument,
  ...rest
) => {
  let unwrappedFirst = firstArgument;
  if (unwrappedFirst instanceof Promise) {
    unwrappedFirst = await unwrappedFirst;
  }
  if (isNullish(unwrappedFirst, nullishTypes)) {
    return unwrappedFirst;
  }
  const args = [unwrappedFirst, ...rest] as Parameters<typeof callback>;
  return callback(...args);
};

export const pipeAsync = <FirstArgument, Nullish>(
  prev: SyncOrPromise<FirstArgument | Nullish>,
  nullishTypes: Nullish[],
) => {
  return <Args extends [Awaited<FirstArgument>, ...unknown[]], Result>(
    callback: CallbackSyncOrAsync<Args, Result, Nullish>,
    ...rest: DropFirst<Args>
  ) => {
    const value = bindAsync(callback, nullishTypes, prev, ...rest);
    return {
      value: Promise.resolve(value),
      pipe: pipeAsync(value, nullishTypes),
    };
  };
};

export const monadAsync = <FirstArgument, Nullish>(
  firstArgument: FirstArgument | Nullish,
  ...nullishTypes: Nullish[]
) => ({
  value: Promise.resolve(firstArgument),
  pipe: pipeAsync(firstArgument, nullishTypes),
});

/** Create async monad with default nullish type (here `undefined`
 * and run the provided callback and arguments immediately. */
export const monadAsyncRun = <
  FirstArgument,
  Args extends [Awaited<FirstArgument>, ...unknown[]],
  Result,
>(
  callback: CallbackSyncOrAsync<Args, Result, DefaultNullType>,
  firstArgument: DefaultMaybe<FirstArgument>,
  ...rest: DropFirst<Args>
) => {
  const nullishTypes: DefaultNullType[] = [undefined];
  return monadAsync(firstArgument, ...nullishTypes).pipe(callback, ...rest);
};

/** Setup the nullish types for an async monad and return a monadic
 * function which will execute the provided callback and arguments. */
export const monadAsyncSetup =
  <Nullish>(...nullishTypes: Nullish[]) =>
  <FirstArgument, Args extends [Awaited<FirstArgument>, ...unknown[]], Result>(
    callback: CallbackSyncOrAsync<Args, Result, Nullish>,
    firstArgument: FirstArgument | Nullish,
    ...rest: DropFirst<Args>
  ) =>
    monadAsync(firstArgument, ...nullishTypes).pipe(callback, ...rest);
