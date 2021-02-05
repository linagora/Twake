import Activities from "./service";

export const getService = (): Activities => new Activities().init();
