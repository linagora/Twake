export default class User {
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}

export type UserPrimaryKey = Partial<User>;
