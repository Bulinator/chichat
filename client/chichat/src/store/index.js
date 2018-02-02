import {
  createStore,
  combineReducers,
  applyMiddleware,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import ApolloClient, { createNetworkInterface } from 'apollo-client';

const networkInterface = createNetworkInterface({ uri: 'http://192.168.1.8:8080/graphql' });

export const client = new ApolloClient({ networkInterface });

const store = createStore(
  combineReducers({
    apollo: client.reducer(),
  }),
  {}, // initial state
  composeWithDevTools(applyMiddleware(client.middleware())),
);

export default store;
