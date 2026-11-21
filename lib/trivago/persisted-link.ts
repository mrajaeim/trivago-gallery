import { ApolloLink, Observable, type DocumentNode } from "@apollo/client";
import { ServerError, ServerParseError } from "@apollo/client/errors";
import {
  getOperationAST,
  type FormattedExecutionResult,
  type GraphQLFormattedError,
} from "graphql";

const GRAPHQL_ENDPOINT = "https://www.trivago.com/graphql";
const REQUEST_DEADLINE_MS = 12_000;

const hashesByDocument = new WeakMap<DocumentNode, string>();
const hashesByName = new Map<string, string>();
const statusByErrors = new WeakMap<readonly unknown[], number>();
const statusByData = new WeakMap<object, number>();

export function registerPersistedQuery(
  document: DocumentNode,
  sha256Hash: string,
): void {
  hashesByDocument.set(document, sha256Hash);
  const name = getOperationAST(document)?.name?.value;
  if (name) {
    hashesByName.set(name, sha256Hash);
  }
}

export function persistedQueryStatus(
  errors: readonly unknown[],
): number | null {
  return statusByErrors.get(errors) ?? null;
}

export function persistedDataStatus(data: object): number | null {
  return statusByData.get(data) ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGraphqlResult(
  value: unknown,
): value is { data?: unknown; errors?: unknown; extensions?: unknown } {
  return isRecord(value) && ("data" in value || "errors" in value);
}

function readFormattedErrors(
  value: unknown,
): readonly GraphQLFormattedError[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.map((error) => {
    if (!isRecord(error) || typeof error.message !== "string" || !error.message) {
      return { message: "Error message not found." };
    }

    const path = Array.isArray(error.path)
      ? error.path.filter(
          (segment): segment is string | number =>
            typeof segment === "string" || typeof segment === "number",
        )
      : [];
    return path.length > 0
      ? { message: error.message, path }
      : { message: error.message };
  });
}

function persistedHash(operation: ApolloLink.Operation): string | undefined {
  return (
    hashesByDocument.get(operation.query) ??
    (operation.operationName
      ? hashesByName.get(operation.operationName)
      : undefined)
  );
}

function requestError(error: unknown): Error {
  return error instanceof Error ? error : new Error("The GraphQL request failed.");
}

function decodeBody(
  response: Response,
  bodyText: string,
  operationName: string,
): FormattedExecutionResult {
  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch (error) {
    throw new ServerParseError(error, { response, bodyText });
  }

  if (!isGraphqlResult(payload)) {
    throw new ServerError(
      response.ok
        ? `Server response was malformed for query '${operationName}'.`
        : `Response not successful: Received status code ${response.status}`,
      { response, bodyText },
    );
  }

  const result: FormattedExecutionResult = {};
  if ("data" in payload) {
    result.data = payload.data as FormattedExecutionResult["data"];
  }
  if ("errors" in payload) {
    const errors = readFormattedErrors(payload.errors);
    if (!errors) {
      throw new ServerError(
        `Server response was malformed for query '${operationName}'.`,
        { response, bodyText },
      );
    }
    result.errors = errors;
    statusByErrors.set(errors, response.status);
  }
  if (isRecord(payload.extensions)) {
    result.extensions = payload.extensions;
  }
  if (isRecord(result.data)) {
    statusByData.set(result.data, response.status);
  }

  return result;
}

export function createTrivagoLink(
  deadlineMs = REQUEST_DEADLINE_MS,
): ApolloLink {
  return new ApolloLink((operation) => {
    return new Observable((observer) => {
      const operationName = operation.operationName;
      const sha256Hash = persistedHash(operation);
      if (!sha256Hash || !operationName) {
        observer.error(
          new Error(
            `No persisted query is registered for ${operationName ?? "this operation"}.`,
          ),
        );
        return;
      }

      const cancel = new AbortController();
      const signal = AbortSignal.any([
        cancel.signal,
        AbortSignal.timeout(deadlineMs),
      ]);
      let active = true;

      fetch(`${GRAPHQL_ENDPOINT}?${encodeURIComponent(operationName)}`, {
        method: "POST",
        cache: "no-store",
        credentials: "omit",
        signal,
        headers: {
          accept: "application/graphql-response+json, application/json",
          "content-type": "application/json",
          "accept-language": "en-US,en;q=0.9",
          "apollographql-client-name": "hs-web-app",
          "apollographql-client-version": "02521e02",
          "x-trv-app-id": "HS_WEB_APP_WARP",
          "x-trv-currency": "USD",
          "x-trv-language": "en-US",
          "x-trv-platform": "us",
        },
        body: JSON.stringify({
          operationName,
          variables: operation.variables,
          extensions: {
            persistedQuery: {
              version: 1,
              sha256Hash,
            },
          },
        }),
      })
        .then(async (response) => {
          const bodyText = await response.text();
          if (!active) {
            return null;
          }
          return decodeBody(response, bodyText, operationName);
        })
        .then(
          (result) => {
            if (!active || result === null) {
              return;
            }
            observer.next(result);
            observer.complete();
          },
          (error: unknown) => {
            if (!active) {
              return;
            }
            observer.error(requestError(error));
          },
        );

      return () => {
        active = false;
        cancel.abort();
      };
    });
  });
}

export const trivagoLink = createTrivagoLink();
