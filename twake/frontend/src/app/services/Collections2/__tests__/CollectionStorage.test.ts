import CollectionStorage from '../CollectionStorage';

test('Mongo collection upsert', async () => {
  const listId = 10;
  expect((await CollectionStorage.find('lists/' + listId + '/tasks')).length).toBe(0);

  await CollectionStorage.upsert('lists/' + listId + '/tasks', { id: '1', content: 'Hello' });
  expect((await CollectionStorage.find('lists/' + listId + '/tasks')).length).toBe(1);
  expect((await CollectionStorage.findOne('lists/' + listId + '/tasks')).id).toBe('1');
});

test('Mongo collection remove', async () => {
  const listId = 11;
  await CollectionStorage.upsert('lists/' + listId + '/tasks', { id: '1', content: 'Hello' });
  await CollectionStorage.upsert('lists/' + listId + '/tasks', { id: '2', content: 'Hello2' });
  await CollectionStorage.remove('lists/' + listId + '/tasks', { id: '1' });

  expect((await CollectionStorage.find('lists/' + listId + '/tasks')).length).toBe(1);
});

test('Mongo collection update the id field', async () => {
  const listId = 20;
  const task = await CollectionStorage.upsert('lists/' + listId + '/tasks', {
    id: '1',
    content: 'Hello',
  });
  task.id = '2';
  await CollectionStorage.upsert('lists/' + listId + '/tasks', task);

  expect((await CollectionStorage.find('lists/' + listId + '/tasks', { id: '2' })).length).toBe(1);
  expect((await CollectionStorage.find('lists/' + listId + '/tasks', { id: '1' })).length).toBe(0);

  //Test if two upsert with same id (no duplicates)
  await CollectionStorage.upsert('lists/' + listId + '/tasks', {
    id: '1',
    content: 'Hello',
  });
  await CollectionStorage.upsert('lists/' + listId + '/tasks', {
    id: '1',
    content: 'Hello',
  });
  expect((await CollectionStorage.find('lists/' + listId + '/tasks', { id: '1' })).length).toBe(1);

  //Test if two upsert with same id (no duplicates)
  await CollectionStorage.upsert('lists/' + listId + '/tasks', {
    id: '2',
    category: 'sport',
    content: 'Hello',
  });
  await CollectionStorage.upsert('lists/' + listId + '/tasks', {
    id: '3',
    category: 'work',
    content: 'Hello',
  });
  expect((await CollectionStorage.find('lists/' + listId + '/tasks')).length).toBe(3);

  //All resources must contain an id
  expect(
    CollectionStorage.upsert('lists/' + listId + '/tasks', {
      category: 'work',
      content: 'Hello',
    }),
  ).rejects.not.toBeFalsy();
});

test('Mongo collection finds', async () => {
  const listIdA = 30;
  const listIdB = 40;
  await CollectionStorage.upsert('lists/' + listIdA + '/tasks', {
    id: '1',
    category: 'sport',
  });
  await CollectionStorage.upsert('lists/' + listIdA + '/tasks', {
    id: '2',
    category: 'work',
  });
  await CollectionStorage.upsert('lists/' + listIdA + '/tasks', {
    id: '3',
    category: 'sport',
  });
  await CollectionStorage.upsert('lists/' + listIdB + '/tasks', {
    id: '1',
    category: 'sport',
  });
  await CollectionStorage.upsert('lists/' + listIdB + '/tasks', {
    id: '2',
    category: 'work',
  });
  await CollectionStorage.upsert('lists/' + listIdB + '/tasks', {
    id: '3',
    category: 'other',
  });

  expect((await CollectionStorage.find('lists/' + listIdA + '/tasks', { id: '1' })).length).toBe(1);
  expect(
    (await CollectionStorage.find('lists/' + listIdA + '/tasks', { category: 'sport' })).length,
  ).toBe(2);
  expect(
    (await CollectionStorage.find('lists/' + listIdB + '/tasks', { category: 'other' })).length,
  ).toBe(1);
  expect((await CollectionStorage.find('lists/' + listIdB + '/tasks')).length).toBe(3);
  expect(
    (await CollectionStorage.find('lists/' + listIdB + '/tasks', { category: 'work', id: '2' }))
      .length,
  ).toBe(1);
  expect(
    (await CollectionStorage.find('lists/' + listIdB + '/tasks', { category: 'work', id: '1' }))
      .length,
  ).toBe(0);
});

test('Mongo collection findOne', async () => {
  const listId = 50;
  await CollectionStorage.upsert('lists/' + listId + '/tasks', {
    id: '1',
    category: 'sport',
  });
  await CollectionStorage.upsert('lists/' + listId + '/tasks', {
    id: '2',
    category: 'work',
  });
  await CollectionStorage.upsert('lists/' + listId + '/tasks', {
    id: '3',
    category: 'other',
  });

  expect(
    (await CollectionStorage.findOne('lists/' + listId + '/tasks', { category: 'work', id: '2' }))
      ?.category,
  ).toBe('work');
  expect(
    await CollectionStorage.findOne('lists/' + listId + '/tasks', { category: 'work', id: '1' }),
  ).toBe(undefined);
});
