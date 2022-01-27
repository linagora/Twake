import { getDB, CollectionStorage } from '../Storage';

describe('The Collections storage', () => {
  let storage: CollectionStorage;

  beforeEach(() => {
    return new Promise<void>(async resolve => {
      const db = await getDB({ namespace: 'test' });
      storage = new CollectionStorage();
      storage.mongoDb = db;

      resolve();
    });
  });

  test('Collections Storage upsert', async () => {
    const listId = 10;
    expect(storage.find('task', 'lists/' + listId + '/tasks').length).toBe(0);

    storage.upsert('task', 'lists/' + listId + '/tasks', { id: '1', content: 'Hello' });
    expect(storage.find('task', 'lists/' + listId + '/tasks').length).toBe(1);
    expect(storage.findOne('task', 'lists/' + listId + '/tasks').id).toBe('1');
  });

  test('Collections Storage remove', async () => {
    const listId = 11;
    storage.upsert('task', 'lists/' + listId + '/tasks', { id: '1', content: 'Hello' });
    storage.upsert('task', 'lists/' + listId + '/tasks', { id: '2', content: 'Hello2' });
    storage.remove('task', 'lists/' + listId + '/tasks', { id: '1' });

    expect(storage.find('task', 'lists/' + listId + '/tasks').length).toBe(1);
  });

  test('Collections Storage update the id field', async () => {
    const listId = 20;
    const task = storage.upsert('task', 'lists/' + listId + '/tasks', {
      id: '1',
      content: 'Hello',
    });
    task.id = '2';
    storage.upsert('task', 'lists/' + listId + '/tasks', task);

    expect(storage.find('task', 'lists/' + listId + '/tasks', { id: '2' }).length).toBe(1);
    expect(storage.find('task', 'lists/' + listId + '/tasks', { id: '1' }).length).toBe(0);

    //Test if two upsert with same id (no duplicates)
    storage.upsert('task', 'lists/' + listId + '/tasks', {
      id: '1',
      content: 'Hello',
    });
    storage.upsert('task', 'lists/' + listId + '/tasks', {
      id: '1',
      content: 'Hello',
    });
    expect(storage.find('task', 'lists/' + listId + '/tasks', { id: '1' }).length).toBe(1);

    //Test if two upsert with same id (no duplicates)
    storage.upsert('task', 'lists/' + listId + '/tasks', {
      id: '2',
      category: 'sport',
      content: 'Hello',
    });
    storage.upsert('task', 'lists/' + listId + '/tasks', {
      id: '3',
      category: 'work',
      content: 'Hello',
    });
    expect(storage.find('task', 'lists/' + listId + '/tasks').length).toBe(3);

    //All resources must contain an id
    expect(() =>
      storage.upsert('task', 'lists/' + listId + '/tasks', {
        category: 'work',
        content: 'Hello',
      }),
    ).toThrow();
  });

  test('Collections Storage finds', async () => {
    const listIdA = 30;
    const listIdB = 40;
    storage.upsert('task', 'lists/' + listIdA + '/tasks', {
      id: '1',
      category: 'sport',
      time: 10,
    });
    storage.upsert('task', 'lists/' + listIdA + '/tasks', {
      id: '2',
      category: 'work',
      time: 10,
    });
    storage.upsert('task', 'lists/' + listIdA + '/tasks', {
      id: '3',
      category: 'sport',
      time: 10,
    });
    storage.upsert('task', 'lists/' + listIdB + '/tasks', {
      id: '4',
      category: 'sport',
      time: 10,
    });
    storage.upsert('task', 'lists/' + listIdB + '/tasks', {
      id: '5',
      category: 'work',
      time: 10,
    });
    storage.upsert('task', 'lists/' + listIdB + '/tasks', {
      id: '6',
      category: 'other',
      time: 10,
    });

    expect(storage.find('task', 'lists/' + listIdA + '/tasks', { id: '1' }).length).toBe(1);
    expect(storage.find('task', 'lists/' + listIdA + '/tasks', { category: 'sport' }).length).toBe(
      2,
    );
    expect(storage.find('task', 'lists/' + listIdB + '/tasks', { category: 'other' }).length).toBe(
      1,
    );
    expect(storage.find('task', 'lists/' + listIdB + '/tasks').length).toBe(3);
    expect(
      storage.find('task', 'lists/' + listIdB + '/tasks', { category: 'work', id: '5' }).length,
    ).toBe(1);
    expect(
      storage.find('task', 'lists/' + listIdB + '/tasks', { category: 'work', time: 10 }).length,
    ).toBe(1);
    expect(
      storage.find('task', 'lists/' + listIdB + '/tasks', { category: 'work', time: 9 }).length,
    ).toBe(0);
    expect(
      storage.find('task', 'lists/' + listIdB + '/tasks', { category: 'sport', id: '5' }).length,
    ).toBe(0);
  });

  test('Collections Storage findOne', async () => {
    const listId = 50;
    storage.upsert('task', 'lists/' + listId + '/tasks', {
      id: '1',
      category: 'sport',
      time: 10,
    });
    storage.upsert('task', 'lists/' + listId + '/tasks', {
      id: '2',
      category: 'work',
      time: 10,
    });
    storage.upsert('task', 'lists/' + listId + '/tasks', {
      id: '3',
      category: 'other',
      time: 10,
    });

    expect(
      storage.findOne('task', 'lists/' + listId + '/tasks', { category: 'work', id: '2' })
        ?.category,
    ).toBe('work');
    expect(storage.findOne('task', 'lists/' + listId + '/tasks', { id: 9 })?.category).toBe(
      undefined,
    );
    expect(
      storage.findOne('task', 'lists/' + listId + '/tasks', { category: 'work', time: 9 })
        ?.category,
    ).toBe(undefined);

    //We ignore all filters if id is provided
    expect(
      storage.findOne('task', 'lists/' + listId + '/tasks', { category: 'sport', id: '1' })
        ?.category,
    ).toBe('sport');
  });
});
