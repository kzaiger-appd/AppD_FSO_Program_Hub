/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createTodo = /* GraphQL */ `
  mutation CreateTodo(
    $input: CreateTodoInput!
    $condition: ModelTodoConditionInput
  ) {
    createTodo(input: $input, condition: $condition) {
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
      archived
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateTodo = /* GraphQL */ `
  mutation UpdateTodo(
    $input: UpdateTodoInput!
    $condition: ModelTodoConditionInput
  ) {
    updateTodo(input: $input, condition: $condition) {
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
      archived
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteTodo = /* GraphQL */ `
  mutation DeleteTodo(
    $input: DeleteTodoInput!
    $condition: ModelTodoConditionInput
  ) {
    deleteTodo(input: $input, condition: $condition) {
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
      archived
      createdAt
      updatedAt
      __typename
    }
  }
`;
