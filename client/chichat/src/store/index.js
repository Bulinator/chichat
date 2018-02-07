import {
  createStore,
  combineReducers,
  applyMiddleware,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { navigationReducer } from '../navigation';

const networkInterface = createNetworkInterface({ uri: 'http://192.168.1.8:8080/graphql' });

export const client = new ApolloClient({ networkInterface });

const store = createStore(
  combineReducers({
    apollo: client.reducer(),
    nav: navigationReducer,
  }),
  {},
  composeWithDevTools(applyMiddleware(client.middleware())),
);

export default store;
