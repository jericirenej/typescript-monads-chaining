import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Item } from "./example";
import * as example from "./example";
import { isNullish } from "./helpers";
import { bind, monad, monadRun, monadSetup, pipe } from "./monad";
import {
  bindAsync,
  monadAsync,
  monadAsyncRun,
  monadAsyncSetup,
  pipeAsync,
} from "./monadAsync";

describe("Monad functions tests", () => {
  const mockReturn = "mockReturn",
    nonNullish = "nonNullish",
    nullTypes = [null],
    mockRest = [0, undefined] as const;
  const cbSingle = vi.fn<[string], string | null>(),
    cbSingleAsync = vi.fn<[string], Promise<string | null>>(),
    cbMultiple = vi.fn<[string, number, string | undefined], string | null>(),
    cbMultipleAsync = vi.fn<
      [string, number, string | undefined],
      Promise<string | null>
    >();
  [cbSingle, cbMultiple].forEach((mock) => mock.mockReturnValue(mockReturn));
  [cbSingleAsync, cbMultipleAsync].forEach((mock) =>
    mock.mockResolvedValue(mockReturn),
  );
  const clearMocks = (mocks: Mock[]): void => {
    mocks.forEach((mock) => mock.mockClear());
  };
  afterEach(() => {
    clearMocks([cbSingle, cbSingleAsync, cbMultiple, cbMultipleAsync]);
  });
  describe("Auxiliary functions", () => {
    afterEach(() => {
      clearMocks([cbSingle, cbSingleAsync, cbMultiple, cbMultipleAsync]);
    });

    it("isNullish should return true if argument matches one of the nullishTypes", () => {
      const objNull = { type: "null" },
        nullishArr = [1, 2, 3];
      const testCases: [unknown, unknown[], boolean][] = [
        [null, [undefined], false],
        [null, [null, undefined], true],
        [undefined, [null, undefined], true],
        ["something", [null, undefined], false],
        [objNull, [objNull], true],
        [{ ...objNull, other: "other" }, [objNull], false],
        [[], [[]], true],
        [[null], [[]], false],
        [nullishArr, [nullishArr], true],
        [nullishArr.slice(0, 2), [nullishArr], false],
        ["string", [null], false],
        [5, [null], false],
        [-1, [-1], true],
      ];
      for (const [arg, nullishTypes, expected] of testCases) {
        expect(isNullish(arg, nullishTypes)).toBe(expected);
      }
    });
    it("Bind and bindAsync should return early for nullish first argument or call callback otherwise", async () => {
      for (const sync of [true, false]) {
        const mocks = sync
          ? [cbMultiple, cbSingle]
          : [cbMultipleAsync, cbSingleAsync];
        for (const firstArg of [null, nonNullish]) {
          let singleReturn: string | null, multipleReturn: string | null;
          clearMocks(mocks);
          if (sync) {
            singleReturn = bind(cbSingle, nullTypes, firstArg);
            multipleReturn = bind(cbMultiple, nullTypes, firstArg, ...mockRest);
          } else {
            singleReturn = await bindAsync(
              cbSingleAsync,
              nullTypes,
              Promise.resolve(firstArg),
            );
            multipleReturn = await bindAsync(
              cbMultipleAsync,
              nullTypes,
              Promise.resolve(firstArg),
              ...mockRest,
            );
          }

          mocks.forEach((mock) => {
            firstArg
              ? expect(mock).toHaveBeenCalledOnce()
              : expect(mock).not.toHaveBeenCalled();
          });
          [singleReturn, multipleReturn].forEach((returnVal) => {
            firstArg
              ? expect(returnVal).toBe(mockReturn)
              : expect(returnVal).toBe(firstArg);
          });
        }
      }
    });
    it("asyncBind should take sync or async callbacks", async () => {
      await expect(bindAsync(cbSingle, nullTypes, "something")).resolves.toBe(
        mockReturn,
      );
      await expect(
        bindAsync(cbSingleAsync, nullTypes, "something"),
      ).resolves.toBe(mockReturn);
    });
    it("asyncBind should take sync or async first argument", async () => {
      for (const arg of ["something", Promise.resolve("something")]) {
        await expect(bindAsync(cbSingleAsync, nullTypes, arg)).resolves.toBe(
          mockReturn,
        );
      }
    });
    it("Pipe and pipeAsync should provide appropriate returns", async () => {
      const outerPipeSync = pipe(nonNullish, nullTypes),
        outerPipeAsync = pipeAsync(nonNullish, nullTypes);
      const outerPipes = [outerPipeSync, outerPipeSync] as const;

      outerPipes.forEach((pipe) => {
        expect(typeof pipe).toBe("function");
      });

      let innerPipeSync = outerPipeSync(cbSingle),
        innerPipeAsync = outerPipeAsync(cbSingleAsync),
        counter = 0;
      const innerPipes = [innerPipeSync, innerPipeAsync] as const;
      const limit = 10;

      while (counter < limit) {
        if (counter !== 0) {
          innerPipeSync = innerPipeSync.pipe(cbSingle);
          innerPipeAsync = innerPipeAsync.pipe(cbSingleAsync);
        }
        expect(innerPipeSync.value).toBe(mockReturn);
        await expect(innerPipeAsync.value).resolves.toBe(mockReturn);
        innerPipes.forEach((pipe) => {
          expect(typeof pipe.pipe).toBe("function");
        });
        counter++;
      }
    });
    it("Pipe and pipeAsync should handle rest arguments", () => {
      const syncPipe = pipe(nonNullish, nullTypes),
        asyncPipe = pipeAsync(nonNullish, nullTypes);
      syncPipe(cbMultiple, ...mockRest);
      expect(cbMultiple).toHaveBeenCalledWith(nonNullish, ...mockRest);

      asyncPipe(cbMultipleAsync, ...mockRest);
      expect(cbMultipleAsync).toHaveBeenCalledWith(nonNullish, ...mockRest);
    });
  });

  describe("Sync and async monads", () => {
    afterEach(() => {
      afterEach(() => {
        clearMocks([cbSingle, cbSingleAsync, cbMultiple, cbMultipleAsync]);
      });
    });
    it("Should return expected result with example db and callbacks", async () => {
      const runAsyncMonad = (userId: string) =>
        monadAsync(userId, undefined)
          .pipe(example.getUserAsync)
          .pipe(example.getUserPreferenceAsync)
          .pipe(example.getPreferredItemIdAsync)
          .pipe(example.getItemDetailsAsync);

      const runSyncMonad = (userId: string) =>
        monad(userId, undefined)
          .pipe(example.getUser)
          .pipe(example.getUserPreference)
          .pipe(example.getPreferredItemId)
          .pipe(example.getItemDetails);
      const testCases: [string, Item | undefined][] = [
        ["firstUser", example.bikePreference],
        ["secondUser", example.runningPreference],
        ["thirdUser", undefined],
        ["fourthUser", undefined],
        ["missingUser", undefined],
      ];
      for (const [userId, expected] of testCases) {
        const syncSuggestion = runSyncMonad(userId),
          asyncSuggestion = runAsyncMonad(userId);
        expect(await asyncSuggestion.value).toEqual(expected);
        expect(syncSuggestion.value).toEqual(expected);
      }
    });
    it("Should not call functions after a nullish value has been received", async () => {
      cbSingle.mockReturnValueOnce(null);
      cbSingleAsync.mockResolvedValueOnce(null);
      const syncMonad = monad(nonNullish, ...nullTypes),
        asyncMonad = monadAsync(nonNullish, ...nullTypes);
      syncMonad.pipe(cbSingle).pipe(cbSingle).pipe(cbSingle).value;

      expect(cbSingle).toHaveBeenCalledTimes(1);

      await asyncMonad
        .pipe(cbSingleAsync)
        .pipe(cbSingleAsync)
        .pipe(cbSingleAsync).value;

      expect(cbSingleAsync).toHaveBeenCalledTimes(1);
    });
    it("monadRun and monadAsyncRun should execute callback", async () => {
      const monadResult = monadRun(cbMultiple, nonNullish, ...mockRest);
      expect(monadResult.value).toBe(mockReturn);
      expect(cbMultiple).toHaveBeenCalledOnce();
      expect(cbMultiple).toHaveBeenCalledWith(nonNullish, ...mockRest);
      const monadAsyncResult = monadAsyncRun(
        cbMultipleAsync,
        nonNullish,
        ...mockRest,
      );
      await expect(monadAsyncResult.value).resolves.toBe(mockReturn);
      expect(cbMultiple).toHaveBeenCalledOnce();
      expect(cbMultiple).toHaveBeenCalledWith(nonNullish, ...mockRest);
    });
    it("monadSetup and monadAsyncSetup should prepare nullish type context", async () => {
      const falseOnNullish = <T>(arg: T, ...nullish: unknown[]) =>
        !nullish.includes(arg);

      const falseOnMinusOneOrNull = <T>(arg: T) =>
        falseOnNullish(arg, -1, null);
      const falseOnUndefined = <T>(arg: T) => falseOnNullish(arg, undefined);

      const nullTypes = [-1, null];
      const monadContext = monadSetup(...nullTypes);
      const asyncMonadContext = monadAsyncSetup(...nullTypes);
      expect(monadContext(falseOnMinusOneOrNull, -1).value).toBe(-1);
      expect(monadContext(falseOnMinusOneOrNull, null).value).toBe(null);
      expect(monadContext(falseOnMinusOneOrNull, undefined).value).toBe(true);
      expect(monadContext(falseOnUndefined, undefined).value).toBe(false);

      await expect(
        asyncMonadContext(falseOnMinusOneOrNull, -1).value,
      ).resolves.toBe(-1);
      await expect(
        asyncMonadContext(falseOnMinusOneOrNull, null).value,
      ).resolves.toBe(null);
      await expect(
        asyncMonadContext(falseOnMinusOneOrNull, undefined).value,
      ).resolves.toBe(true);
      await expect(
        asyncMonadContext(falseOnUndefined, undefined).value,
      ).resolves.toBe(false);
    });
  });
});
