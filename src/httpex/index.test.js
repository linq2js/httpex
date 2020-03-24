import httpex from './index';
import axios from 'axios';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

test('should fetch JSON data properly', async () => {
  const result = await httpex(
    'http://www.mocky.io/v2/5185415ba171ea3a00704eed',
  );
  expect(result).toEqual({
    hello: 'world',
  });
}, 10000);

test('should handle timeout option properly', async () => {
  let error;
  try {
    await httpex(
      'http://www.mocky.io/v2/5185415ba171ea3a00704eed?mocky-delay=1000ms',
      {
        timeout: 500,
      },
    );
  } catch (e) {
    error = e;
  }
  expect(error.message).toBe('Request Timeout');
}, 10000);

test('should handle http error properly', async () => {
  let error;
  try {
    await httpex('http://www.mocky.io/v2/5e78646a2d0000700018b4d9');
  } catch (e) {
    error = e;
  }
  expect(error.message).toBe('Not Found');
}, 10000);

test('should cancel request properly', async () => {
  let result = false;
  const promise = httpex('http://www.mocky.io/v2/5e78646a2d0000700018b4d9');
  promise.then(x => {
    console.log(x);
    result = x;
  });
  await delay(100);
  promise.cancel();
  expect(promise.cancelled).toBe(true);
  await delay(3000);
  expect(result).toBe(false);
}, 10000);

test('extend fetch options properly', async () => {
  const get = httpex.extend({method: 'GET'});
  const post = httpex.extend({method: 'POST', inputBody: true});

  const productListUrl = 'http://www.mocky.io/v2/5e786bf72d0000570018b51c';
  const articleListUrl = 'http://www.mocky.io/v2/5e786c262d0000720018b51d';
  const saveArticleUrl = 'http://www.mocky.io/v2/5e795f772d0000a29318bc87';
  const productListApi = get.extend(productListUrl);
  const articleListApi = get.extend(articleListUrl);
  const saveArticleApi = post.extend(saveArticleUrl, {
    headers: {
      'content-type': 'application/json',
    },
    serialize: body => JSON.stringify(body),
  });
  const [productListResult, articleListResult] = await Promise.all([
    productListApi(),
    articleListApi(),
  ]);
  expect(productListResult).toBe('product list');
  expect(articleListResult).toBe('article list');
  const result = await saveArticleApi({id: 100, title: 'New article'});
  expect(result).toBe('done');
}, 10000);

test('use custom fetcher', async () => {
  const customFetcher = httpex.extend({
    fetch: (url, options) => axios({...options, url}),
    deserialize: res => res.data,
  });
  const result = await customFetcher(
    'http://www.mocky.io/v2/5185415ba171ea3a00704eed',
  );
  expect(result).toEqual({
    hello: 'world',
  });
}, 10000);

test('should call onInit chain properly', () => {
  const onInit1 = jest.fn();
  const onInit2 = jest.fn();
  const noop = jest.fn();
  const custom1 = httpex.extend({
    fetch: noop,
    onInit: onInit1,
  });
  const custom2 = custom1.extend({
    onInit: onInit2,
  });

  custom2();

  expect(onInit1).toBeCalled();
  expect(onInit2).toBeCalled();
});

test('should append params to url', () => {
  let finalUrl = undefined;
  httpex('/api', {
    params: {
      a: true,
      b: false,
    },
    fetch(url) {
      finalUrl = url;
    },
  });

  expect(finalUrl).toBe('/api?a=true&b=false');
});

test('should merge params properly', () => {
  let finalUrl = undefined;
  const custom1 = httpex.extend('/api', {
    params: {
      a: true,
      b: false,
    },
    mergeParams: true,
    fetch(url) {
      finalUrl = url;
    },
  });

  const custom2 = custom1.extend({
    params: {
      c: 1,
    },
  });

  custom2();

  expect(finalUrl).toBe('/api?a=true&b=false&c=1');
});

test('should merge headers properly', () => {
  let finalHeaders = undefined;
  const custom1 = httpex.extend({
    headers: {
      a: true,
      b: false,
    },
    mergeHeaders: true,
    fetch(url, {headers}) {
      finalHeaders = headers;
    },
  });

  const custom2 = custom1.extend({
    headers: {
      c: 1,
    },
  });

  custom2();

  expect(finalHeaders).toEqual({
    a: true,
    b: false,
    c: 1,
  });
});
