export const isNullish = <FirstArgument, Nullish>(
  argument: FirstArgument | Nullish,
  nullishTypes: Nullish[],
): argument is Nullish => {
  return nullishTypes.some((nullish) => {
    if (nullish !== null && typeof nullish === "object") {
      return JSON.stringify(nullish) === JSON.stringify(argument);
    }
    return nullish === argument;
  });
};
