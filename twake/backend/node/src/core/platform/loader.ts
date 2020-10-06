export default async (name: string): Promise<unknown> => {
  const clazz =  await import(name);

  return clazz.default;
};

