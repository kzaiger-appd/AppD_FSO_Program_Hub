/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getTodo = /* GraphQL */ `
  query GetTodo($id: ID!) {
    getTodo(id: $id) {
      id
      projectName
      projectVersion
      backlog
      ccoActual
      ccoCommit
      ccoTarget
      csldUrl
      icDate
      platform_type
      psirtClosed
      psirtOpened
      releaseStatus
      releaseType
      rvVerified
      programContent
      ssAttribute
      status
      timsSitUrl
      tsAttribute
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listTodos = /* GraphQL */ `
  query ListTodos(
    $filter: ModelTodoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTodos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        projectName
        projectVersion
        backlog
        ccoActual
        ccoCommit
        ccoTarget
        csldUrl
        icDate
        platform_type
        psirtClosed
        psirtOpened
        releaseStatus
        releaseType
        rvVerified
        programContent
        ssAttribute
        status
        timsSitUrl
        tsAttribute
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
