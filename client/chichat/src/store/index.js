import {
  createStore,
  combineReducers,
  applyMiddleware,
} from 'redux';
import { AsyncStorage } from 'react-native';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { addGraphQLSubscriptions, SubscriptionClient } from 'subscriptions-transport-ws';
import { persistStore, autoRehydrate } from 'redux-persist';
import thunk from 'redux-thunk';
import { navigationReducer } from '../navigation';
import auth from '../reducers/auth.reducer';

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
    auth,
  }),
  {}, // initial state
  composeWithDevTools(
    applyMiddleware(client.middleware(), thunk),
    autoRehydrate(),
  ),
);

// persistent storage
persistStore(store, {
  storage: AsyncStorage,
  blacklist: ['apollo', 'nav'], // don't persist apollo or nav for now
});


export const wsClient = new SubscriptionClient(`ws://localhost:8081/subscriptions`, {
  reconnect: true,
  connectionParams() {
    // Pass any arguments you want for initialization
    return { jwt: store.getState().auth.jwt };
  },
  lazy: true,
});

export default store;
