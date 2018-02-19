import _ from 'lodash';
import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import PropTypes from 'prop-types';
import { graphql, compose } from 'react-apollo';
import update from 'immutability-helper';
import { Buffer } from 'buffer';
import { connect } from 'react-redux';
import gql from 'graphql-tag';
import { Icon } from 'react-native-elements';
import randomColor from 'randomcolor';
import moment from 'moment';

import Message from '../components/Message';
import MessageInput from '../components/MessageInput';
import Color from '../constants/Color';
import { Spinner } from '../components/common';

import GROUP_QUERY from '../graphql/Group.query';
import USER_QUERY from '../graphql/User.query';
import CREATE_MESSAGE_MUTATION from '../graphql/CreateMessage.mutation';
import MESSAGE_ADDED_SUBSCRIPTION from '../graphql/MessageAdded.subscription';
import UPDATE_GROUP_MUTATION from '../graphql/UpdateGroup.mutation';

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

// function isDuplicateMessage(newMessage, existingMessages) {
//  return newMessage.id !== null &&
//    existingMessages.some(message => newMessage.id === message.id);
// }

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
    this.state = {
      usernameColors: {},
    };

    this.send = this.send.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    // check new message
    const usernameColors = {};
    if (nextProps.group) {
      if (nextProps.group.messages && nextProps.group.messages.length && nextProps.group.messages[0].id >= 0 &&
        (!nextProps.group.lastRead || nextProps.group.lastRead.id !== nextProps.group.messages[0].id)) {
        const { group } = nextProps;
        nextProps.updateGroup({ id: group.id, name: group.name, lastRead: group.messages[0].id });
      }

      if (nextProps.group.users) {
        // Apply color to each users
        nextProps.group.users.forEach((user) => {
          usernameColors[user.username] = this.state.usernameColors[user.username] || randomColor();
        });
      }

      // we don't resubscribe on changed props
      // because it never happens in our app
      // If I remove that the duplicate bug is not triggered
      if (!this.subscription) {
        this.subscription = nextProps.subscribeToMore({
          document: MESSAGE_ADDED_SUBSCRIPTION,
          variables: {
            userId: 1, // fake the user for now
            groupIds: [nextProps.navigation.state.params.groupId],
          },
          updateQuery: (previousResult, { subscriptionData }) => {
            const newMessage = subscriptionData.data.messageAdded;

            return update(previousResult, {
              group: {
                messages: {
                  edges: {
                    $unshift: [{
                      __typename: 'MessageEdge',
                      node: newMessage,
                      cursor: Buffer.from(newMessage.id.toString()).toString('base64'),
                    }],
                  },
                },
              },
            });
          },
        });
      }


      // update user's state color
      this.setState({ usernameColors });
    }
  }

  onEndReached() {
    if (!this.state.loadingMoreEntries &&
      this.props.group.messages.pageInfo.hasNextPage) {
      this.setState({
        loadingMoreEntries: true,
      });
      this.props.loadMoreEntries().then(() => {
        this.setState({
          loadingMoreEntries: false,
        });
      });
    }
  }

  send(text) {
    this.props.createMessage({
      groupId: this.props.navigation.state.params.groupId,
      text,
    }).then(() => {
      this.flatList.scrollToIndex({ index: 0, animated: true });
    });
  }

  keyExtractor = item => item.node.id;

  renderItem = ({ item: edge }) => {
    const message = edge.node;

    return (
      <Message
        color={this.state.usernameColors[message.from.username]}
        isCurrentUser={message.from.id === this.props.auth.id}
        message={message}
      />
    );
  };

  render() {
    const { loading, group } = this.props;

    if (loading || !group) {
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
            inverted
            ref={(ref) => { this.flatList = ref; }}
            data={group.messages.edges}
            keyExtractor={this.keyExtractor}
            renderItem={this.renderItem}
            ListEmptyComponent={<View />}
            onEndReached={this.onEndReached}
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
  auth: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
  }),
  group: PropTypes.shape({
    messages: PropTypes.shape({
      edges: PropTypes.arrayOf(PropTypes.shape({
        cursor: PropTypes.string,
        node: PropTypes.object,
      })),
      pageInfo: PropTypes.shape({
        hasNextPage: PropTypes.bool,
        hasPreviousPage: PropTypes.bool,
      }),
    }),
    lastRead: PropTypes.shape({
      id: PropTypes.number,
    }),
    users: PropTypes.array,
  }),
  loading: PropTypes.bool,
  loadMoreEntries: PropTypes.func,
  subscribeToMore: PropTypes.func,
  updateGroup: PropTypes.func,
};

const ITEMS_PER_PAGE = 10;
const groupQuery = graphql(GROUP_QUERY, {
  options: ownProps => ({
    variables: {
      groupId: ownProps.navigation.state.params.groupId, // => buggy here ownProps is empty groupId
      messageConnection: {
        first: ITEMS_PER_PAGE,
      },
    },
  }),
  props: ({ data: { fetchMore, loading, group, subscribeToMore } }) => ({
    loading,
    group,
    subscribeToMore,
    loadMoreEntries() {
      return fetchMore({
        // query: ... (you can specify a different query.
        // GROUP_QUERY is used by default)
        variables: {
          messageConnection: {
            // load more queries starting from the cursor of the last (oldest) message
            after: group.messages.edges[group.messages.edges.length - 1].cursor,
            first: ITEMS_PER_PAGE,
          },
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          // we will make an extra call to check if no more entries
          if (!fetchMoreResult) { return previousResult; }
          // push results (older messages) to end of messages list
          return update(previousResult, {
            group: {
              messages: {
                edges: { $push: fetchMoreResult.group.messages.edges },
                pageInfo: { $set: fetchMoreResult.group.messages.pageInfo },
              },
            },
          });
        },
      });
    },
  }),
});

// In update, we first retrieve the existing data for the query we want to update (GROUP_QUERY)
// along with the specific variables we passed to that query.
// This data comes to us from our Redux store of Apollo data.
// We check to see if the new Message returned from createMessage already exists
// (in case of race conditions down the line),
// and then update the previous query result by sticking the new message in front.
// We then use this modified data object and rewrite the results
// to the Apollo store with store.writeQuery, being sure to pass all the variables
// associated with our query. This will force props to change reference and
// the component to rerender.

// update will currently only update the query after the mutation succeeds
// and a response is sent back on the server. But we don’t want to wait till
// the server returns data...we crave instant gratification!
// If a user with shoddy internet tried to send a message and it didn’t show up right away,
// they’d probably try and send the message again and again and end up
// sending the message multiple times… and then they’d yell at customer support!
// Optimistic UI is our weapon for protecting customer support.
// We know the shape of the data we expect to receive from the server,
// so why not fake it until we get a response? react-apollo lets us accomplish this
// by adding an optimisticResponse parameter to mutate
const createMessageMutation = graphql(CREATE_MESSAGE_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    createMessage: message =>
      mutate({
        variables: { message },
        optimisticResponse: {
          __typename: 'Mutation',
          createMessage: {
            __typename: 'Message',
            id: -1, // don't know id yet, but it doesn't matter
            text: message.text, // we know what the text will be
            createdAt: new Date().toISOString(), // the time is now!
            from: {
              __typename: 'User',
              id: ownProps.auth.id,
              username: ownProps.auth.username,
            },
            to: {
              __typename: 'Group',
              id: message.groupId,
            },
          },
        },
        update: (store, { data: { createMessage } }) => {
          // Read data from our cache for this query
          const data = store.readQuery({
            query: GROUP_QUERY,
            variables: {
              groupId: message.groupId,
              messageConnection: { first: ITEMS_PER_PAGE },
            },
          });

          // if (isDuplicateMessage(createMessage, data.group.messages)) {
          //  return data;
          // }

          // Add our message from the mutation to the end.
          // before pagination:: data.group.messages.unshift(createMessage);
          data.group.messages.edges.unshift({
            __typename: 'MessageEdge',
            node: createMessage,
            cursor: Buffer.from(createMessage.id.toString()).toString('base64'),
          });

          // Write data back to the cache
          store.writeQuery({
            query: GROUP_QUERY,
            variables: {
              groupId: message.groupId,
              messageConnection: { first: ITEMS_PER_PAGE },
            },
            data,
          });

          const userData = store.readQuery({
            query: USER_QUERY,
            variables: {
              id: ownProps.auth.id,
            },
          });

          const updatedGroup = _.find(userData.user.groups, { id: message.groupId });
          if (!updatedGroup.messages.edges.length ||
          moment(updatedGroup.messages.edges[0].node.createdAt)
            .isBefore(moment(message.createdAt))) {
            // update the latest message
            updatedGroup.messages.edges[0] = {
              __typename: 'MessageEdge',
              node: createMessage,
              cursor: Buffer.from(createMessage.id.toString()).toString('base64'),
            };

            // Write query to our cache
            store.writeQuery({
              query: USER_QUERY,
              variables: {
                id: ownProps.auth.id,
              },
              data: userData,
            });
          }
        },
      }),
  }),
});

const updateGroupMutation = graphql(UPDATE_GROUP_MUTATION, {
  props: ({ mutate }) => ({
    updateGroup: group =>
      mutate({
        variables: { group },
        update: (store, { data: { updateGroup } }) => {
          // Read the data from our cache for this query.
          store.writeFragment({
            id: `Group:${updateGroup.id}`,
            fragment: gql`
              fragment group on Group {
                unreadCount
              }
            `,
            data: {
              __typename: 'Group',
              unreadCount: 0,
            },
          });
        },
      }),
  }),
});

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default compose(
  connect(mapStateToProps),
  groupQuery,
  createMessageMutation,
  updateGroupMutation,
)(MessagesScreen);
