import { BaseStatFieldMap } from "../enums/mihomo.js";
import type { BaseStatField, BaseStatObject } from "../types/mihomo.js";

/**
 * @param field {@link BaseStatObject.field}
 * @returns Boolean indicating whether the field is a base stat or not.
 */
export const isBaseStat = (field: string): field is BaseStatField =>
  BaseStatFieldMap.hasOwnProperty(field);
