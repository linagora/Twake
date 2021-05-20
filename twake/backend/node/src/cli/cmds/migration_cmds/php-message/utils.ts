export const convertUuidV4ToV1 = (str: string): string => {
  const uuid = [...str];
  uuid[14] = "1";
  return uuid.join("");
};

export const convertUuidV1ToV4 = (str: string): string => {
  const uuid = [...str];
  uuid[14] = "4";
  return uuid.join("");
};
