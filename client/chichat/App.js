import React from 'react';
import { ApolloProvider } from 'react-apollo';
import AppWithNavigationState from './src/navigation';
import store, { client } from './src/store';

export default class App extends React.Component {
  render() {
    return (
      <ApolloProvider store={store} client={client}>
        <AppWithNavigationState />
      </ApolloProvider>
    );
  }
}
