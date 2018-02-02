import { _ } from 'lodash';
import Sequelize from 'sequelize';
import faker from 'faker';

// Init DB
const db = new Sequelize('chichat', null, null, {
  dialect: 'sqlite',
  storage: './chichat.sqlite',
  logging: false,
  operatorsAliases: false,
});

// define group model
const GroupModel = db.define('group', {
  name: { type: Sequelize.STRING },
});

// define message model
const MessageModel = db.define('message', {
  text: { type: Sequelize.STRING },
});

// define user model
const UserModel = db.define('user', {
  email: { type: Sequelize.STRING },
  username: { type: Sequelize.STRING },
  password: { type: Sequelize.STRING },
});

// users belongs to multiple groups
UserModel.belongsToMany(GroupModel, { through: 'GroupUser' });

// users belongs to multiple users as friends
UserModel.belongsToMany(UserModel, { through: 'Friends', as: 'friends' });

// messages are sent from users
MessageModel.belongsTo(UserModel);

// messages are sent to group
MessageModel.belongsTo(GroupModel);

// groups have multiple users
GroupModel.belongsToMany(UserModel, { through: 'GroupUser' });

// create fake starter data
const GROUPS = 4;
const USERS_PER_GROUP = 5;
const MESSAGES_PER_USER = 5;

db.sync({ force: true }).then(() => _.times(GROUPS, () =>
  GroupModel.create({
    name: faker.lorem.word(3),
  }).then(group => _.times(USERS_PER_GROUP, () => {
    const password = faker.internet.password();
    return group.createUser({
      email: faker.internet.userName(),
      password,
    }).then((user) => {
      console.log(
        '{email, username, password}',
        `{${user.email}, ${user.username}, ${user.password}}`,
      );
      _.times(MESSAGES_PER_USER, () => MessageModel.create({
        userId: user.id,
        groupId: group.id,
        text: faker.lorem.sentences(3),
      }));
      return user;
    });
  })).then((userPromises) => {
    // make users friends with all users in the group
    Promise.all(userPromises).then((users) => {
      _.each(users, (current, i) => {
        _.each(users, (user, j) => {
          if (i !== j) {
            current.addFriend(user);
          }
        });
      });
    });
  })));

const Group = db.model.group;
const Message = db.model.message;
const User = db.model.user;

export { Group, Message, User };
