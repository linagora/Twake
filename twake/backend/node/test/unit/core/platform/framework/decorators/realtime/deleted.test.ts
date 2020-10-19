import {describe, expect, it, jest} from "@jest/globals";
import { DeleteResult } from "../../../../../../../src/core/platform/framework/api/crud-service";
import { RealtimeDeleted } from "../../../../../../../src/core/platform/framework/decorators";
import { eventBus } from "../../../../../../../src/core/platform/framework/realtime";

describe("The RealtimeDeleted decorator", () => {
  it("should call the original method send back original result but do not emit event if result type is wrong", async (done) => {
    const emitSpy = jest.spyOn(eventBus, "emit");

    class TestMe {
      @RealtimeDeleted("/foo/bar")
      reverseMeBaby(input: string): Promise<string> {
        return Promise.resolve(input.split("").reverse().join(""));
      }
    }

    const test = new TestMe();
    const originalSpy = jest.spyOn(test, "reverseMeBaby");
    const result = await test.reverseMeBaby("yolo");

    expect(result).toEqual("oloy");
    expect(originalSpy).toHaveBeenCalledTimes(1);
    expect(originalSpy).toHaveBeenCalledWith("yolo");
    expect(emitSpy).toHaveBeenCalledTimes(0);

    emitSpy.mockRestore();
    done();
  });

  it("should call the original method send back original result and emit event", async (done) => {
    const emitSpy = jest.spyOn(eventBus, "emit");

    class TestMe {
      @RealtimeDeleted("/foo/bar")
      async reverseMeBaby(input: string): Promise<DeleteResult<string>> {
        const result = new DeleteResult<string>();
        result.entity = input.split("").reverse().join("");
        result.deleted = true;

        return result;
      }
    }

    const test = new TestMe();
    const originalSpy = jest.spyOn(test, "reverseMeBaby");
    const result = await test.reverseMeBaby("yolo");

    expect(result.entity).toEqual("oloy");
    expect(originalSpy).toHaveBeenCalledTimes(1);
    expect(originalSpy).toHaveBeenCalledWith("yolo");
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith("entity:deleted", {
      path: "/foo/bar",
      entity: "oloy",
      result: {
        entity: "oloy",
        deleted: true
      } as DeleteResult<string>
    });

    emitSpy.mockRestore();
    done();
  });

  it("should emit event with path computed from function", async (done) => {
    const emitSpy = jest.spyOn(eventBus, "emit");

    class TestMe {
      @RealtimeDeleted((result) => `/foo/bar/${result}`)
      async reverseMeBaby(input: string): Promise<DeleteResult<string>> {
        const result = new DeleteResult<string>();
        result.entity = input.split("").reverse().join("");
        result.deleted = true;

        return result;
      }
    }

    const test = new TestMe();
    const originalSpy = jest.spyOn(test, "reverseMeBaby");
    const result = await test.reverseMeBaby("yolo");

    expect(result.entity).toEqual("oloy");
    expect(originalSpy).toHaveBeenCalledTimes(1);
    expect(originalSpy).toHaveBeenCalledWith("yolo");
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith("entity:deleted", {
      path: "/foo/bar/oloy",
      entity: "oloy",
      result: {
        entity: "oloy",
        deleted: true
      } as DeleteResult<string>
    });

    emitSpy.mockRestore();
    done();
  });
});
