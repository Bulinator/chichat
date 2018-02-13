import {
  createStore,
  combineReducers,
  applyMiddleware,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { addGraphQLSubscriptions } from 'subscriptions-transport-ws';
import { wsClient, navigationReducer } from '../navigation';

const networkInterface = createNetworkInterface({ uri: 'http://192.168.1.8:8081/graphql' });

// extends network interface with websocket
const networkInterfaceWithSubscriptions = addGraphQLSubscriptions(
  networkInterface,
  wsClient,
);

// finally, create appoloClient instance with the modified network interface
export const client = new ApolloClient({
  networkInterface: networkInterfaceWithSubscriptions,
});

const store = createStore(
  combineReducers({
    apollo: client.reducer(),
    nav: navigationReducer,
  }),
  {}, // initial state
  composeWithDevTools(applyMiddleware(client.middleware())),
);

export default store;
