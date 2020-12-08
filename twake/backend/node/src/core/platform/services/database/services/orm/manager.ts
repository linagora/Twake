import _ from "lodash";
import { Connector } from "./connectors";
import { getEntityDefinition, unwrapPrimarykey } from "./utils";
import { v4 as uuidv4, v1 as uuidv1 } from "uuid";

/**
 * Entity manager
 */
export default class Manager {
  private toPersist: any[] = [];
  private toRemove: any[] = [];

  constructor(readonly connector: Connector) {}

  public persist(entity: any) {
    if (!entity.constructor.prototype._entity || !entity.constructor.prototype._columns) {
      throw Error("Cannot persist this object: it is not an entity.");
    }

    // --- Generate ids on primary keys elements (if not defined) ---
    const { columnsDefinition, entityDefinition } = getEntityDefinition(entity);
    const primaryKey = unwrapPrimarykey(entityDefinition);
    primaryKey.forEach(pk => {
      if (entity[pk] === undefined) {
        const definition = columnsDefinition[pk];
        //Create default value
        switch (definition.options.generator || definition.type) {
          case "uuid":
            entity[pk] = uuidv4();
            break;
          case "timeuuid":
            entity[pk] = uuidv1();
            break;
          case "number":
            entity[pk] = 0;
            break;
          default:
            entity[pk] = "";
        }
      }
    });

    this.toPersist = this.toPersist.filter(e => e !== entity);
    this.toPersist.push(_.cloneDeep(entity));
  }

  public remove(entity: any) {
    if (!entity.constructor.prototype._entity || !entity.constructor.prototype._columns) {
      throw Error("Cannot remove this object: it is not an entity.");
    }
    this.toRemove = this.toRemove.filter(e => e !== entity);
    this.toRemove.push(_.cloneDeep(entity));
  }

  public flush() {
    //this.connector.upsert(this.toPersist);
    //this.connector.remove(this.toRemove);
  }

  public reset() {
    this.toPersist = [];
    this.toRemove = [];
  }
}
