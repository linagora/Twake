import { faker } from "@faker-js/faker";

export function createSomeFakeChannels(nbOfChannels: number = 1) {
  let channels: {
    icon: string;
    name: string;
    description?: string;
    visibility: "public" | "private";
    is_default: boolean;
  }[] = [];

  for (let i = 0; i < nbOfChannels; i++) {
    channels.push({
      icon: ":smile:",
      name: faker.commerce.department(),
      description: faker.lorem.sentence(),
      visibility: "private",
      is_default: false,
    });
  }

  return channels;
}
