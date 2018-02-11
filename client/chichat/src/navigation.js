import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  addNavigationHelpers,
  StackNavigator,
  TabNavigator,
} from 'react-navigation';

import Color from '../src/constants/Color';
import GroupsScreen from '../src/screens/GroupsScreen';
import NewGroupScreen from '../src/screens/NewGroupScreen';
import FinalizeGroupScreen from '../src/screens/FinalizeGroupScreen';
import MessagesScreen from '../src/screens/MessagesScreen';

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
  tabBarPosition: 'bottom',
  lazyLoad: true,
  lazy: true,
  swipeEnabled: true,
});

// Navigation stack for our entire application
const AppNavigator = StackNavigator({
  Main: { screen: MainScreenNavigator },
  Messages: { screen: MessagesScreen },
  NewGroup: { screen: NewGroupScreen },
  FinalizeGroup: { screen: FinalizeGroupScreen },
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
const AppWithNavigationState = ({ dispatch, nav }) => (
  <AppNavigator navigation={addNavigationHelpers({ dispatch, state: nav })} />
);
AppWithNavigationState.propTypes = {
  dispatch: PropTypes.func.isRequired,
  nav: PropTypes.object.isRequired,
};
const mapStateToProps = state => ({
  nav: state.nav,
});

// Connect AppWithNavitationState to Redux!
export default connect(mapStateToProps)(AppWithNavigationState);
