import React, { Component } from 'react';
import { StyleSheet, View, Text, AppState } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  addNavigationHelpers,
  StackNavigator,
  TabNavigator,
  NavigationActions,
} from 'react-navigation';
import { graphql, compose } from 'react-apollo';
import update from 'immutability-helper';
import { map } from 'lodash';
import { Buffer } from 'buffer';
import { REHYDRATE } from 'redux-persist/constants';

import Color from '../src/constants/Color';
import GroupsScreen from '../src/screens/GroupsScreen';
import NewGroupScreen from '../src/screens/NewGroupScreen';
import FinalizeGroupScreen from '../src/screens/FinalizeGroupScreen';
import GroupDetailsScreen from '../src/screens/GroupDetailsScreen';
import MessagesScreen from '../src/screens/MessagesScreen';
import SignInScreen from '../src/screens/SignInScreen';
import SettingsScreen from '../src/screens/SettingsScreen';

import { USER_QUERY } from '../src/graphql/User.query';
import GROUP_ADDED_SUBSCRIPTION from '../src/graphql/GroupAdded.subscription';
import MESSAGE_ADDED_SUBSCRIPTION from '../src/graphql/MessageAdded.subscription';
import UPDATE_USER_MUTATION from '../src/graphql/UpdateUser.mutation';

import { wsClient } from '../App';

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
  Settings: { screen: SettingsScreen },
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
    case REHYDRATE:
      // convert persisted data to Immutable and confirm rehydratation
      if (!action.payload.auth || !action.payload.auth.jwt) {
        const { routes, index } = state;
        if (routes[index].routeName !== 'Signin') {
          nextState = AppNavigator.router.getStateForAction(
            NavigationActions.navigate({ routeName: 'Signin' }),
            state,
          );
        }
      }
      break;
    case 'LOGOUT':
      const { routes, index } = state;
      if (routes[index].routeName !== 'Signin') {
        nextState = AppNavigator.router.getStateForAction(
          NavigationActions.navigate({ routeName: 'Signin' }),
          state,
        );
      }
      break;
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
  state = { appState: AppState.currentState };

  componentWillMount() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  componentWillReceiveProps(nextProps) {
    // when we get the user, start listening for notifications
    if (nextProps.user && !this.props.user) {
      // here notification but not clear for me at this time
      // on how to do it with Expo notifications
    }

    if (!nextProps.user) {
      // unsubscribe from all notifications
      // to do

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
    } else if (!this.reconnected) {
      this.reconnected = wsClient.onReconnected(() => {
        this.props.refetch(); // check for any data lost during disconnect
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

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState) => {
    console.log('App has changed state!', nextAppState, this.props.user);
    // here manage badge notification and update
    // to do;;
    
    this.setState({ appState: nextAppState });
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
  updateUser: PropTypes.func,
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    email: PropTypes.string.isRequired,
    registrationId: PropTypes.string,
    badgeCount: PropTypes.number,
    groups: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    })),
  }),
};

// here is not correct, missing auth
const mapStateToProps = ({ auth, nav }) => ({
  auth,
  nav,
});

const userQuery = graphql(USER_QUERY, {
  skip: ownProps => !ownProps.auth || !ownProps.auth.jwt,
  options: ownProps => ({
    variables: { id: ownProps.auth.id },
  }), // fake the user for now // here buggy
  props: ({ data: { loading, user, subscribeToMore }, ownProps: { nav } }) => ({
    loading,
    user,
    subscribeToMore,
    subscribeToMessages() {
      return subscribeToMore({
        document: MESSAGE_ADDED_SUBSCRIPTION,
        variables: {
          groupIds: map(user.groups, 'id'),
        },
        updateQuery: (previousResult, { subscriptionData }) => {
          const previousGroups = previousResult.user.groups;
          const newMessage = subscriptionData.data.messageAdded;

          const groupIndex = map(previousGroups, 'id').indexOf(newMessage.to.id);
          const { index, routes } = nav;
          let unreadCount = previousGroups[groupIndex].unreadCount;
          if (routes[index].routeName !== 'Messages' || routes[index].params.groupId !== groupIndex) {
            unreadCount += 1;
          }

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
                  unreadCount: { $set: unreadCount },
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

const updateUserMutation = graphql(UPDATE_USER_MUTATION, {
  props: ({ mutate }) => ({
    updateUser: user =>
      mutate({
        variables: { user },
      }),
  }),
});

// Connect AppWithNavitationState to Redux!
export default compose(
  connect(mapStateToProps),
  userQuery,
  updateUserMutation,
)(AppWithNavigationState);
