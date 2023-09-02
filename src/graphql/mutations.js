/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createTask = `mutation CreateTask($input: CreateTaskInput!) {
  createTask(input: $input) {
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
export const updateTask = `mutation UpdateTask($input: UpdateTaskInput!) {
  updateTask(input: $input) {
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
export const deleteTask = `mutation DeleteTask($input: DeleteTaskInput!) {
  deleteTask(input: $input) {
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
export const createSettings = `mutation CreateSettings($input: CreateSettingsInput!) {
  createSettings(input: $input) {
    id
    pomodoroLength
    trackingMode
    owner
  }
}
`;
export const updateSettings = `mutation UpdateSettings($input: UpdateSettingsInput!) {
  updateSettings(input: $input) {
    id
    pomodoroLength
    trackingMode
    owner
  }
}
`;
export const deleteSettings = `mutation DeleteSettings($input: DeleteSettingsInput!) {
  deleteSettings(input: $input) {
    id
    pomodoroLength
    trackingMode
    owner
  }
}
`;
