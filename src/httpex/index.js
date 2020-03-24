const globalFetch = typeof fetch === 'undefined' ? undefined : fetch;

const defaultDeserialize = (res, {dataType = 'json'}) => {
  if (dataType in res) {
    return res[dataType]();
  }
  throw createError('Invalid data type ' + dataType, res);
};

function createError(message, response, props) {
  return Object.assign(new Error(message), {...props, response});
}

function create(defaultOptions = {}) {
  return Object.assign(
    function() {
      let options;
      if (typeof arguments[0] === 'string') {
        options = {url: arguments[0], ...defaultOptions, ...arguments[1]};
      } else {
        options = defaultOptions.inputBody
          ? {
              ...defaultOptions,
              body: arguments[0],
            }
          : {
              ...defaultOptions,
              ...arguments[0],
            };
      }

      let isCancelled = false;
      let isDone = false;
      const {
        url,
        params,
        template,
        // lazy load node-fetch if no fetcher specified (nodejs environment)
        fetch = globalFetch ? globalFetch : require('node-fetch'),
        timeout,
        serialize,
        deserialize = defaultDeserialize,
        onInit,
        onSuccess,
        onError,
        onComplete,
        onTimeout,
        onCancel,
        ...fetchOptions
      } = defaultOptions.normalize
        ? defaultOptions.normalize(options)
        : options;

      if (serialize && typeof options.body !== 'undefined') {
        options.body = serialize(options.body, options);
      }

      onInit && onInit(fetchOptions);

      const result = Object.assign(
        new Promise((resolve, reject) => {
          let isTimeout, timeoutTimer;

          if (timeout) {
            timeoutTimer = setTimeout(() => {
              if (isCancelled) {
                return;
              }
              isTimeout = true;
              const timeoutError = createError('Request Timeout', undefined, {
                timeout: true,
              });
              onTimeout && onTimeout(timeoutError);
              reject(timeoutError);
            }, timeout);
          }

          let result = fetch(
            appendParams(
              template
                ? typeof template === 'function'
                  ? template(url, options)
                  : String(template).replace(/\{url\}/g, url)
                : url,
              params,
            ),
            fetchOptions,
          );

          if (!result || typeof result.then !== 'function') {
            return result;
          }

          result = result.then(res => {
            if (isTimeout || isCancelled) return;
            if (res.status >= 400) {
              throw createError(res.statusText, res);
            }
            if (deserialize) {
              return deserialize(res, options);
            }
            return res;
          }, reject);

          if (!result || typeof result.then !== 'function') {
            return result;
          }

          result = result
            .then(
              result => {
                if (isCancelled || isTimeout) {
                  return;
                }
                onSuccess && onSuccess(result);
                resolve(result);
              },
              error => {
                if (isCancelled) {
                  return;
                }
                onError && onError(error);
                reject(error);
              },
            )
            .finally(() => {
              clearTimeout(timeoutTimer);
              if (isCancelled || isTimeout) {
                return;
              }
              isDone = true;
              onComplete && onComplete();
            });
        }),
        {
          cancel() {
            if (isCancelled) {
              return;
            }
            isCancelled = true;
            if (!isDone) {
              return;
            }
            onCancel && onCancel();
          },
        },
      );
      Object.defineProperty(result, 'cancelled', {
        get() {
          return isCancelled;
        },
      });
      return result;
    },
    {
      extend() {
        let newOptions;

        if (typeof arguments[0] === 'function') {
          newOptions = arguments[0](defaultOptions);
        } else if (typeof arguments[0] === 'string') {
          newOptions = {url: arguments[0], ...defaultOptions, ...arguments[1]};
        } else {
          newOptions = {
            ...defaultOptions,
            ...arguments[0],
          };
        }

        if (newOptions) {
          if (
            defaultOptions.headers &&
            newOptions.mergeHeaders &&
            newOptions.headers !== defaultOptions.headers
          ) {
            newOptions.headers = Object.assign(
              {},
              defaultOptions.headers,
              newOptions.headers,
            );
          }

          if (
            defaultOptions.params &&
            defaultOptions.mergeParams &&
            newOptions.params !== defaultOptions.params
          ) {
            newOptions.params = Object.assign(
              {},
              defaultOptions.params,
              newOptions.params,
            );
          }

          mergeHandlers(defaultOptions, newOptions, [
            'onInit',
            'onSuccess',
            'onError',
            'onComplete',
          ]);
        }

        return create(newOptions);
      },
    },
  );
}

function appendParams(url, params) {
  if (!params) {
    return url;
  }
  const query = Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');
  if (!query) {
    return url;
  }
  const questionMarkIndex = url.indexOf('?');
  if (questionMarkIndex === -1) {
    return url + '?' + query;
  }
  return url + '&' + query;
}

function mergeHandlers(originalOptions, newOptions, handlerNames) {
  handlerNames.forEach(handlerName => {
    const originalHandler = originalOptions[handlerName];
    const newHandler = newOptions[handlerName];
    if (!originalHandler || originalHandler === newHandler) {
      return;
    }
    newOptions[handlerName] = function() {
      originalHandler(...arguments);
      newHandler(...arguments);
    };
  });
}

export default create();
