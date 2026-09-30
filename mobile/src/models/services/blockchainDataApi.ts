import axios, { AxiosError } from 'axios';

// ---------------------------------------------------------------------------
// Blockchain.info API client — used as the price fallback in blockchainComApi.ts
// when the primary Blockchain.com exchange ticker is unreachable.
// ---------------------------------------------------------------------------

type RetryConfig = AxiosError['config'] & { __retryCount?: number };

// eslint-disable-next-line import/no-named-as-default-member
export const blockchainDataClient = axios.create({
  baseURL: 'https://blockchain.info',
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
  },
});

// Retry up to 2 times on transient failures, then format the error.
blockchainDataClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetryConfig | undefined;
  if (!config) return Promise.reject(error);
  const currentRetry = config.__retryCount ?? 0;
  const isRetryable = !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED';
  if (isRetryable && currentRetry < 2) {
    const nextRetry = currentRetry + 1;
    config.__retryCount = nextRetry;
    await new Promise((r) => setTimeout(r, nextRetry * 1000));
    return blockchainDataClient.request(config);
  }
  if (error.response) {
    const data = error.response.data;
    const msg = typeof data === 'string' ? data : JSON.stringify(data);
    return Promise.reject(new Error(`Blockchain.info API ${error.response.status}: ${msg.slice(0, 150)}`));
  }
  if (error.code === 'ECONNABORTED') return Promise.reject(new Error('Blockchain.info API timeout'));
  return Promise.reject(new Error(`Blockchain.info API unreachable: ${error.message}`));
});
