import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

class FinalizeGroupScreen extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text>Finalize group</Text>
      </View>
    );
  }
}

export default FinalizeGroupScreen;
