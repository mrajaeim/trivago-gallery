import {
  ApolloClient,
  InMemoryCache,
  registerApolloClient,
} from "@apollo/client-integration-nextjs";
import { trivagoLink } from "@/lib/trivago/persisted-link";

export {
  persistedDataStatus,
  persistedQueryStatus,
  registerPersistedQuery,
} from "@/lib/trivago/persisted-link";

export const { query } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: trivagoLink,
  });
});
