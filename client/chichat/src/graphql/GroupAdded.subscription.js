import gql from 'graphql-tag';

import GROUP_FRAGMENT from './Group.fragment';

const GROUP_ADDED_SUBSCRIPTION = gql`
  subscription onGroupAdded($userId: Int, $first: Int = 1, $after: String, $last: Int, $before: String) {
    groupAdded(userId: $userId) {
      ... GroupFagment
    }
  }
  ${GROUP_FRAGMENT}
`;
export default GROUP_ADDED_SUBSCRIPTION;
