import { API_PREFIX, apiErrorSchema, CLIENT_ID_HEADER } from '@nabd/shared';
import type { z } from 'zod';

import { ApiClientError } from './api-error';

export interface RequestOptions {
  method: 'GET' | 'PUT' | 'DELETE';
  path: string;
  query?: Readonly<Record<string, string>>;
  signal?: AbortSignal;
}

export interface HttpClient {
  request<S extends z.ZodType>(schema: S, options: RequestOptions): Promise<z.output<S>>;
  send(options: RequestOptions): Promise<void>;
}

export interface HttpClientConfig {
  baseUrl: string;
  getClientId: () => string;
  fetch?: typeof fetch;
}

const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
};

const describeIssues = (error: z.ZodError): string =>
  error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');

export function createHttpClient(config: HttpClientConfig): HttpClient {
  const doFetch: typeof fetch = config.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const base = config.baseUrl.replace(/\/+$/, '');

  const buildUrl = ({ path, query }: RequestOptions): string => {
    const search = new URLSearchParams(query).toString();
    return `${base}${API_PREFIX}${path}${search === '' ? '' : `?${search}`}`;
  };

  const execute = async (options: RequestOptions): Promise<Response> => {
    let response: Response;
    try {
      response = await doFetch(buildUrl(options), {
        method: options.method,
        headers: { accept: 'application/json', [CLIENT_ID_HEADER]: config.getClientId() },
        ...(options.signal === undefined ? {} : { signal: options.signal }),
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw new ApiClientError({
        kind: 'network',
        message: 'The server could not be reached',
        cause: error,
      });
    }
    if (response.ok) return response;

    const body = apiErrorSchema.safeParse(parseJson(await response.text().catch(() => '')));
    throw new ApiClientError({
      kind: 'http',
      status: response.status,
      message: body.success
        ? body.data.error.message
        : `Request failed with status ${String(response.status)}`,
      ...(body.success ? { code: body.data.error.code, details: body.data.error.details } : {}),
    });
  };

  return {
    async request(schema, options) {
      const response = await execute(options);
      const payload = parseJson(await response.text());
      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        throw new ApiClientError({
          kind: 'parse',
          message: `The server response did not match the contract: ${describeIssues(parsed.error)}`,
          cause: parsed.error,
        });
      }
      return parsed.data;
    },
    async send(options) {
      await execute(options);
    },
  };
}
