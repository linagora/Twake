export function compareTimeuuid(a?: string, b?: string) {
  return timeuuidToDate(a || "") - timeuuidToDate(b || "");
}

export function timeuuidToDate(time_str: string) {
  if (!time_str) {
    return 0;
  }
  var uuid_arr = time_str.split("-"),
    // eslint-disable-next-line no-redeclare
    time_str = [uuid_arr[2].substring(1), uuid_arr[1], uuid_arr[0]].join("");
  return parseInt(time_str, 16);
}
