import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
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
    ...Platform.select({
      ios: {
        marginBottom: 10,
      },
      android: {
        marginBottom: 2,
      },
    }),
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
  constructor(props) {
    super(props);
    this.state = {};
    this.send = this.send.bind(this);
  }

  send() {
    this.props.send(this.state.text);
    this.textInput.clear();
    this.textInput.blur();
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            ref={(ref) => { this.textInput = ref; }}
            onChangeText={text => this.setState({ text })}
            placeholder="Say something..."
            style={styles.input}
            underlineColorAndroid="transparent"
          />
        </View>
        <View style={styles.sendButtonContainer}>
          {sendButton(this.send)}
        </View>
      </View>
    );
  }
}

MessageInput.propTypes = {
  send: PropTypes.func.isRequired,
};

export default MessageInput;
