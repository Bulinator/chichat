import React, { Component } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  addNavigationHelpers,
  StackNavigator,
  TabNavigator,
} from 'react-navigation';
import { graphql, compose } from 'react-apollo';
import update from 'immutability-helper';
import { map } from 'lodash';
import { Buffer } from 'buffer';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import Color from '../src/constants/Color';
import GroupsScreen from '../src/screens/GroupsScreen';
import NewGroupScreen from '../src/screens/NewGroupScreen';
import FinalizeGroupScreen from '../src/screens/FinalizeGroupScreen';
import GroupDetailsScreen from '../src/screens/GroupDetailsScreen';
import MessagesScreen from '../src/screens/MessagesScreen';
import SignInScreen from '../src/screens/SignInScreen';

import { USER_QUERY } from '../src/graphql/User.query';
import GROUP_ADDED_SUBSCRIPTION from '../src/graphql/GroupAdded.subscription';
import MESSAGE_ADDED_SUBSCRIPTION from '../src/graphql/MessageAdded.subscription';

export const wsClient = new SubscriptionClient(`ws://localhost:8081/subscriptions`, {
  reconnect: true,
  connectionParams: {
    // Pass any arguments you want for initialization
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});

const TestScreen = title => () => (
  <View style={styles.container}>
    <Text>
      {title}
    </Text>
  </View>
);

// main scene with tab
const MainScreenNavigator = TabNavigator({
  Chichat: { screen: GroupsScreen },
  Settings: { screen: TestScreen('settings') },
}, {
  tabBarOptions: {
    style: {
      backgroundColor: Color.tabBackgroundColor,
    },
    labelStyle: { fontSize: 11, color: Color.txtDefaultColor },
    showIcon: false,
    showLabel: true,
    activeTintColor: Color.activeTintColor,
    inactiveTintColor: Color.txtDefaultColor,
    iconStyle: { width: 24 },
  },
  animated: false,
  tabBarPosition: 'bottom',
  lazyLoad: true,
  lazy: true,
  swipeEnabled: true,
});

// Navigation stack for our entire application
const AppNavigator = StackNavigator({
  Main: { screen: MainScreenNavigator },
  Signin: { screen: SignInScreen },
  Messages: { screen: MessagesScreen },
  NewGroup: { screen: NewGroupScreen },
  FinalizeGroup: { screen: FinalizeGroupScreen },
  GroupDetails: { screen: GroupDetailsScreen },
}, {
  mode: 'modal',
});

// reducer initialization code
const firstAction = AppNavigator.router.getActionForPathAndParams('Main');
const tempNavState = AppNavigator.router.getStateForAction(firstAction);
const initialNavState = AppNavigator.router.getStateForAction(tempNavState);

// reducer code
export const navigationReducer = (state = initialNavState, action) => {
  let nextState;
  switch (action.type) {
    default:
      nextState = AppNavigator.router.getStateForAction(action, state);
      break;
  }
  // Return original `state` if `nextState` is null or undefined.
  return nextState || state;
};

// Navigation component that integrates with redux
/*
const AppWithNavigationState = ({ dispatch, nav }) => (
  <AppNavigator navigation={addNavigationHelpers({ dispatch, state: nav })} />
);
*/

class AppWithNavigationState extends Component {
  componentWillReceiveProps(nextProps) {
    if (!nextProps.user) {
      if (this.groupSubscription) {
        this.groupSubscription();
      }
      if (this.messagesSubscription) {
        this.messagesSubscription();
      }
      // clear the event subscription
      if (this.reconnected) {
        this.reconnected();
      }
    }

    if (!this.reconnected) {
      this.reconnected = wsClient.onReconnected(() => {
        this.props.refetch(); // check for any data lost during disconnection
      }, this);
    }

    if (nextProps.user &&
      (!this.props.user || nextProps.user.groups.length !== this.props.user.groups.length)) {
      // unsubscribe from old
      if (typeof this.messagesSubscription === 'function') {
        this.messagesSubscription();
      }
      // subscribe to new
      if (nextProps.user.groups.length) {
        this.messagesSubscription = nextProps.subscribeToMessages();
      }
    }

    if (!this.groupSubscription && nextProps.user) {
      this.groupSubscription = nextProps.subscribeToGroups();
    }
  }

  render() {
    const { dispatch, nav } = this.props;
    return <AppNavigator navigation={addNavigationHelpers({ dispatch, state: nav })} />;
  }
}


AppWithNavigationState.propTypes = {
  dispatch: PropTypes.func.isRequired,
  nav: PropTypes.object.isRequired,
  refetch: PropTypes.func,
  subscribeToGroups: PropTypes.func,
  subscribeToMessages: PropTypes.func,
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    email: PropTypes.string.isRequired,
    groups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ),
  }),
};

const mapStateToProps = state => ({
  nav: state.nav,
});

const userQuery = graphql(USER_QUERY, {
  skip: ownProps => true, // fake it -- we'll use ownProps with auth
  options: () => ({ variables: { id: 1 } }), // fake the user for now
  props: ({ data: { loading, user, subscribeToMore } }) => ({
    loading,
    user,
    subscribeToMore,
    subscribeToMessages() {
      return subscribeToMore({
        document: MESSAGE_ADDED_SUBSCRIPTION,
        variables: {
          userId: 1, // fake the user for now
          groupIds: map(user.groups, 'id'),
        },
        updateQuery: (previousResult, { subscriptionData }) => {
          const previousGroups = previousResult.user.groups;
          const newMessage = subscriptionData.data.messageAdded;
          const groupIndex = map(previousGroups, 'id').indexOf(newMessage.to.id);
          return update(previousResult, {
            user: {
              groups: {
                [groupIndex]: {
                  messages: {
                    edges: {
                      $set: [{
                        __typename: 'MessageEdge',
                        node: newMessage,
                        cursor: Buffer.from(newMessage.id.toString()).toString('base64'),
                      }],
                    },
                  },
                },
              },
            },
          });
        },
      });
    },
    subscribeToGroups() {
      return subscribeToMore({
        document: GROUP_ADDED_SUBSCRIPTION,
        variables: { userId: user.id },
        updateQuery: (previousResult, { subscriptionData }) => {
          const newGroup = subscriptionData.data.groupAdded;
          return update(previousResult, {
            user: {
              groups: { $push: [newGroup] },
            },
          });
        },
      });
    },
  }),
});

// Connect AppWithNavitationState to Redux!
export default compose(
  connect(mapStateToProps),
  userQuery,
)(AppWithNavigationState);
