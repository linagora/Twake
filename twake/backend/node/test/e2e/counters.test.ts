// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "./setup";
import { DatabaseServiceAPI } from "../../src/core/platform/services/database/api";
import Repository from "../../src/core/platform/services/database/services/orm/repository/repository";
import { v1 as uuidv1 } from "uuid";
import { merge } from "lodash";
import { Column, Entity } from "../../src/core/platform/services/database/services/orm/decorators";

const TEST_COUNTER_TYPE = "test_counter";

@Entity(TEST_COUNTER_TYPE, {
  primaryKey: [["id"], "counter_type"],
  type: TEST_COUNTER_TYPE,
})
class TestCounterEntity {
  @Column("id", "timeuuid")
  id: string;

  @Column("counter_type", "string")
  counter_type: string;

  @Column("value", "counter")
  value: number;
}

export type TestCounterPrimaryKey = {
  id: string;
  counter_type: string;
};

describe("Counters implementation", () => {
  let platform: TestPlatform;
  let database: DatabaseServiceAPI;
  let testCounterRepository: Repository<TestCounterEntity>;

  const testCounterPrimaryKey: TestCounterPrimaryKey = {
    id: uuidv1(),
    counter_type: "members",
  };

  beforeAll(async ends => {
    platform = await init();

    database = platform.platform.getProvider<DatabaseServiceAPI>("database");
    expect(database).toBeTruthy();
    await platform.database.getConnector().drop();

    testCounterRepository = await database.getRepository<TestCounterEntity>(
      TEST_COUNTER_TYPE,
      TestCounterEntity,
    );

    ends();
  });

  afterAll(done => {
    platform.tearDown().then(done);
  });

  it("Initializing empty value", async done => {
    await testCounterRepository.save(
      merge(new TestCounterEntity(), { value: 0 }, testCounterPrimaryKey),
    );
    const counter = await testCounterRepository.findOne(testCounterPrimaryKey);
    expect(counter).toMatchObject(merge({ value: 0 }, testCounterPrimaryKey));
    done();
  });

  it("Adding value", async done => {
    let counter = await testCounterRepository.findOne(testCounterPrimaryKey);

    // adding 1

    counter.value = 1;
    await testCounterRepository.save(counter);
    counter = await testCounterRepository.findOne(testCounterPrimaryKey);
    expect(counter).toMatchObject(merge({ value: 1 }, testCounterPrimaryKey));

    // adding 2

    counter.value = 2;
    await testCounterRepository.save(counter);
    counter = await testCounterRepository.findOne(testCounterPrimaryKey);
    expect(counter).toMatchObject(merge({ value: 3 }, testCounterPrimaryKey));

    done();
  });

  it("Subtracting value", async done => {
    let counter = await testCounterRepository.findOne(testCounterPrimaryKey);

    // Subtracting 2

    counter.value = -2;
    await testCounterRepository.save(counter);
    counter = await testCounterRepository.findOne(testCounterPrimaryKey);
    expect(counter).toMatchObject(merge({ value: 1 }, testCounterPrimaryKey));

    // Subtracting 10

    counter.value = -10;
    await testCounterRepository.save(counter);
    counter = await testCounterRepository.findOne(testCounterPrimaryKey);
    expect(counter).toMatchObject(merge({ value: -9 }, testCounterPrimaryKey));

    done();
  });
});
