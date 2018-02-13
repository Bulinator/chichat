import _ from 'lodash';
import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableHighlight,
  Platform,
  Image,
} from 'react-native';
import PropTypes from 'prop-types';
import { graphql, compose } from 'react-apollo';
import { Icon } from 'react-native-elements';
import moment from 'moment';
import Color from '../constants/Color';
import { Spinner } from '../components/common';

import { USER_QUERY } from '../graphql/User.query';

const formatCreatedAt = createdAt => moment(createdAt).calendar(null, {
  sameDay: '[Today]',
  nextDay: '[Tomorrow]',
  nextWeek: 'dddd',
  lastDay: '[Yesterday]',
  lastWeek: 'dddd',
  sameElse: 'DD/MM/YYYY',
});

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
    backgroundColor: Color.bgBackgroundColor,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  groupName: {
    fontWeight: 'bold',
    flex: 0.7,
  },
  groupTextContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingLeft: 6,
  },
  groupText: {
    color: Color.subTxtColor,
  },
  groupImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  groupTitleContainer: {
    flexDirection: 'row',
  },
  groupLastUpdated: {
    flex: 0.3,
    color: 'red',
    fontSize: 11,
    textAlign: 'right',
  },
  groupUsername: {
    paddingVertical: 4,
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
    const { id, name, messages } = this.props.group;

    return (
      <TouchableHighlight key={id} onPress={this.goToMessages}>
        <View style={styles.groupContainer}>
          <Image
            style={styles.groupImage}
            source={{ uri: 'https://www.shareicon.net/data/2016/08/01/640324_logo_512x512.png' }}
          />
          <View style={styles.groupTextContainer}>

            <View style={styles.groupTitleContainer}>
              <Text style={styles.groupName}>{`${name}`}</Text>
              <Text style={styles.groupLastUpdated}>
                {messages.edges.length ?
                  formatCreatedAt(messages.edges[0].node.createdAt) : ''
                }
              </Text>
            </View>

            <Text style={styles.groupUsername}>
              {messages.edges.length ?
                `${messages.edges[0].node.from.username}:` : ''
              }
            </Text>

            <Text style={styles.groupText} numberOfLines={1}>
              {messages.edges.length ?
                messages.edges[0].node.text : ''
              }
            </Text>
          </View>
          <Icon
            name="angle-double-right"
            type="font-awesome"
            size={12}
            color={Color.subTxtColor}
          />
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
    messages: PropTypes.shape({
      edges: PropTypes.arrayOf(PropTypes.shape({
        cursor: PropTypes.string,
        node: PropTypes.object,
      })),
    }),
  }),
};

class GroupsScreen extends Component {
  static navigationOptions = ({ navigation }) => ({
    title: 'ChiChat',
    headerStyle: {
      backgroundColor: Color.tabBackgroundColor,
      marginTop: (Platform.OS === 'ios') ? 0 : 24,
      paddingRight: 8,
    },
    headerTitleStyle: {
      color: Color.txtDefaultColor,
    },
    headerRight:
      <Icon
        name="plus-square-o"
        color="#fff"
        type="font-awesome"
        onPress={() => navigation.navigate('NewGroup')}
      />,
  });

  constructor(props) {
    super(props);
    this.goToMessages = this.goToMessages.bind(this);
    this.onRefresh = this.onRefresh.bind(this);
  }

  keyExtractor = item => item.id;

  goToMessages = (group) => {
    const { navigate } = this.props.navigation;
    // groupId and title will attach to
    // props.navigation.state.params in Messages
    navigate('Messages', { groupId: group.id, title: group.name });
  }

  onRefresh() {
    this.props.refetch();
  }

  renderItem = ({ item }) => <Group group={item} goToMessages={this.goToMessages} />;

  render() {
    const { loading, user, networkStatus } = this.props;

    if (loading || !user) {
      return (
        <View style={styles.loadingContainer}>
          <Spinner />
        </View>
      );
    }

    if (user && !user.groups.length) {
      return (
        <View style={styles.container}>
          <Text>You do not have any groups.</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <FlatList
          data={user.groups}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          onRefresh={this.onRefresh}
          refreshing={networkStatus === 4}
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
  networkStatus: PropTypes.number,
  refetch: PropTypes.func,
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
  props: ({ data: { loading, networkStatus, refetch, user } }) => ({
    loading, networkStatus, refetch, user,
  }),
});

const componentWithData = compose(userQuery)(GroupsScreen);

export default componentWithData;
