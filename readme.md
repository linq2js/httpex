# httpex

A light-weight fetching module

## Simple http request

```jsx harmony
import httpex from 'httpex';

httpex('http://www.mocky.io/v2/5185415ba171ea3a00704eed').then(console.log); // { hello: 'world' }
```

## Set request timeout

```jsx harmony
import httpex from 'httpex';

httpex('http://www.mocky.io/v2/5185415ba171ea3a00704eed?mocky-delay=1000ms', {
  timeout: 500,
}).catch(error => console.log(error.message)); // Request timeout
```

## Cancellable request

```jsx harmony
import httpex from 'httpex';

const promise = httpex(
  'http://www.mocky.io/v2/5185415ba171ea3a00704eed?mocky-delay=1000ms',
);
console.log(promise.cancelled); // false;
promise.cancel();
console.log(promise.cancelled); // true;
```

## Extend request options

```jsx harmony
import httpex from 'httpex';

async function loadData() {
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
  console.log(productListResult, articleListResult); // product list, article list
  const result = await saveArticleApi({id: 100, title: 'New article'});
  console.log(result);
}

loadData();
```

## Custom fetcher

```jsx harmony
import httpex from 'httpex';
import axios from 'axios';

const customFetcher = httpex.extend({
  fetch: (url, options) => axios({...options, url}),
  deserialize: res => res.data,
});
customFetcher('http://www.mocky.io/v2/5185415ba171ea3a00704eed').then(
  console.log,
); // { hello: 'world' }
```
