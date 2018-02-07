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
import { Icon } from 'react-native-elements';
import Color from '../constants/Color';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.backgroundColor,
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
  render() {
    const { id, name } = this.props.group;
    return (
      <TouchableHighlight key={id}>
        <View style={styles.groupContainer}>
          <Text style={styles.groupName}>{`${name}`}</Text>
        </View>
      </TouchableHighlight>
    );
  }
}

Group.propTypes = {
  group: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }),
};

class GroupsScreen extends Component {
  static navigationOptions = {
    title: 'ChiChat',
    headerStyle: {
      backgroundColor: Color.tabBackgroundColor,
    },
    headerTitleStyle: {
      color: Color.txtDefaultColor,
    },
  };

  keyExtractor = item => item.id;

  renderItem = ({ item }) => <Group group={item} />;

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

export default GroupsScreen;
