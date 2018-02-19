import gql from 'graphql-tag';

import MESSAGE_FRAGMENT from './Message.fragment';

// get the user's groups
export const USER_QUERY = gql`
  query user($id: Int) {
    user(id: $id) {
      id
      email
      username
      groups {
        id
        name
        unreadCount
        messages(first: 1) { # no needs to use variables here
          edges {
            cursor
            node {
              ... MessageFragment
            }
          }
        }
      }
      friends {
        id
        username
      }
    }
  }
  ${MESSAGE_FRAGMENT}
`;

export default USER_QUERY;
