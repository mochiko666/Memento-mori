type PartialRest<T, R extends keyof T> = Required<Pick<T, R>> & Partial<Omit<T, R>>;

type RequireOne<T> = { [K in keyof T]: Required<Pick<T, K>> & Partial<Omit<T, K>> }[keyof T];
type RequireOneWith<T, R extends keyof T> = Required<Pick<T, R>> & RequireOne<Omit<T, R>>;

type Projection<T> = (arg: T) => T