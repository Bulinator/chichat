import _ from 'lodash';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  Image,
} from 'react-native';
import PropTypes from 'prop-types';
import { graphql, compose } from 'react-apollo';
import { connect } from 'react-redux';
import update from 'immutability-helper';
import AlphabetListView from 'react-native-alphabetlistview';
import { Icon } from 'react-native-elements';

import SelectedUserList from '../components/SelectedUserList';
import { Spinner } from '../components/common';
import Color from '../constants/Color';

import USER_QUERY from '../graphql/User.query';

// eslint-disable-next-line
const sortObject = o => Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.bgBackgroundColor,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  checkButtonContainer: {
    paddingRight: 12,
    paddingVertical: 6,
  },
  cellImage: {
    width: 32,
    height: 32,
  },
  cellLabel: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cellIndex: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'blue',
  },
  selected: {
    flexDirection: 'row',
  },
});

/* eslint arrow-body-style: ["error", "as-needed", { "requireReturnForObjectLiteral": true }] */
const SectionItem = ({ title }) => {
  return (
    <Text style={styles.cellIndex}>{title}</Text>
  );
};

SectionItem.propTypes = {
  title: PropTypes.string,
};

class Cell extends Component {
  constructor(props) {
    super(props);
    this.toggle = this.toggle.bind(this);
    this.state = {
      isSelected: props.isSelected(props.item),
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      isSelected: nextProps.isSelected(nextProps.item),
    });
  }

  toggle() {
    this.props.toggle(this.props.item);
  }

  render() {
    return (
      <View style={styles.cellContainer}>
        <Image
          style={styles.cellImage}
          source={{ uri: 'https://www.shareicon.net/data/2016/08/01/640324_logo_512x512.png' }}
        />
        <Text style={styles.cellLabel}>{this.props.item.username}</Text>
        <View style={styles.checkButtonContainer}>
          <Icon
            name='check'
            type='font-awesome'
            borderRadius={12}
            color={this.state.isSelected ? 'green' : 'blue'}
            size={16}
            onPress={this.toggle}
          />
        </View>
      </View>
    );
  }
}

Cell.propTypes = {
  isSelected: PropTypes.func,
  item: PropTypes.shape({
    username: PropTypes.string.isRequired,
  }).isRequired,
  toggle: PropTypes.func.isRequired,
};

class NewGroupScreen extends Component {
  static navigationOptions = ({ navigation }) => {
    const { state } = navigation;
    const isReady = state.params && state.params.mode === 'ready';
    return {
      title: 'Create new group',
      headerBackTitleStyle: {
        color: Color.txtDefaultColor,
        paddingLeft: 5,
        paddingRight: 5,
      },
      headerStyle: {
        backgroundColor: Color.tabBackgroundColor,
        marginTop: (Platform.OS === 'ios') ? 0 : 24,
      },
      headerRight: (
        isReady ?
          <Icon
            name="angle-double-right"
            type="font-awesome"
            color={Color.txtDefaultColor}
            containerStyle={{ marginRight: 10 }}
            onPress={state.params.finalizeGroup}
          /> : null
      ),
      headerTintColor: Color.txtDefaultColor,
    };
  }

  constructor(props) {
    super(props);
    let selected = [];
    if (this.props.navigation.state.params) {
      selected = this.props.navigation.state.params.selected;
    }

    this.state = {
      selected: selected || [],
      friends: props.user ?
        _.groupBy(props.user.friends, friend => friend.username.charAt(0).toUpperCase()) : [],
    };

    this.finalizeGroup = this.finalizeGroup.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  componentDidMount() {
    this.refreshNavigation(this.state.selected);
  }

  componentWillReceiveProps(nextProps) {
    const state = {};
    if (nextProps.user && nextProps.user.friends && nextProps.user !== this.props.user) {
      state.friends = sortObject(
        _.groupBy(nextProps.user.friends, friend => friend.username.charAt(0).toUpperCase()),
      );
    }

    if (nextProps.selected) {
      Object.assign(state, {
        selected: nextProps.selected,
      });
    }

    this.setState(state);
  }

  componentWillUpdate(nextProps, nextState) {
    if (!!this.state.selected.length !== !!nextState.selected.length) {
      this.refreshNavigation(nextState.selected);
    }
  }

  refreshNavigation(selected) {
    const { navigation } = this.props;
    navigation.setParams({
      mode: selected && selected.length ? 'ready' : undefined,
      finalizeGroup: this.finalizeGroup,
    });
  }

  finalizeGroup() {
    const { navigate } = this.props.navigation;
    navigate('FinalizeGroup', {
      selected: this.state.selected,
      friendCount: this.props.user.friends.length,
      userId: this.props.user.id,
    });
  }

  isSelected(user) {
    return ~this.state.selected.indexOf(user);
  }

  toggle(user) {
    const index = this.state.selected.indexOf(user);
    if (~index) {
      const selected = update(this.state.selected, { $splice: [[index, 1]] });
      return this.setState({
        selected,
      });
    }

    const selected = [...this.state.selected, user];
    return this.setState({
      selected,
    });
  }

  render() {
    const { user, loading } = this.props;
    if (loading || !user) {
      return (
        <View style={[styles.container, styles.loadingContainer]}>
          <Spinner />
        </View>
      );
    }
    // console.log(this.state.friends);
    return (
      <View style={styles.container}>
        {this.state.selected.length ?
          <View style={styles.selected}>
            <SelectedUserList
              data={this.state.selected}
              remove={this.toggle}
            />
          </View> : undefined
        }

        {
          _.keys(this.state.friends).length ?
            <AlphabetListView
              style={{ flex: 1 }}
              data={this.state.friends}
              cell={Cell}
              cellHeight={30}
              cellProps={{
                isSelected: this.isSelected,
                toggle: this.toggle,
              }}
              sectionListItem={SectionItem}
              sectionHeaderHeight={22.5}
            /> : undefined
        }
      </View>
    );
  }
}

NewGroupScreen.propTypes = {
  loading: PropTypes.bool.isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    setParams: PropTypes.func,
    state: PropTypes.shape({
      params: PropTypes.object,
    }),
  }),
  user: PropTypes.shape({
    id: PropTypes.number,
    friends: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      username: PropTypes.string,
    })),
  }),
  selected: PropTypes.arrayOf(PropTypes.object),
};

const userQuery = graphql(USER_QUERY, {
  options: ownProps => ({ variables: { id: ownProps.auth.id } }),
  props: ({ data: { loading, user } }) => ({
    loading, user,
  }),
});

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default compose(
  connect(mapStateToProps),
  userQuery,
)(NewGroupScreen);
