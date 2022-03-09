import _ from "lodash";
import { getEntityDefinition, unwrapPrimarykey, EntityDefinition } from "../api";

export function stringifyPrimaryKey(entity: any): string {
  const { entityDefinition } = getEntityDefinition(entity);
  const pkColumns = unwrapPrimarykey(entityDefinition).sort((a, b) => a.localeCompare(b));
  return JSON.stringify(pkColumns.map(c => entity[c]));
}

export function parsePrimaryKey(
  entityDefinition: EntityDefinition,
  pkStr: string,
): { [key: string]: any } {
  const pkColumns = unwrapPrimarykey(entityDefinition).sort((a, b) => a.localeCompare(b));
  const pkList = JSON.parse(pkStr);
  let pk: { [key: string]: any } = {};
  pkColumns.forEach((c, index) => {
    pk[c] = pkList[index];
  });
  return pk;
}
