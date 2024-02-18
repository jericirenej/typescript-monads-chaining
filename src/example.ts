export type Item = { name: string; description: string };
export type User = { preference: string | undefined };

export const bikePreference = {
  description: "A bike made to go superfast",
  name: "Road bike",
};
export const runningPreference = {
  description: "Lightweight shoes for long miles",
  name: "Running shoes",
};

export const db = {
  userMap: new Map([
    ["firstUser", { preference: "cycling" }],
    ["secondUser", { preference: "running" }],
    ["thirdUser", { preference: "missingPreference" }],
    ["fourthUser", { preference: undefined }],
  ]),
  preferenceItemMap: new Map([
    ["cycling", 123n],
    ["running", 456n],
  ]),
  itemInfoMap: new Map([
    [123n, bikePreference],
    [456n, runningPreference],
  ]),
};

export const getUser = (userId: string): User | undefined =>
  db.userMap.get(userId);

export const getUserPreference = (user: User): string | undefined =>
  user.preference;

export const getPreferredItemId = (preference: string): bigint | undefined =>
  db.preferenceItemMap.get(preference);

export const getItemDetails = (itemId: bigint): Item | undefined =>
  db.itemInfoMap.get(itemId);

export const getUserAsync = async (
  userId: string,
): Promise<User | undefined> => {
  await Promise.resolve();
  return getUser(userId);
};
export const getUserPreferenceAsync = async (
  user: User,
): Promise<string | undefined> => {
  await Promise.resolve();
  return getUserPreference(user);
};

export const getPreferredItemIdAsync = async (
  preference: string,
): Promise<bigint | undefined> => {
  await Promise.resolve();
  return getPreferredItemId(preference);
};

export const getItemDetailsAsync = async (
  itemId: bigint,
): Promise<Item | undefined> => {
  await Promise.resolve();
  return getItemDetails(itemId);
};
