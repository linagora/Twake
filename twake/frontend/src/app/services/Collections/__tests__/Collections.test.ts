import Login from 'services/login/login';
import Collections, { Resource } from '../Collections';

Login.userIsSet = true;

type TaskType = {
  id?: string;
  content: string;
  votes: number;
};

class Task extends Resource<TaskType> {
  public some_variable = 12;
}

test('Create a collection', async () => {
  Collections.connect();

  const listId = 10;
  const tasks = Collections.get('/lists/' + listId + '/tasks/', Task);

  expect((await tasks.find({})).length).toBe(0);

  await tasks.insert(new Task({ content: 'message ab2', votes: 0 }));

  /** Emulate what happen when getting object from cache */
  //@ts-ignore
  await tasks.insert(new Resource({ id: 'ab1', content: 'message ab1', votes: 0 }));
  //@ts-ignore
  tasks.removeLocalResource('ab1');
  expect(tasks.findOne('ab1')?.data.content).toBe('message ab1');

  //Test that all objects are of type Task
  expect(
    tasks
      .find()
      .map(i => i.constructor.name)
      .filter(i => i != 'Task').length,
  ).toBe(0);
});

test('Test Resource state values', async () => {
  Collections.connect();

  const listId = 20;
  const tasks = Collections.get('/lists/' + listId + '/tasks/', Task);

  const task = new Task({ content: 'message ab1', votes: 0 });
  await tasks.insert(task);

  //Sent to the server simulation
  task.setPersisted(true);
  task.id = 'ab1';
  await tasks.update(task, { withoutBackend: true });

  expect(tasks.findOne('ab1')?.state.upToDate).toBe(true); //Should be up to date because was persisted from backend http
  expect(tasks.findOne('ab1')?.state.persisted).toBe(true);

  //Websocket received simulation
  task.setShared(true);
  await tasks.update(task, { withoutBackend: true });

  expect(tasks.findOne('ab1')?.state.upToDate).toBe(true); //Should be up to date because was persisted from websocket
  expect(tasks.findOne('ab1')?.state.shared).toBe(true);

  /** Emulate what happen when getting object from cache */
  //@ts-ignore
  tasks.removeLocalResource('ab1');

  expect(tasks.findOne('ab1')?.state.upToDate).toBe(false); //Should be false because was only got from cache
  expect(tasks.findOne('ab1')?.state.persisted).toBe(true); //Should be true because was persisted before (it shouldnt change)
  expect(tasks.findOne('ab1')?.state.shared).toBe(true); //Should be true because was shared before (it shoulnd change)
});
