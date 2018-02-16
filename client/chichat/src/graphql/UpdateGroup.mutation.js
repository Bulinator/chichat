import gql from 'graphql-tag';

const UPDATE_GROUP_MUTATION = gql`
  mutation updateGroup($id: Int!, $name: String!) {
    updateGroup(id: $id, name: $name) {
      id
      name
    }
  }
`;

export default UPDATE_GROUP_MUTATION;
