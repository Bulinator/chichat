import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { Icon } from 'react-native-elements';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  image: {
    width: 54,
    height: 54,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: 'red',
    borderColor: 'black',
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: 'row',
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -3,
    top: -3,
    width: 20,
  },
  list: {
    paddingVertical: 8,
  },
});

class SelectedUserListItem extends Component {
  constructor(props) {
    super(props);
    this.remove = this.remove.bind(this);
  }

  remove(user) {
    this.props.remove(this.props.user);
  }

  render() {
    const { username } = this.props.user;

    return (
      <View style={styles.container}>
        <View>
          <Image
            style={styles.image}
            source={{ uri: 'https://www.shareicon.net/data/2016/08/01/640324_logo_512x512.png' }}
          />
          <TouchableOpacity onPress={this.remove} style={styles.icon}>
            <Icon
              color='white'
              name='remove'
              type='font-awesome'
              size={12}
            />
          </TouchableOpacity>
        </View>
        <Text>{username}</Text>
      </View>
    );
  }
}

SelectedUserListItem.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
  }),
  remove: PropTypes.func,
};

class SelectedUserList extends Component {
  constructor(props) {
    super(props);
    this.renderItem = this.renderItem.bind(this);
  }

  keyExtractor = item => item.id;

  renderItem({ item: user }) {
    return (
      <SelectedUserListItem user={user} remove={this.props.remove} />
    );
  }

  render() {
    return (
      <FlatList
        data={this.props.data}
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItem}
        horizontal
        style={styles.list}
      />
    );
  }
}

SelectedUserList.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  remove: PropTypes.func,
};

export default SelectedUserList;
