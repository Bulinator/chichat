import _ from 'lodash';
import React, { Component } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import PropTypes from 'prop-types';
import randomColor from 'randomcolor';
import { graphql, compose } from 'react-apollo';
import Message from '../components/Message';
import Color from '../constants/Color';
import { Spinner } from '../components/common';

import { GROUP_QUERY } from '../graphql/Group.query';

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

class MessagesScreen extends Component {
  static navigationOptions = ({ navigation }) => {
    const { state } = navigation;
    return {
      title: state.params.title,
      headerBackTitleStyle: {
        color: Color.txtDefaultColor,
        paddingLeft: 5,
      },
      headerStyle: {
        backgroundColor: Color.tabBackgroundColor,
      },
      headerTintColor: Color.txtDefaultColor,
    };
  }

  constructor(props) {
    super(props);
    this.state = { usernameColors: {} };
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
        <FlatList
          data={group.messages.slice().reverse()}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
        />
      </View>
    );
  }
}

MessagesScreen.propTypes = {
  group: PropTypes.shape({
    messages: PropTypes.array,
    users: PropTypes.array,
  }),
  loading: PropTypes.bool,
};

const groupQuery = graphql(GROUP_QUERY, {
  options: ownProps => ({
    variables: {
      groupId: ownProps.navigation.state.params.groupId,
    },
  }),
  props: ({ data: { loading, group } }) => ({
    loading, group,
  }),
});


export default compose(groupQuery)(MessagesScreen);
