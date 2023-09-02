/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getTask = `query GetTask($id: ID!) {
  getTask(id: $id) {
    id
    name
    color
    pomodoros
    estimatedPomodoro
    description
    parentTaskId
    state
    deletionState
    deadline
    updatedAt
    owner
  }
}
`;
export const listTasks = `query ListTasks(
  $filter: ModelTaskFilterInput
  $limit: Int
  $nextToken: String
) {
  listTasks(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      color
      pomodoros
      estimatedPomodoro
      description
      parentTaskId
      state
      deletionState
      deadline
      updatedAt
      owner
    }
    nextToken
  }
}
`;
export const getSettings = `query GetSettings($id: ID!) {
  getSettings(id: $id) {
    id
    pomodoroLength
    trackingMode
    owner
  }
}
`;
export const listSettingss = `query ListSettingss(
  $filter: ModelSettingsFilterInput
  $limit: Int
  $nextToken: String
) {
  listSettingss(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      pomodoroLength
      trackingMode
      owner
    }
    nextToken
  }
}
`;
