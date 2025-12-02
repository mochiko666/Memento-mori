export type falsy = 0 | "" | false | null | undefined;

/**
 * @returns okokok, i'm sooooooo lazy but made this freakin' sh*t, so editer, THIS IS JUST T!!!!!!!!!!!!!
 * @example ["A", 0, false, null, undefined, "k", 0, "47"].filter(notFalsy<T>): string[]
 */
export const notFalsy = <T>(v: T | falsy): v is T => Boolean(v);

export const notNullish = <T>(v: T | null | undefined): v is T =>
  (v ?? null) !== null;
