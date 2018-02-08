import _ from 'lodash';
import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableHighlight,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import Color from '../constants/Color';
import { Spinner } from '../components/common';

import { USER_QUERY } from '../graphql/User.query';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.backgroundColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  groupName: {
    fontWeight: 'bold',
    flex: 0.7,
  },
});

// create fake data to populate our FlatList
const fakeData = () => _.times(100, i => ({
  id: i,
  name: `Group ${i}`,
}));


class Group extends Component {
  constructor(props) {
    super(props);
    this.goToMessages = this.props.goToMessages.bind(this, this.props.group);
  }

  render() {
    const { id, name } = this.props.group;
    return (
      <TouchableHighlight key={id} onPress={this.goToMessages}>
        <View style={styles.groupContainer}>
          <Text style={styles.groupName}>{`${name}`}</Text>
        </View>
      </TouchableHighlight>
    );
  }
}

Group.propTypes = {
  goToMessages: PropTypes.func.isRequired,
  group: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }),
};

class GroupsScreen extends Component {
  static navigationOptions = ({ navigation }) => ({
    title: 'ChiChat',
    headerStyle: {
      backgroundColor: Color.tabBackgroundColor,
      marginTop: (Platform.OS === 'ios') ? 0 : 24,
    },
    headerTitleStyle: {
      color: Color.txtDefaultColor,
    },
  });

  constructor(props) {
    super(props);
    this.goToMessages = this.goToMessages.bind(this);
  }

  keyExtractor = item => item.id;

  goToMessages(group) {
    const { navigate } = this.props.navigation;
    // groupId and title will attach to
    // props.navigation.state.params in Messages
    navigate('Messages', { groupId: group.id, title: group.name });
  }

  renderItem = ({ item }) => <Group group={item} goToMessages={this.goToMessages} />;

  render() {
    const { loading, user } = this.props;

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Spinner />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <FlatList
          data={user.groups}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
        />
      </View>
    );
  }
}

GroupsScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
  loading: PropTypes.bool,
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    email: PropTypes.string.isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    })),
  }),
};

const userQuery = graphql(USER_QUERY, {
  options: () => ({ variables: { id: 1 } }), // fake user for now
  props: ({ data: { loading, user } }) => ({
    loading, user,
  }),
});

export default userQuery(GroupsScreen);
