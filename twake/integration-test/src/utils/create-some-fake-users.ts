import { faker } from "@faker-js/faker";

export function createSomeFakeUsers(nbOfUsers: number = 1) {
  let users: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }[] = [];

  for (let i = 0; i < nbOfUsers; i++) {
    users.push({
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      email: faker.internet.email().toLocaleLowerCase(),
      password: faker.internet.password(),
    });
  }

  return users;
}
