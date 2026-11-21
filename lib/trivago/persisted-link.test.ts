import { ApolloClient, ApolloLink, InMemoryCache, gql } from "@apollo/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTrivagoLink, registerPersistedQuery } from "@/lib/trivago/persisted-link";

const document = gql`
  query accommodationImages {
    __typename
  }
`;

registerPersistedQuery(document, "test-hash");

function clientFor(link: ApolloLink) {
  return new ApolloClient({ cache: new InMemoryCache(), link });
}

function response(text: () => Promise<string>): Response {
  return {
    ok: true,
    status: 200,
    text,
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("trivago link", () => {
  it("errors when the body rejects after the headers arrive", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response(async () => Promise.reject(new Error("body failed")))),
    );

    await expect(
      clientFor(createTrivagoLink()).query({
        query: document,
        fetchPolicy: "no-cache",
      }),
    ).rejects.toThrow(/body failed/);
  });

  it("errors when the request passes its deadline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(init.signal?.reason ?? new Error("aborted"));
            });
          }),
      ),
    );

    await expect(
      clientFor(createTrivagoLink(20)).query({
        query: document,
        fetchPolicy: "no-cache",
      }),
    ).rejects.toThrow();
  });

  it("cancels the request on unsubscribe without reporting an error", async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            signal = init?.signal ?? undefined;
            init?.signal?.addEventListener("abort", () => {
              reject(init.signal?.reason ?? new Error("aborted"));
            });
          }),
      ),
    );

    const client = clientFor(createTrivagoLink(5_000));
    const errors: unknown[] = [];
    const subscription = ApolloLink.execute(
      createTrivagoLink(5_000),
      { query: document },
      { client },
    ).subscribe({
      error(error) {
        errors.push(error);
      },
    });

    await vi.waitFor(() => {
      expect(signal?.aborted).not.toBe(true);
      expect(signal).toBeInstanceOf(AbortSignal);
    });
    subscription.unsubscribe();

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(signal?.aborted).toBe(true);
    expect(errors).toEqual([]);
  });
});
