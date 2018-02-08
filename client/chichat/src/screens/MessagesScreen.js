import _ from 'lodash';
import React, { Component } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import PropTypes from 'prop-types';
import randomColor from 'randomcolor';
import Message from '../components/Message';
import Color from '../constants/Color';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: Color.msgBackgroundColor,
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
      },
      headerStyle: {
        backgroundColor: Color.tabBackgroundColor,
      },
      headerTintColor: Color.txtDefaultColor,
    };
  }

  keyExtractor = item => item.message.id;

  renderItem = ({ item: { isCurrentUser, message, color } }) => (
    <Message
      color={color}
      isCurrentUser={isCurrentUser}
      message={message}
    />
  );

  render() {
    return (
      <View style={styles.container}>
        <FlatList
          data={fakeData()}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
        />
      </View>
    );
  }
}

export default MessagesScreen;
