import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  ActivityIndicator,
  Text,
  View,
  Image,
  TouchableOpacity,
  Platform,
  FlatList,
  TextInput,
  StyleSheet,
} from 'react-native';
import { graphql, compose } from 'react-apollo';
import { NavigationActions } from 'react-navigation';
import { Button } from 'react-native-elements';
import { Spinner } from '../components/common';

import GROUP_QUERY from '../graphql/Group.query';
import USER_QUERY from '../graphql/User.query';
import LEAVE_GROUP_MUTATION from '../graphql/LeaveGroup.mutation';
import DELETE_GROUP_MUTATION from '../graphql/DeleteGroup.mutation';

import Color from '../constants/Color';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
});

class GroupDetails extends Component {
  static navigationOptions = ({ navigation }) => {
    const { state } = navigation;
    const isReady = state.params && state.params.mode === 'ready';
    return {
      title: `${navigation.state.params.title}`,
      headerStyle: {
        marginTop: (Platform.OS === 'android') ? 24 : 0,
        backgroundColor: Color.tabBackgroundColor,
        paddingRight: 5,
      },
      headerTitleStyle: {
        alignSelf: 'flex-start',
        color: Color.txtDefaultColor,
      },
    };
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { group, loading } = this.props;
    if (loading || !group) {
      return (
        <View style={styles.loading}>
          <Spinner />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Text>Group details screen (update, leave, remove)</Text>
      </View>
    );
  }
}

GroupDetails.propTypes = {
  loading: PropTypes.bool,
  group: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    users: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      username: PropTypes.string,
    })),
    navigation: PropTypes.shape({
      dispatch: PropTypes.func,
      state: PropTypes.shape({
        params: PropTypes.shape({
          id: PropTypes.number,
          title: PropTypes.string,
        }),
      }),
    }),
  }),
};

const groupQuery = graphql(GROUP_QUERY, {
  options: ownProps => ({ variables: { groupId: ownProps.navigation.state.params.id } }),
  props: ({ data: { loading, group } }) => ({
    loading, group,
  }),
});

export default compose(groupQuery)(GroupDetails);
