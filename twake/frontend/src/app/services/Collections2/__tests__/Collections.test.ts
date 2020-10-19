import Collections, { Resource } from '../Collections';

type TaskType = {
  id?: string;
  content: string;
  votes: number;
};

class Task extends Resource<TaskType> {
  public some_variable = 12;
}

test('Create a collection', async () => {
  const listId = 1;
  const tasks = Collections.get('/lists/' + listId + '/tasks/', Task);

  expect((await tasks.find({})).length).toBe(0);

  await tasks.insert(new Task({ content: 'message ab2', votes: 0 }));

  /** Emulate what happen when getting object from cache */
  //@ts-ignore
  await tasks.insert(new Resource({ id: 'ab1', content: 'message ab1', votes: 0 }));
  //@ts-ignore
  tasks.removeLocalResource('ab1');
  expect((await tasks.findOne('ab1'))?.data.content).toBe('message ab1');

  //Test that all objects are of type Task
  expect((await tasks.find()).map(i => i.constructor.name).filter(i => i != 'Task').length).toBe(0);
});
