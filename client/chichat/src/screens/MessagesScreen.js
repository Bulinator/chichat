import _ from 'lodash';
import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Text,
  TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import { graphql, compose } from 'react-apollo';
import { Icon } from 'react-native-elements';
import randomColor from 'randomcolor';

import Message from '../components/Message';
import MessageInput from '../components/MessageInput';
import Color from '../constants/Color';
import { Spinner } from '../components/common';

import GROUP_QUERY from '../graphql/Group.query';
import CREATE_MESSAGE_MUTATION from '../graphql/CreateMessage.mutation';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: Color.msgBackgroundColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrapper: {
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'black',
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleImage: {
    marginRight: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});

const fakeData = () => _.times(100, i => ({
  // every message will have a different color
  color: randomColor(),
  // every 5th message will look like it's from the current user
  isCurrentUser: i % 5 === 0,
  message: {
    id: i,
    createdAt: new Date().toISOString(),
    from: {
      username: `Username ${i}`,
    },
    text: `Message ${i}`,
  },
}));

function isDuplicateMessage(newMessage, existingMessages) {
  return newMessage.id !== null &&
    existingMessages.some(message => newMessage.id === message.id);
}

class MessagesScreen extends Component {
  static navigationOptions = ({ navigation }) => {
    const { state, navigate } = navigation;
    const goToGroupDetails = navigate.bind(this, 'GroupDetails', {
      id: state.params.groupId,
      title: state.params.title,
    });

    return {
      title: state.params.title,
      headerStyle: {
        backgroundColor: Color.tabBackgroundColor,
        marginTop: (Platform.OS === 'ios') ? 0 : 24,
        paddingRight: 8,
      },
      headerBackTitleStyle: {
        color: Color.txtDefaultColor,
      },
      headerTintColor: Color.txtDefaultColor,
      headerRight:
        <Icon
          name="info-circle"
          color="#fff"
          type="font-awesome"
          onPress={goToGroupDetails}
          size={18}
        />,
    };
  }

  constructor(props) {
    super(props);
    this.state = { usernameColors: {} };
    this.send = this.send.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    // check new message
    const usernameColors = {};
    if (nextProps.group) {
      if (nextProps.group.users) {
        // Apply color to each users
        nextProps.group.users.forEach((user) => {
          usernameColors[user.username] = this.state.usernameColors[user.username] || randomColor();
        });
      }
      // update user's state color
      this.setState({ usernameColors });
    }
  }

  send = (text) => {
    this.props.createMessage({
      groupId: this.props.navigation.state.params.groupId,
      userId: 1, // faking the user for now
      text,
    }).then(() => {
      this.flatList.scrollToEnd({ animated: true });
    });
  }

  keyExtractor = item => item.id;

  renderItem = ({ item: message }) => (
    <Message
      color={this.state.usernameColors[message.from.username]}
      isCurrentUser={message.from.id === 1} // fake until implement auth
      message={message}
    />
  );

  render() {
    const { loading, group } = this.props;

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Spinner />
        </View>
      );
    }
    //console.log(this.props.group);
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior="position"
          contentContainerStyle={styles.container}
          keyboardVerticalOffset={74}
          style={styles.container}
        >
          <FlatList
            ref={(ref) => { this.flatList = ref; }}
            data={group.messages.slice().reverse()}
            keyExtractor={this.keyExtractor}
            renderItem={this.renderItem}
          />
          <MessageInput send={this.send} />
        </KeyboardAvoidingView>
      </View>
    );
  }
}

MessagesScreen.propTypes = {
  createMessage: PropTypes.func,
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    state: PropTypes.shape({
      params: PropTypes.shape({
        groupId: PropTypes.number,
      }),
    }),
  }),
  group: PropTypes.shape({
    messages: PropTypes.array,
    users: PropTypes.array,
  }),
  loading: PropTypes.bool,
};

const groupQuery = graphql(GROUP_QUERY, {
  options: ownProps => ({
    variables: {
      groupId: ownProps.navigation.state.params.groupId, // => buggy here ownProps is empty groupId
    },
  }),
  props: ({ data: { loading, group } }) => ({
    loading, group,
  }),
});

const createMessageMutation = graphql(CREATE_MESSAGE_MUTATION, {
  props: ({ mutate }) => ({
    createMessage: ({ text, userId, groupId }) =>
      mutate({
        variables: { text, userId, groupId },
        optimisticResponse: {
          __typename: 'Mutation',
          createMessage: {
            __typename: 'Message',
            id: -1, // don't know id yet, but it doesn't matter
            text, // we know what the text will be
            createdAt: new Date().toISOString(), // the time is now!
            from: {
              __typename: 'User',
              id: 1, // still faking the user
              username: 'Justyn.Kautzer', // still faking the user
            },
            to: {
              __typename: 'Group',
              id: groupId,
            },
          },
        },
        update: (store, { data: { createMessage } }) => {
          // Read data from our cache for this query
          const data = store.readQuery({
            query: GROUP_QUERY,
            variables: {
              groupId,
            },
          });

          if (isDuplicateMessage(createMessage, data.group.messages)) {
            return data;
          }

          // Add our message from the mutation to the end.
          data.group.messages.unshift(createMessage);

          // Write data back to the cache
          store.writeQuery({
            query: GROUP_QUERY,
            variables: {
              groupId,
            },
            data,
          });
        },
      }),
  }),
});

export default compose(
  groupQuery,
  createMessageMutation,
)(MessagesScreen);
