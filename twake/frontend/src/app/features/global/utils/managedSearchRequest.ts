/**
 *
 * This helper will make sure of two things:
 * - we call request as soon as possible
 * - then we wait options.timeout before calling any new request
 * - we can avoid the initial instant callback with options.doInitialCallback
 */

let delayedRequests: Map<string, Function> = new Map();
let delayedRequestsHasTimout: Map<string, boolean> = new Map();

export const delayRequest = (
  key: string,
  request: Function,
  options: { timeout: number; doInitialCall: boolean } = { timeout: 1000, doInitialCall: true },
) => {
  if (!delayedRequestsHasTimout.has(key)) {
    delayedRequestsHasTimout.set(key, true);
    if (options.doInitialCall) request();
    else delayedRequests.set(key, request);
    setTimeout(() => {
      const request = delayedRequests.get(key);
      delayedRequestsHasTimout.delete(key);
      request && delayRequest(key, request, { ...options, doInitialCall: true });
      delayedRequests.delete(key);
    }, options.timeout);
  } else {
    delayedRequests.set(key, request);
  }
};
