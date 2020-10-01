import Message from "../../../core/types/message";

export async function getMessages(): Promise<Message[]> {
  return [new Message("1"), new Message("2")];
}

export async function getMessage(id: string): Promise<Message> {
  return new Message(id);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function remove(id: string): Promise<void> {
  return null;
}
