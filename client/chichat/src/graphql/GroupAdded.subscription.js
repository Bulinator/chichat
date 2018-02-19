import gql from 'graphql-tag';

import GROUP_FRAGMENT from './Group.fragment';

const GROUP_ADDED_SUBSCRIPTION = gql`
  subscription onGroupAdded($userId: Int, $messageConnection: ConnectionInput) {
    groupAdded(userId: $userId) {
      ... GroupFagment
    }
  }
  ${GROUP_FRAGMENT}
`;
export default GROUP_ADDED_SUBSCRIPTION;
