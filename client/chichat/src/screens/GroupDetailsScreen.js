import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
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
import { connect } from 'react-redux';
import { Button, Icon } from 'react-native-elements';
import { Spinner } from '../components/common';

import GROUP_QUERY from '../graphql/Group.query';
import USER_QUERY from '../graphql/User.query';
import LEAVE_GROUP_MUTATION from '../graphql/LeaveGroup.mutation';
import DELETE_GROUP_MUTATION from '../graphql/DeleteGroup.mutation';

import Color from '../constants/Color';

const resetAction = NavigationActions.reset({
  index: 0,
  actions: [
    NavigationActions.navigate({ routeName: 'Main' }),
  ],
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.backgroundColor,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  user: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: Color.inputBorderColor,
    flexDirection: 'row',
    padding: 10,
  },
  avatar: {
    width: 32,
    height: 32,
  },
  username: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupImageContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 6,
    alignItems: 'center',
  },
  groupName: {
    color: Color.darkTxtColor,
  },
  groupNameBorder: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: Color.inputBorderColor,
    flex: 1,
    paddingVertical: 8,
  },
  groupImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  participants: {
    paddingHorizontal: 17,
    paddingVertical: 6,
    backgroundColor: Color.inputBorderColor,
    color: Color.subTxtColor,
  },
  footer: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 7,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  buttonLeave: {
    backgroundColor: Color.warningColor,
  },
  buttonDelete: {
    backgroundColor: Color.dangerColor,
  },
});

class GroupDetailsScreen extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: `${navigation.state.params.title}`,
      headerStyle: {
        marginTop: (Platform.OS === 'android') ? 24 : 0,
        backgroundColor: Color.tabBackgroundColor,
        paddingRight: 5,
      },
      headerTitleStyle: {
        color: Color.txtDefaultColor,
      },
      headerTintColor: Color.txtDefaultColor,
    };
  };

  constructor(props) {
    super(props);
    this.state = {};

    // init bind function
    this.deleteGroup = this.deleteGroup.bind(this);
    this.leaveGroup = this.leaveGroup.bind(this);
    this.renderItem = this.renderItem.bind(this);
  }

  deleteGroup() {
    this.props.deleteGroup(this.props.navigation.state.params.id)
      .then(() => {
        this.props.navigation.dispatch(resetAction);
      })
      .catch((error) => {
        console.warn('Error delete group: ', error); // eslint-disable-line no-console
      });
  }

  leaveGroup() {
    this.props.leaveGroup({
      id: this.props.navigation.state.params.id,
    })
      .then(() => {
        this.props.navigation.dispatch(resetAction);
      })
      .catch((error) => {
        console.warn('Error delete group: ', error); // eslint-disable-line no-console
      });
  }

  keyExtractor = item => item.id;

  renderHeader = () => {
    const { group } = this.props;

    return (
      <View>
        <View style={styles.detailsContainer}>
          <TouchableOpacity style={styles.groupImageContainer} onPress={this.pickGroupImage}>
            <Image
              style={styles.groupImage}
              source={{ uri: 'https://www.shareicon.net/data/2016/08/01/640324_logo_512x512.png' }}
            />
            <Text>edit</Text>
          </TouchableOpacity>

          <View style={styles.groupNameBorder}>
            <Text style={styles.groupName}>{group.name}</Text>
          </View>
        </View>
        <Text style={styles.participants}>
          {`Participants: ${group.users.length}`.toUpperCase()}
        </Text>
      </View>
    );
  };

  renderFooter = () => (
    <View style={styles.footer}>
      <Button
        title="Leave group"
        onPress={this.leaveGroup}
        buttonStyle={styles.buttonLeave}
        textStyle={{ fontSize: 14 }}
      />
      <Button
        title="Delete group"
        onPress={this.deleteGroup}
        buttonStyle={styles.buttonDelete}
        textStyle={{ fontSize: 14 }}
      />
    </View>
  );

  renderItem = ({ item: user }) => (
    <View style={styles.user}>
      <Image
        style={styles.avatar}
        source={{ uri: 'https://www.shareicon.net/data/2016/08/01/640324_logo_512x512.png' }}
      />
      <Text style={styles.username}>{user.username}</Text>
    </View>
  );

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
        <FlatList
          data={group.users}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          ListHeaderComponent={this.renderHeader}
          ListFooterComponent={this.renderFooter}
        />
      </View>
    );
  }
}

GroupDetailsScreen.propTypes = {
  loading: PropTypes.bool,
  group: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    users: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      username: PropTypes.string,
    })),
  }),
  navigation: PropTypes.shape({
    dispatch: PropTypes.func,
    state: PropTypes.shape({
      params: PropTypes.shape({
        id: PropTypes.number,
        title: PropTypes.string,
      }),
    }),
  }),
  deleteGroup: PropTypes.func.isRequired,
  leaveGroup: PropTypes.func.isRequired,
};

const groupQuery = graphql(GROUP_QUERY, {
  options: ownProps => ({ variables: { groupId: ownProps.navigation.state.params.id } }),
  props: ({ data: { loading, group } }) => ({
    loading, group,
  }),
});

const deleteGroupMutation = graphql(DELETE_GROUP_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    deleteGroup: id =>
      mutate({
        variables: { id },
        update: (store, { data: { deleteGroup } }) => {
          // Read the data from our cache for this query.
          const data = store.readQuery({ query: USER_QUERY, variables: { id: ownProps.auth.id } });

          // Add our message from the mutation to the end.
          data.user.groups = data.user.groups.filter(g => deleteGroup.id !== g.id);

          // Write our data back to the cache.
          store.writeQuery({
            query: USER_QUERY,
            variables: { id: ownProps.auth.id },
            data,
          });
        },
      }),
  }),
});

const leaveGroupMutation = graphql(LEAVE_GROUP_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    leaveGroup: ({ id }) =>
      mutate({
        variables: { id },
        update: (store, { data: { leaveGroup } }) => {
          // Read data from cache for this query
          const data = store.readQuery({ query: USER_QUERY, variables: { id: ownProps.auth.id } });

          // Add our message from the mutation to the end
          data.user.groups = data.user.groups.filter(g => leaveGroup.id !== g.id);

          // Write data
          store.writeQuery({
            query: USER_QUERY,
            variables: { id: ownProps.auth.id },
            data,
          });
        },
      }),
  }),
});
/*
const updateGroupMutation = graphql(UPDATE_GROUP_MUTATION, {
  props: ({ mutate }) => ({
    updateGroup: group =>
      mutate({
        variables: { group },
      }),
  }),
});
*/
const mapStateToProps = ({ auth }) => ({
  auth,
});

export default compose(
  connect(mapStateToProps),
  groupQuery,
  deleteGroupMutation,
  leaveGroupMutation,
)(GroupDetailsScreen);
