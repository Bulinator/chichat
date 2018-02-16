import gql from 'graphql-tag';

import MESSAGE_FRAGMENT from './Message.fragment';

const CREATE_GROUP_MUTATION = gql`
  mutation createGroup($name: String!, $userIds: [Int!]) {
    createGroup(name: $name, userIds: $userIds) {
      id
      name
      users {
        id
      }
      messages(first: 1) { # no needs to use variables here
        edges {
          cursor
          node {
            ... MessageFragment
          }
        }
      }
    }
  }
  ${MESSAGE_FRAGMENT}
`;

export default CREATE_GROUP_MUTATION;
