import gql from 'graphql-tag';

const SIGNUP_MUTATION = gql`
  mutation signup($user: signinUserInput!) {
    signup(user: $user) {
      id
      jwt
      username
    }
  }
`;

export default SIGNUP_MUTATION;
