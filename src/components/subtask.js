import React, { Component } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';
import MaterialTable from 'material-table';
import Pomodoro from './pomodoro.js';
import Container from 'react-bootstrap/Container';
//import Row from 'react-bootstrap/Row';
import { Row } from './styles.js'
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import './subtask.css'


// Require Editor CSS files.
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

import FroalaEditorComponent from 'react-froala-wysiwyg';
import FroalaEditorView from 'react-froala-wysiwyg/FroalaEditorView';

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faCheck } from '@fortawesome/free-solid-svg-icons'
library.add(faEdit)
library.add(faCheck)



class Subtask extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newItem: '',
      newEstimatedPomodoro: props.data.estimatedPomodoro,
      firstEstimatedPomodoroTransfer: true,
      description: '',
      editDescription: false,
      subTasks: [],
      mainTask: '',
      DeleteTask: null,
      CompleteTask: null,
      pomodoros: 0,
      estimatedPomodoro: 1,
      error: '',
      showSubTasks: false,
      nameEditMode: [false],
      currentEdit: -1,
      tempItemName: ''
    };

    this.handleChange = this.handleChange.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.createTask = this.createTask.bind(this);
    this.modifyPomodoro = this.modifyPomodoro.bind(this);
    this.setPomodoro = this.setPomodoro.bind(this);
  }

  setPomodoro = (addPomodoroEstimate,addPomodoro) => {
    var rowData = this.props.data
    if (this.state.subTasks.data.listTasks.items.length === 1 && parseInt(addPomodoroEstimate) >= 0) {
      rowData.estimatedPomodoro = addPomodoroEstimate;
      rowData.pomodoros = addPomodoro;
    } else {
      rowData.estimatedPomodoro = (parseInt(rowData.estimatedPomodoro) + addPomodoroEstimate).toString();
      rowData.pomodoros = (parseInt(rowData.pomodoros) + addPomodoro).toString();
    }
    this.setState({DeleteTask: null});
    this.props.setPomodoro(rowData.estimatedPomodoro,rowData.pomodoros);
  }

  modifyPomodoro = (doneDiff,estimateDiff) => {
    var rowData = this.props.data
    var tempEstimate = rowData.estimatedPomodoro;
    var tempPomodoro = rowData.pomodoros;
    rowData.estimatedPomodoro = Math.max((parseInt(rowData.estimatedPomodoro) + estimateDiff).toString(),0);
    rowData.pomodoros = Math.max((parseInt(rowData.pomodoros) + doneDiff).toString(),0);
    rowData.pomodoros = Math.min(rowData.pomodoros, rowData.estimatedPomodoro)
    this.forceUpdate()
    this.props.modifyPomodoro(rowData.pomodoros - tempPomodoro, rowData.estimatedPomodoro - tempEstimate)
  }

  componentDidMount = async() => {
    var rowData = this.props.data;
    const subTasks = await this.sortedSubTasks()
    const mainTask = await API.graphql(graphqlOperation(queries.getTask, { id: rowData.id }));
    this.setState({subTasks: subTasks, mainTask: mainTask.data.getTask, description: mainTask.data.getTask.description })
  }

  sortedSubTasks = async() => {
    var rowData = this.props.data;
    var unsortedSubTasks = await API.graphql(graphqlOperation(queries.listTasks, { filter: { parentTaskId: { eq: rowData.id }}, limit: 999999999}));
    unsortedSubTasks.data.listTasks.items.sort((a,b) => {
      if (a.state === "completed" && b.state !== "completed") {
        return 1;
      } if (a.state !== "completed" && b.state === "completed") {
        return -1;
      }
      return 0;
    })

    return unsortedSubTasks;
  }

  componentDidUpdate = async() => {
    if (this.state.DeleteTask != null) {
      const deleteTaskId = this.state.DeleteTask.id
      const child_tasks = await API.graphql(graphqlOperation(queries.listTasks, {filter: {parentTaskId: {eq: deleteTaskId}}, limit: 999999999}));
      await child_tasks.data.listTasks.items.map(task => {
        return this.subTaskDelete(task)
      })
      this.setPomodoro(this.state.DeleteTask.estimatedPomodoro * -1, this.state.DeleteTask.pomodoros * -1)
      const deleteTask = await API.graphql(graphqlOperation(mutations.deleteTask, {input: {id: deleteTaskId }}));
      await this.refreshAllTasks()
      this.setState({DeleteTask: null})
    }
    if (this.state.CompleteTask != null) {
      var updatedTask =  this.state.CompleteTask;
      if (updatedTask.state === 'completed') {
        updatedTask.state = null
        let {tableData, owner, ...graphqlUpdatedTask} = updatedTask;
        const completeTask = await API.graphql(graphqlOperation(mutations.updateTask, {input: graphqlUpdatedTask}));
        await this.refreshAllTasks()
      } else {
        this.completeSubTasks(updatedTask)
      }
    }
  }

  completeSubTasks = async (mainTask) => {
    const child_tasks = await API.graphql(graphqlOperation(queries.listTasks, {filter: {parentTaskId: {eq: mainTask.id}}, limit: 999999999}));
    const child_task_data = child_tasks.data.listTasks.items
    mainTask.pomodoros = mainTask.estimatedPomodoro
    mainTask.state = 'completed'
    let {tableData, owner, ...graphqlUpdatedTask} = mainTask;

    const completeTask = await API.graphql(graphqlOperation(mutations.updateTask, {input: graphqlUpdatedTask}));
    await Promise.all(child_task_data.map(subtask => {
      return this.completeSubTasks(subtask)
    }))
    await this.refreshAllTasks()

  }

  refreshAllTasks = async () => {
    const subTasks = await this.sortedSubTasks()
    var resetEditArray = []
    for (var i = 0; i < subTasks.data.listTasks.items.length; ++i) { resetEditArray.push(false) }
    this.setState({subTasks: subTasks, nameEditMode: resetEditArray, CompleteTask: null})
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

  handleChange = (event) => {
    this.setState({[event.target.name]: event.target.value});
  }

  createTask = async () => {
    console.log('A name was submitted: ' + this.state.newItem);
    console.log('maintask was submitted: ' + JSON.stringify(this.state.mainTask));
    var randomColor = require('randomcolor')
    var color = randomColor({hue: this.state.mainTask.color, alpha: 0.01});

    const todoDetails = {
      name: this.state.newItem,
      description: 'creating a subtask',
      color: color,
      pomodoros: 0,
      estimatedPomodoro: this.state.newEstimatedPomodoro,
      state: 'new',
      deadline: 'none',
      parentTaskId: this.props.data.id
    };
    if (this.state.newItem && this.state.newEstimatedPomodoro) {
      const newTask = await API.graphql(graphqlOperation(mutations.createTask, {input: todoDetails}));
      const subTasks = await this.sortedSubTasks()
      var tempVar = this.props.data;
      tempVar.estimatedPomodoro = (parseInt(tempVar.estimatedPomodoro) + parseInt(this.state.newEstimatedPomodoro)).toString()
      this.setState({subTasks: subTasks, error: '', showSubTasks: !this.state.showSubTasks, newItem: ''})
      this.props.setPomodoro(this.state.newEstimatedPomodoro,0)
    } else {
      this.setState({error: 'Please ensure you fill out all fields'})
    }
  }

  ifErrorPresent = () => {
    if (this.state.error === "") {
      return (<div />)
    } else {
      return (
        <Col xs lg="6">
          <Alert variant={'danger'}>
            { this.state.error }
          </Alert>
        </Col>
      )
    }
  }

  editTaskName = (rowData) => {
    var tempNameEditArray = this.state.nameEditMode;
    var tempCurrentEdit = this.state.currentEdit;
    for (var i = 0; i < this.state.subTasks.data.listTasks.items.length; ++i) {
      if (this.state.subTasks.data.listTasks.items[i].id === rowData.id) {
        tempNameEditArray[i] = true
        tempCurrentEdit = rowData.id;
      }
    }
    this.setState({nameEditMode: tempNameEditArray, tempItemName: rowData.name, currentEdit: tempCurrentEdit})
  }

  updateTaskName = async (rowData) => {
    var currentTask = rowData;
    currentTask.name = this.state.tempItemName
    let {tableData, owner, ...graphqlUpdatedTask} = currentTask;
    await API.graphql(graphqlOperation(mutations.updateTask, {input: graphqlUpdatedTask}));
    await this.refreshAllTasks()
  }

  rowNameDisplay = (rowData, element) => {
    if (rowData.state==="completed" || !this.props.allowEdit)  {
      return (<div className="strikethrough">{rowData.name}</div>);
    }
    else if (this.state.nameEditMode[element] === true && rowData.id===this.state.currentEdit && this.props.allowEdit && rowData.state!=="completed") {
      return (<Row>
                <Col xs="8" className="edit-mode">
                  <input type="text" style={{ width:"100%" }} value={this.state.tempItemName} name="tempItemName" placeholder={this.state.tempItemName} onChange={this.handleChange} />
                </Col>
                <Col xs="4" className="edit-mode">
                  <Button className="button-prettify" onClick={() => this.updateTaskName(rowData)}>rename</Button>
                </Col>
              </Row>)

    } else {
      return (<button className="unbutton" onClick={(e) => this.editTaskName(rowData)}>{rowData.name}</button>);
    }
  }

  materialTable = () => {
    var rowData = this.props.data;
    var taskArrayData = this.state.subTasks.data;
    if (this.state.subTasks.data.listTasks.items.length!==0){
      return (
        <MaterialTable
          columns={[
           { title: 'Subtask', field: 'name', render: rowData => {
             var element = 0;
             const elements = taskArrayData.listTasks.items.map((x) => x.id);
             if (elements.forEach((x,i) => {
               if (x === rowData.id){
                 element = i
               }
             }));
             var greyout = "";
             if (rowData.state === 'completed' || !this.props.allowEdit) { greyout="greyout"; }
             return (<div className={greyout}>
                       {this.rowNameDisplay(rowData, element)}
                     </div>
                   );
           }},
           { title: 'Time Spent', field: 'pomodoros', render: rowData => {
             const pomodoroRatio = rowData.pomodoros + "/" + rowData.estimatedPomodoro;
             return (<div>{pomodoroRatio}</div>);
           }},
           { title: 'Deadline', field: 'deadline'},
         ]}
         title={rowData.name + " - Subtasks"}
         data={ this.state.subTasks.data.listTasks.items }
         options={{
           toolbar: false,
           paging: false
         }}
         actions={[
           rowData => ({
             icon: (rowData.state == 'completed' ? 'undo' : 'done'),
             tooltip: (rowData.state == 'completed' ? 'Mark Not Done' : 'Mark Done'),
             onClick: (event, rows) => {
               this.setState({CompleteTask: rows})
             },
           }),
           {
             icon: 'delete',
             tooltip: 'Delete',
             onClick: (event, rows) => {
               this.setState({DeleteTask: rows})
             },
           },
         ]}
         detailPanel={rowData => {
           return (
             <Subtask
               data={rowData}
               allowEdit={this.props.allowEdit}
               setPomodoro={this.setPomodoro}
               modifyPomodoro={this.modifyPomodoro}>
             </Subtask>
           )
         }}
         root={{backgroundColor: 'red'}}
         />
      )
    }
  }

  ifShowSubTasks = () => {
    var subTasksDescription = this.props.data.name + " Subtask Description";
    if (this.state.showSubTasks === false) {
      return (<div />)
    } else {
      return (
        <Row>
          <Col xs lg="4">
            <input className="button-padding" type="text" style={{ width:"100%" }} value={this.state.newItem} name="newItem" placeholder={subTasksDescription} onChange={this.handleChange} />
          </Col>
          <Col xs lg="4">
            <input className="button-padding" type="number" style={{ width:"100%" }} value={this.state.newEstimatedPomodoro} name="newEstimatedPomodoro" placeholder={'Time Interval Estimate'} onChange={this.handleChange} />
          </Col>
          <Col xs lg="4">
            <Button variant="success" className="button-prettify button-padding" onClick={this.createTask}>Add subtask</Button>
          </Col>
          { this.ifErrorPresent() }
        </Row>
      )
    }
  }

  description = () => {
    var rowData = this.state.mainTask
    if (this.state.editDescription === false) {
      return (
        <Row>
          <Col xs="1" style={{ textAlign: 'right' }}>
            <button className="unbutton" onClick={ this.editDescription }><FontAwesomeIcon icon="edit" style={{ fontSize: '1.4em'}}/></button>
          </Col>
          <Col xs="11" style={{ padding: '0 0 7px 0' }}><FroalaEditorView model={rowData.description} /></Col>
        </Row>
      )
    } else {
      return (
       <Row>
         <Col xs="1" style={{ textAlign: 'right' }}>
          <button className="unbutton" onClick={ this.updateDescription }><FontAwesomeIcon icon="check" style={{ fontSize: '1.4em'}}/></button>
         </Col>
         <Col xs="11" >
            <FroalaEditorComponent
              tag='textarea'
              model={this.state.description}
              onModelChange={this.handleDesciptionChange}
            />
         </Col>
       </Row>
      )
    }
  }

  handleDesciptionChange = (description) => {
    this.setState({description: description })
  }

  editDescription = () => {
    this.setState({editDescription: !this.state.editDescription});
  }

  updateDescription = async () => {
    const main_task = this.state.mainTask
    main_task.description = this.state.description
    let {tableData, owner, ...graphqlUpdatedTask} = main_task;
    await API.graphql(graphqlOperation(mutations.updateTask, {input: graphqlUpdatedTask}));
    this.setState({editDescription: !this.state.editDescription, mainTask: graphqlUpdatedTask});
  }

  showSubTasks = () => {
    this.setState({showSubTasks: !this.state.showSubTasks});
  }

  render() {
    var rowData = this.props.data
    const taskArrayData = this.state.subTasks.data;
    if (taskArrayData === undefined) {
      return (<div/>)
    } else {
      return (
        <div>
          <Container fluid="false" style={{ backgroundColor: this.props.data.color, paddingBottom: '25px' }}>
            <Row className="pt1">
              <Col xs sm="2" xl="1">
                <Pomodoro allowEdit={this.props.allowEdit} row={rowData} subTasks={this.state.subTasks} modifyPomodoro={this.modifyPomodoro} addPomodoro={this.addPomodoro} subtractPomodoro={this.subtractPomodoro} addPomodoroEstimate={this.addPomodoroEstimate} subtractPomodoroEstimate={this.subtractPomodoroEstimate} />
              </Col>
              <Col xs sm="10" xl="11">
                { this.description() }
              </Col>
            </Row>
           <Row className="mt1 pb1">
             <Col xs="12">
               { this.materialTable() }
             </Col>
           </Row>
           <Row>
             <Col xs="2" style={{ paddingTop: '9px'}}>
               { this.props.allowEdit ? <Button className="button-prettify" onClick={ this.showSubTasks }>{ this.state.showSubTasks ? "Cancel Add" : "Add Subtask"}</Button> : null}
             </Col>
             <Col xs="10" className="reduced-padding-bottom">
               { this.ifShowSubTasks() }
             </Col>
           </Row>
         </Container>
        </div>
      )
    }
  }
}

export default Subtask;
