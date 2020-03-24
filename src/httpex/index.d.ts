declare const httpex: HttpEx;

export default httpex;

interface HttpEx {
  (): CancellablePromise;
  (url: string, options?: HttpExOptions): CancellablePromise;
  (options: HttpExOptions): CancellablePromise;

  extend(options: HttpExOptionsWithInputBody): HttpExWithInputBody;
  extend(options: HttpExOptions): HttpEx;
  extend(
    url: string,
    options?: HttpExOptionsWithInputBody,
  ): HttpExWithInputBody;
  extend(url: string, options?: HttpExOptions): HttpEx;
}

interface HttpExWithInputBody {
  (): CancellablePromise;
  (body: any): CancellablePromise;
  extend(
    url: string,
    options?: HttpExOptionsWithInputBody,
  ): HttpExWithInputBody;
  extend(options: HttpExOptionsWithInputBody): HttpExWithInputBody;
}

interface HttpExOptions {
  url?: string;
  params?: {
    [key: string]: any;
  };
  dataType?: string | Function;
  fetch?: Fetcher;
  onInit?: OnInitHandler;
  timeout?: number;
  template: UrlTemplate;
  onCancel?: OnCancelHandler;
  onTimeout?: OnTimeoutHandler;
  onSuccess?: OnSuccessHandler;
  onComplete?: OnCompleteHandler;
  onError?: OnErrorHandler;
  mergeParams?: boolean;
  mergeHeaders?: boolean;
  normalize?: Normalizer;
  serialize?: Serializer;
  deserialize?: Deserializer;
  [key: string]: any;
}

interface HttpExOptionsWithInputBody extends HttpExOptions {
  inputBody: true;
}

interface HttpExError extends Error {
  timeout: boolean;
  cancelled: boolean;
}

interface CancellablePromise extends Promise<any> {
  cancel();
  cancelled: boolean;
}

type Fetcher = (url: string, options?: any) => any;
type OnInitHandler = (options?: any) => any;
type OnErrorHandler = (error?: HttpExError) => any;
type OnCompleteHandler = () => any;
type OnCancelHandler = () => any;
type OnTimeoutHandler = () => any;
type OnSuccessHandler = (result?: any) => any;
type Normalizer = (options: HttpExOptions) => HttpExOptions;
type Serializer = (data: any, options?: HttpExOptions) => any;
type Deserializer = (response: any, options?: HttpExOptions) => any;
type UrlTemplate = (url: string, options?: HttpExOptions) => string;
