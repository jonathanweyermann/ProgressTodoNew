/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateTask = `subscription OnCreateTask($owner: String!) {
  onCreateTask(owner: $owner) {
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
export const onUpdateTask = `subscription OnUpdateTask($owner: String!) {
  onUpdateTask(owner: $owner) {
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
export const onDeleteTask = `subscription OnDeleteTask($owner: String!) {
  onDeleteTask(owner: $owner) {
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
export const onCreateSettings = `subscription OnCreateSettings($owner: String!) {
  onCreateSettings(owner: $owner) {
    id
    pomodoroLength
    trackingMode
    owner
  }
}
`;
export const onUpdateSettings = `subscription OnUpdateSettings($owner: String!) {
  onUpdateSettings(owner: $owner) {
    id
    pomodoroLength
    trackingMode
    owner
  }
}
`;
export const onDeleteSettings = `subscription OnDeleteSettings($owner: String!) {
  onDeleteSettings(owner: $owner) {
    id
    pomodoroLength
    trackingMode
    owner
  }
}
`;
