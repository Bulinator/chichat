import Sequelize from 'sequelize';

// Init DB
const db = new Sequelize('chichat', null, null, {
  dialect: 'sqlite',
  storage: './chichat.sqlite',
  logging: false,
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

const Group = db.model.group;
const Message = db.model.message;
const User = db.model.user;

export { Group, Message, User };
