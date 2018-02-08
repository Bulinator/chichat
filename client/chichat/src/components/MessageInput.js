import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
} from 'react-native';
import { Icon } from 'react-native-elements';

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-end',
    backgroundColor: '#f5f1ee',
    borderColor: '#dbdbdb',
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  inputContainer: {
    flex: 1,
    paddingHorizontal: 14,
    paddingRight: 2,
    paddingVertical: 10,
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
    borderColor: '#dbdbdb',
    borderRadius: 15,
    borderWidth: 1,
    color: 'black',
    height: 36,
    paddingHorizontal: 8,
  },
  sendButtonContainer: {
    paddingRight: 10,
    paddingVertical: 4,
  },
  sendButton: {
    height: 32,
    width: 32,
  },
});

const sendButton = send => (
  <Icon
    raised
    reverse
    name="send"
    type="font-awesome"
    color="#128C7E"
    size={16}
    onPress={send}
  />
);

class MessageInput extends Component {
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Send message"
            style={styles.input}
          />
        </View>
        <View style={styles.sendButtonContainer}>
          {sendButton(this.send)}
        </View>
      </View>
    );
  }
}

export default MessageInput;
