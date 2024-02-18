export type Args = unknown[];
export type DefaultNullType = undefined;
export type DefaultMaybe<T> = T | DefaultNullType;
export type DropFirst<A> = A extends [unknown, ...infer R] ? R : never;
export type AsyncFunction<T> = (...args: Args) => Promise<T>;
export type SyncFunction<T> = (...args: Args) => T;
export type SyncOrAsyncFunction<T> = SyncFunction<T> | AsyncFunction<T>;

export type SyncOrPromise<T> = T | Promise<T>;

export type Callback<A extends Args, Result, Nullish> = (
  ...args: A
) => Result | Nullish;
export type CallbackAsync<A extends Args, Result, Nullish> = (
  ...args: A
) => Promise<Result | Nullish>;
export type CallbackSyncOrAsync<A extends Args, Result, Nullish> =
  | Callback<A, Result, Nullish>
  | CallbackAsync<A, Result, Nullish>;

export type Bind = <A extends Args, FirstArgument, Result, Nullish>(
  callback: Callback<A, Result, Nullish>,
  nullishTypes: Nullish[],
  firstArgument: FirstArgument | Nullish,
  ...rest: DropFirst<A>
) => Result | Nullish;

export type BindAsync = <A extends Args, FirstArgument, Result, Nullish>(
  callback: CallbackSyncOrAsync<A, Result, Nullish>,
  nullishTypes: Nullish[],
  firstArgument: SyncOrPromise<FirstArgument | Nullish>,
  ...rest: DropFirst<A>
) => Promise<Result | Nullish>;
