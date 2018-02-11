import GraphQLDate from 'graphql-date';
import {
  Group,
  Message,
  User,
} from './connectors';

export const Resolvers = {
  Date: GraphQLDate,
  Query: {
    group(_, args) {
      return Group.find({ where: args });
    },
    messages(_, args) {
      return Message.findAll({
        where: args,
        order: [['createdAt', 'DESC']],
      });
    },
    user(_, args) {
      return User.findOne({ where: args });
    },
  },
  Mutation: {
    createMessage(_, { text, userId, groupId }) {
      console.log('Message received: ', `UID [${userId}] for GUID [${groupId}]: ${text}`);
      return Message.create({
        text,
        userId,
        groupId,
      });
    },
    createGroup(_, { name, userIds, userId }) {
      console.log('here we go', name);
    },
    deleteGroup(_, { id }) {
      return Group.find({ where: id })
        .then(group => group.getUsers()
          .then(users => group.removeUsers(users))
          .then(() => Message.destroy({ where: { groupId: group.id } }))
          .then(() => group.destroy()),
      );
    },
    leaveGroup(_, { id, userId }) {
      return Group.find({ where: id })
        .then(group => group.removeUser(userId)
          .then(() => group.getUser())
          .then((users) => {
            // if last user leave group, thus remove group!
            if (!users.length) {
              group.destroy();
            }
            // return group ip left
            return { id };
          }),
        );
    },
    updateGroup(_, { id, name }) {
      return Group.findOne({ where: id })
        .then(group => group.update({ name }));
    },
  },
  Group: {
    users(group) {
      return group.getUsers();
    },
    messages(group) {
      return Message.findAll({
        where: { groupId: group.id },
        order: [['createdAt', 'DESC']],
      });
    },
  },
  Message: {
    to(message) {
      return message.getGroup();
    },
    from(message) {
      return message.getUser();
    },
  },
  User: {
    messages(user) {
      return Message.findAll({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']],
      });
    },
    groups(user) {
      return user.getGroups();
    },
    friends(user) {
      return user.getFriends();
    },
  },
};

export default Resolvers;
