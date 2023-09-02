import React, { Component } from 'react';
import './App.css';
import Amplify, { API, graphqlOperation, Auth } from 'aws-amplify';
import * as queries from './graphql/queries';
import * as mutations from './graphql/mutations';
import awsmobile from './aws-exports';
import { withAuthenticator } from 'aws-amplify-react';
import MaterialTable from 'material-table';
import Subtask from './components/subtask'
import Sidebar from './components/sidebar'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import { Router, Switch, Route } from "react-router-dom";
import { createBrowserHistory } from 'history';

const history = createBrowserHistory();
const location = history.location;
Amplify.configure(awsmobile);
Auth.configure(awsmobile);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newItem: '',
      allTasks: [],
      DeleteTask: null,
      CompleteTask: null,
      MoveToDeleteTask: null,
      currentTask: '',
      nameEditMode: [false],
      currentEdit: -1,
      tempItemName: '',
      showCompleted: false,
      showDeleted: false,
      widthClass: "narrow",
      currentUser: ''
    };

    this.handleChange = this.handleChange.bind(this);
    this.createTask = this.createTask.bind(this);
    this.currentTasks = this.currentTasks.bind(this);
    this.modifyPomodoro = this.modifyPomodoro.bind(this);
  }

  componentDidMount = async() => {
    Auth.currentAuthenticatedUser().then(u => {this.setState({currentUser: u})});
    // test
    await this.refreshAllTasks()
  }

  componentDidUpdate = async() => {
    if (this.state.DeleteTask != null) {
      const deleteTaskId = this.state.DeleteTask.id
      const child_tasks = await API.graphql(graphqlOperation(queries.listTasks, {filter: {parentTaskId: {eq: deleteTaskId}}, limit: 999999999}));
      await child_tasks.data.listTasks.items.map(task => {
        return this.subTaskDelete(task)
      })
      const deleteTask = await API.graphql(graphqlOperation(mutations.deleteTask, {input: {id: deleteTaskId }}));
      await this.refreshAllTasks()
      this.setState({DeleteTask: null})
    }

    if (this.state.CompleteTask != null) {
      var updatedTask = this.state.CompleteTask;
      if (updatedTask.state === 'completed') {
        updatedTask.state = null;
      } else {
        updatedTask.state = 'completed';
      }
      let {tableData, owner, ...graphqlUpdatedTask} = updatedTask;
      const completeTask = await API.graphql(graphqlOperation(mutations.updateTask, {input: graphqlUpdatedTask}));
      this.setState({CompleteTask: null})
    }
    if (this.state.MoveToDeleteTask != null) {
      var moveToDeleteTask = this.state.MoveToDeleteTask;
      if (moveToDeleteTask.deletionState !== 'deleted') {
        moveToDeleteTask.deletionState= 'deleted';
      } else {
        moveToDeleteTask.deletionState = null;
      }
      let {tableData, owner, ...graphqlUpdatedTask} = moveToDeleteTask;
      const completeTask = await API.graphql(graphqlOperation(mutations.updateTask, {input: graphqlUpdatedTask}));
      var everyTask = this.state.allTasks;
      everyTask.data.listTasks.items.map((task) => {
        if (task.id === completeTask.id) {
          task = completeTask;
        }
      })
      this.setState({MoveToDeleteTask: null, allTasks: everyTask})
    }
  }
  totalEstimatedPomodoro = (tasks) => {
    return (this.arrayOfStringCount(tasks.map(x => x.estimatedPomodoro)))
  }

  totalCurrentPomodoro = (tasks) => {
    return (this.arrayOfStringCount(tasks.map(x => x.pomodoros)))
  }

  arrayOfStringCount = (tempArrayPomodoros) => {
    const reducer = (accumulator, currentValue) => parseInt(accumulator) + parseInt(currentValue);
    let tempPomodoros;
    if (tempArrayPomodoros.length > 0) {
      tempPomodoros = (parseInt(tempArrayPomodoros.reduce(reducer)))
    }
    return tempPomodoros;
  }

  subTaskDelete = async(task) => {
    var currentDeleteTask;
    const child_tasks = await API.graphql(graphqlOperation(queries.listTasks, {filter: {parentTaskId: {eq: task.id}}, limit: 999999999}));
    await Promise.all(child_tasks.data.listTasks.items.map(subtask => {
      return this.subTaskDelete(subtask)
    }))
    currentDeleteTask = await API.graphql(graphqlOperation(mutations.deleteTask, {input: {id: task.id }}));
    await this.refreshAllTasks()
    return console.log(currentDeleteTask);
  }

  handleChange(event) {
    this.setState({[event.target.name]: event.target.value});
  }

  setPomodoro = (addPomodoro) => {
    this.forceUpdate()
  }

  modifyPomodoro = (doneDiff,estimateDiff) => {
    this.forceUpdate()
  }

  createTask = async (data) => {
    var randomColor = require('randomcolor')
    var color = randomColor();
    console.log('A name was submitted: ' + data.name);
    const todoDetails = {
      name: data.name,
      description: 'Learn AWS AppSync',
      color: color,
      pomodoros: 0,
      estimatedPomodoro: 1,
      state: 'new',
      deletionState: 'false',
      deadline: 'none',
      parentTaskId: 'none'
    };
    const newTask = await API.graphql(graphqlOperation(mutations.createTask, {input: todoDetails}));
    await this.refreshAllTasks()
  }

  refreshAllTasks = async () => {
    const allTasks = await API.graphql(graphqlOperation(queries.listTasks, {filter: {parentTaskId: {eq: "none"}}, limit: 999999999}));
    var resetEditArray = []
    for (var i = 0; i < allTasks.data.listTasks.items.length; ++i) { resetEditArray.push(false) }

    this.setState({allTasks: allTasks, nameEditMode: resetEditArray, currentEdit: -1})
  }

  editTaskName = (rowData) => {
    var tempNameEditArray = this.state.nameEditMode;
    var tempCurrentEdit = this.state.currentEdit;
    for (var i = 0; i < this.state.allTasks.data.listTasks.items.length; ++i) {
      if (this.state.allTasks.data.listTasks.items[i].id === rowData.id) {
        tempNameEditArray[i] = true
        tempCurrentEdit = rowData.id;
      }
    }
    this.setState({nameEditMode: tempNameEditArray, tempItemName: rowData.name, currentEdit: tempCurrentEdit})
  }

  updateTaskName = async (rowData) => {
    var currentTask = rowData
    currentTask.name = this.state.tempItemName
    let {tableData, owner, ...graphqlUpdatedTask} = currentTask;
    await API.graphql(graphqlOperation(mutations.updateTask, {input: graphqlUpdatedTask}));
    await this.refreshAllTasks()
  }

  rowNameDisplay = (rowData, allowEdit) => {
    if (!allowEdit) {
      return(<div>{rowData.name}</div>)
    }
    if (rowData.id===this.state.currentEdit) {
      return (<Row>
                <Col xs="8" className="edit-mode">
                  <input type="text" style={{ width:"100%" }} value={this.state.tempItemName} name="tempItemName" placeholder={this.state.tempItemName} onChange={this.handleChange} />
                </Col>
                <Col xs="4" className="edit-mode">
                    <Button variant="primary" className="button-prettify" onClick={() => this.updateTaskName(rowData)}>rename</Button>
                </Col>
              </Row>)
    } else {
      return (
        (<Row>
          <button className="unbutton" onClick={(e) => this.editTaskName(rowData)}>{rowData.name}</button>
        </Row>)
      )
    }
  }

  checkIfNotCompleted = (item) => {
    return (item.state !== 'completed' && item.deletionState !== 'deleted')
  }

  checkIfCompleted = (item) => {
    return (item.state === 'completed' && item.deletionState !== 'deleted')
  }
  checkIfDeleted = (item) => {
    return (item.deletionState === 'deleted')
  }

  progressBar = (rowData) => {
    const numScore =  (100 * rowData.pomodoros / rowData.estimatedPomodoro).toPrecision(3);
    const score = numScore + '%'
    var width = '100%';
    if (numScore < 100) {
      width = score;
    }
    var color = numScore > 70 ? '#4CAF50' : '#f44336'
    if (numScore > 100) color = '#800080';
    if (rowData.state === 'completed') color = '#1E90FF';
    return (
      <div style={{ width: '100%', backgroundColor: '#ddd', height: 20 }}>
        <div
          style={{
            textAlign: 'left',
            padding: 1,
            color: 'white',
            width: width,
            backgroundColor: color,
            height: 20,
          }}
        >
          {score}
        </div>
      </div>
    )
  }

  allCurrentTasks = () => {
    if (this.state.allTasks.data === undefined) {
      return []
    }
    const allTaskArrayData = this.state.allTasks.data.listTasks.items;
    const unsortedCurrentTasks = allTaskArrayData.filter(this.checkIfNotCompleted)
    return unsortedCurrentTasks
  }

  currentTasks = () => {
    if (this.state.allTasks.data === undefined) {
      return (<div/>)
    } else {
      const appThis = this;
      return (
        <div className="current-padding">
          <div style={{ maxWidth: '100%' }} className="box-shadow">
           <MaterialTable
             columns={[
              { title: 'Task', field: 'name', render: rowData => {
                return (<React.Fragment>{this.rowNameDisplay(rowData, true)}</React.Fragment>);
              }},
              { title: 'Time Spent', field: 'pomodoros', render: rowData => {
                const pomodoroRatio = rowData.pomodoros + "/" + rowData.estimatedPomodoro;
                return (<div>{pomodoroRatio}</div>);
              }},
              { title: 'Deadline', field: 'deadline' },
              {
                title: 'Progress',
                field: 'successScore',
                render: rowData => {
                  return(this.progressBar(rowData))
                },
              },
             ]}
             data={ this.allCurrentTasks() }
             title=""
             options={{
               paging: false
             }}
             icons={{
               Add: props => (
                 <div><Button variant="primary" aria-describedby="">+ New Task</Button></div>
               ),
             }}
             editable={{
               onRowAdd: newData =>
                 new Promise(async (resolve, reject) => {
                   setTimeout(() => {
                     this.createTask(newData)
                   resolve()
                 }, 1000);
                })
             }}
             actions={[
               {
                 icon: 'done',
                 tooltip: 'Mark Done',
                 onClick: (event, rows) => {
                   appThis.setState({CompleteTask: rows})
                 },
               },
               {
                 icon: 'delete',
                 tooltip: 'Move to Trash',
                 onClick: (event, rows) => {
                   appThis.setState({MoveToDeleteTask: rows})
                 },
               },
             ]}
             detailPanel={rowData => {
               return (
                 <Subtask
                   data={rowData}
                   allowEdit={true}
                   modifyPomodoro={this.modifyPomodoro}
                   setPomodoro={this.setPomodoro}>
                 </Subtask>
               )
             }}
           />
         </div>
       </div>
      )
    }
  }

  completedTasks = () => {
    if (this.state.allTasks.data === undefined) {
      return (<div/>)
    } else {
      const allTaskArrayData = this.state.allTasks.data.listTasks.items;
      var taskArrayData = allTaskArrayData.filter(this.checkIfCompleted)
      const appThis = this;
      return (
        <div className="done-padding">
          <div style={{ maxWidth: '100%' }} className="box-shadow">
           <MaterialTable
             columns={[
              { title: 'Task', field: 'name', render: rowData => {
                return (<div>{this.rowNameDisplay(rowData, false)}</div>);
              }},
              { title: 'Time Spent', field: 'pomodoros', render: rowData => {
                const pomodoroRatio = rowData.pomodoros + "/" + rowData.estimatedPomodoro;
                return (<div>{pomodoroRatio}</div>);
              }},
              { title: 'Deadline', field: 'deadline' },
              {
                title: 'Progress',
                field: 'successScore',
                render: rowData => {
                  return (<div>Done</div>)
                },
              },
             ]}
             data={ taskArrayData }
             title="Tasks to Do"
             options={{
               toolbar: false,
               paging: false
             }}
             actions={[
               {
                 icon: 'undo',
                 tooltip: 'Mark not done',
                 onClick: (event, rows) => {
                   appThis.setState({CompleteTask: rows})
                 },
               },
               {
                 icon: 'delete',
                 tooltip: 'Move to Trash',
                 onClick: (event, rows) => {
                   appThis.setState({MoveToDeleteTask: rows})
                 },
               },
             ]}
             detailPanel={rowData => {
               return (
                 <Subtask
                   data={rowData}
                   allowEdit={false}>
                 </Subtask>
               )
             }}
           />
         </div>
       </div>
      )
    }
  }
  deletedTasks = () => {
    if (this.state.allTasks.data === undefined) {
      return (<div/>)
    } else {
      const allTaskArrayData = this.state.allTasks.data.listTasks.items;
      var taskArrayData = allTaskArrayData.filter(this.checkIfDeleted)
      const appThis = this;
      return (
        <div className="delete-padding">
          <div style={{ maxWidth: '100%' }} className="box-shadow">
           <MaterialTable
             columns={[
              { title: 'Task', field: 'name', render: rowData => {
                return (<div>{this.rowNameDisplay(rowData, false)}</div>);
              }},
              { title: 'Time Spent', field: 'pomodoros', render: rowData => {
                const pomodoroRatio = rowData.pomodoros + "/" + rowData.estimatedPomodoro;
                return (<div>{pomodoroRatio}</div>);
              }},
              { title: 'Deadline', field: 'deadline' },
              {
                title: 'Progress',
                field: 'successScore',
                render: rowData => {
                  if (rowData.state !== "completed") {
                    return(this.progressBar(rowData))
                  } else {
                    return (<div>Done</div>)
                  }
                },
              },
             ]}
             data={ taskArrayData }
             title="Tasks to Do"
             options={{
               toolbar: false,
               paging: false
             }}
             actions={[
               {
                 icon: 'unarchive',
                 tooltip: 'Restore',
                 onClick: (event, rows) => {
                   appThis.setState({MoveToDeleteTask: rows})
                 },
               },
               {
                 icon: 'delete',
                 tooltip: 'Permanently Delete',
                 onClick: (event, rows) => {
                   appThis.setState({DeleteTask: rows})
                 },
               },
             ]}
             detailPanel={rowData => {
               return (
                 <Subtask
                   data={rowData}
                   allowEdit={false}>
                 </Subtask>
               )
             }}
           />
         </div>
       </div>
      )
    }
  }

  toggleCompleted = () => {
    this.setState({showCompleted: !this.state.showCompleted})
  }

  toggleDeleted = () => {
    this.setState({showDeleted: !this.state.showDeleted})
  }

  setWidth = (cssSelector) => {
    this.setState({widthClass: cssSelector})
  }

  render() {
    return (
      <Router history={history} location={location}>
        <Sidebar location={location} history={history} setWidth={this.setWidth} currentUser={this.state.currentUser} />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
        <div className={this.state.widthClass}>
          <Switch>
            <Route path="/completed" exact>
              <div className="completed-pane">
                <h3 className="header-font">Completed Tasks</h3>
                { this.completedTasks() }
              </div>
            </Route>
            <Route path="/deleted" exact>
              <div className="trash-pane">
                <h3 className="header-font">Trash</h3>
                { this.deletedTasks() }
              </div>
            </Route>
            <Route path="/" exact>
              <div style={{ maxWidth: '100%' }}>
                <div className="current-pane">
                  <div className="header-bar"></div>
                  <div className="main-pane">
                    <div className="header-font" style={{ float: 'left' }}>Current Todo Tasks</div>
                    <div className="header-font" style={{ float: 'right' }} >Total progress: {this.totalCurrentPomodoro(this.allCurrentTasks())}/{this.totalEstimatedPomodoro(this.allCurrentTasks())}</div>
                    <div style={{ clear: 'both' }}>{ this.currentTasks() }</div>
                  </div>
                </div>
              </div>
            </Route>
          </Switch>
        </div>
      </Router>
    );
  }
}

export default withAuthenticator(App, true);
