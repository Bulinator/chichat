import { _ } from 'lodash';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import { graphql, compose } from 'react-apollo';
import { NavigationActions } from 'react-navigation';
import { connect } from 'react-redux';
import { Icon } from 'react-native-elements';
import SelectedUserList from '../components/SelectedUserList';

import Color from '../constants/Color';
import { USER_QUERY } from '../graphql/User.query';
import CREATE_GROUP_MUTATION from '../graphql/CreateGroup.mutation';


const goToNewGroup = group => NavigationActions.reset({
  index: 1,
  actions: [
    NavigationActions.navigate({ routeName: 'Main' }),
    NavigationActions.navigate({ routeName: 'Messages', params: { groupId: group.id, title: group.name } }),
  ],
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.bgBackgroundColor,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  detailsContainer: {
    padding: 20,
    flexDirection: 'row',
  },
  imageContainer: {
    paddingRight: 20,
    paddingTop: 1,
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  input: {
    color: 'black',
    height: 32,
  },
  inputBorder: {
    borderColor: Color.inputBorderColor,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  inputInstructions: {
    paddingTop: 6,
    color: Color.subTxtColor,
    fontSize: 12,
  },
  participants: {
    paddingHorizontal: 17,
    paddingVertical: 6,
    backgroundColor: Color.inputBorderColor,
    color: Color.subTxtColor,
  },
  groupImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
});

class FinalizeGroupScreen extends Component {
  static navigationOptions = ({ navigation }) => {
    const { state } = navigation;
    const isReady = state.params && state.params.mode === 'ready';
    return {
      title: 'Finalize group',
      headerBackTitleStyle: {
        color: Color.txtDefaultColor,
      },
      headerStyle: {
        backgroundColor: Color.tabBackgroundColor,
        marginTop: (Platform.OS === 'ios') ? 0 : 24,
      },
      headerRight: (
        isReady ? <Icon
          name="angle-double-right"
          type="font-awesome"
          color={Color.txtDefaultColor}
          containerStyle={{ marginRight: 10 }}
          onPress={state.params.create}
        /> : null
      ),
      headerTintColor: Color.txtDefaultColor,
    };
  }

  constructor(props) {
    super(props);
    const { selected } = props.navigation.state.params;

    this.state = {
      selected,
    };

    this.create = this.create.bind(this);
    this.pop = this.pop.bind(this);
    this.remove = this.remove.bind(this);
  }

  componentDidMount() {
    this.refreshNavigation(this.state.selected.length && this.state.name);
  }

  componentWillUpdate(nextProps, nextState) {
    if ((nextState.selected.length && nextState.name) !==
    (this.state.selected.length && this.state.name)) {
      this.refreshNavigation(nextState.selected.length && nextState.name);
    }
  }

  pop() {
    this.props.navigation.goBack();
  }

  remove(user) {
    const index = this.state.selected.indexOf(user);
    if (~index) {
      const selected = update(this.state.selected, { $splice: [[index, 1]] });
      this.setState({
        selected,
      });
    }
  }

  create() {
    const { createGroup } = this.props;

    createGroup({
      name: this.state.name,
      userIds: _.map(this.state.selected, 'id'),
    }).then((res) => {
      this.props.navigation.dispatch(goToNewGroup(res.data.createGroup));
    }).catch((error) => {
      Alert.alert(
        'Error Creating New Group',
        error.message,
        [
          { text: 'OK', onPress: () => {} },
        ],
      );
    });
  }

  refreshNavigation(ready) {
    const { navigation } = this.props;
    navigation.setParams({
      mode: ready ? 'ready' : undefined,
      create: this.create,
    });
    // console.log(this.props.navigation.state.params.mode);
  }

  render() {
    const { friendCount } = this.props.navigation.state.params;

    return (
      <View style={styles.container}>
        <View style={styles.detailsContainer}>
          <TouchableOpacity style={styles.imageContainer}>
            <Image
              style={styles.groupImage}
              source={{ uri: 'https://www.shareicon.net/data/2016/08/01/640324_logo_512x512.png' }}
            />
            <Text>edit</Text>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <View style={styles.inputBorder}>
              <TextInput
                autofocus
                autocorrect={false}
                onChangeText={name => this.setState({ name })}
                placeholder="Group subject"
                style={styles.input}
                underlineColorAndroid="transparent"
              />
            </View>
            <Text style={styles.inputInstructions}>
              Please provide a group subject
              and optional group icon
            </Text>
          </View>
        </View>
        <Text style={styles.participants}>
          {`Participants: ${this.state.selected.length} of ${friendCount}.`.toUpperCase()}
        </Text>
        <View style={styles.selected}>
          {this.state.selected ?
            <SelectedUserList
              data={this.state.selected}
              remove={this.remove}
            /> : undefined
          }
        </View>
      </View>
    );
  }
}

FinalizeGroupScreen.propTypes = {
  createGroup: PropTypes.func,
  navigation: PropTypes.shape({
    dispatch: PropTypes.func,
    goBack: PropTypes.func,
    state: PropTypes.shape({
      params: PropTypes.shape({
        friendCount: PropTypes.number.isRequired,
      }),
    }),
  }),
};

const createGroupMutation = graphql(CREATE_GROUP_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    createGroup: group =>
      mutate({
        variables: { group },
        update: (store, { data: { createGroup } }) => {
          // Read data from our cache
          const data = store.readQuery({ query: USER_QUERY, variables: { id: ownProps.auth.id } });

          // Add our message from the mutation to the end
          data.user.groups.push(createGroup);

          // Write data back to the cache
          store.writeQuery({
            query: USER_QUERY,
            variables: { id: ownProps.auth.id },
            data,
          });
        },
      }),
  }),
});

const userQuery = graphql(USER_QUERY, {
  options: ownProps => ({
    variables: {
      id: ownProps.navigation.state.params.userId,
    },
  }),
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
  createGroupMutation,
)(FinalizeGroupScreen);
