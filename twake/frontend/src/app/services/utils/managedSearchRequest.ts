/**
 * 
 * This helper will make sure of two things:
 * - we call request as soon as possible
 * - then we wait options.timeout before calling any new request
 */

let delayedRequests: Map<string, Function> = new Map();
let delayedRequestsHasTimout: Map<string, boolean> = new Map();

export const delayRequest = (
  key: string,
  request: Function,
  options: { timeout: number } = { timeout: 1000 },
) => {
  if (!delayedRequestsHasTimout.has(key)) {
    delayedRequestsHasTimout.set(key, true);
    request();
    setTimeout(() => {
      const request = delayedRequests.get(key);
      delayedRequestsHasTimout.delete(key);
      request && delayRequest(key, request, options);
      delayedRequests.delete(key);
    }, options.timeout);
  } else {
    delayedRequests.set(key, request);
  }
};
