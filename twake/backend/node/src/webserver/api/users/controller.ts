import User from "../../../core/user/models";

export async function getUsers(): Promise<User[]> {
  return [new User('1'), new User('2')];
}

export async function getUser(id: string): Promise<User> {
  return new User(id);
}

export async function remove(id: string): Promise<void> {
  return null;
}
