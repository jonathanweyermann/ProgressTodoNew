import React, { Component } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import * as mutations from '../graphql/mutations';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import './pomodoro.css'

class Pomodoro extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTask: this.props.row,
      totalCurrentPomodoro: 0,
      totalEstimatedPomodoro: 0
    };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({newItem: event.target.value});
  }

  componentDidMount = async() => {
    const child_tasks = this.props.subTasks
    var currentTask = this.props.row;
    if (this.totalEstimatedPomodoro(child_tasks)>0) {
      currentTask.pomodoros = this.totalCurrentPomodoro(child_tasks).toString()
      currentTask.estimatedPomodoro = this.totalEstimatedPomodoro(child_tasks).toString()
      let {tableData, owner, ...graphqlUpdatedTask} = currentTask;
      await API.graphql(graphqlOperation(mutations.updateTask, {input: graphqlUpdatedTask}));
    }
    this.setState({currentTask: this.props.row, totalCurrentPomodoro: this.totalCurrentPomodoro(child_tasks), totalEstimatedPomodoro: this.totalEstimatedPomodoro(child_tasks)})
  }

  totalCurrentPomodoro = (child_tasks) => {
    const reducer = (accumulator, currentValue) => parseInt(accumulator) + parseInt(currentValue);
    var tempPomodoros = this.props.row.pomodoros;
    var tempArrayPomodoros = child_tasks.data.listTasks.items.map(x => x.pomodoros)
    if (tempArrayPomodoros.length > 0) {
      tempPomodoros = (parseInt(tempArrayPomodoros.reduce(reducer)))
    }
    return tempPomodoros;
  }

  totalEstimatedPomodoro = (child_tasks) => {
    const reducer = (accumulator, currentValue) => parseInt(accumulator) + parseInt(currentValue);
    var tempPomodoros = this.props.row.estimatedPomodoro;
    var tempArrayPomodoros = child_tasks.data.listTasks.items.map(x => x.estimatedPomodoro)
    if (tempArrayPomodoros.length > 0) {
      tempPomodoros = (parseInt(tempArrayPomodoros.reduce(reducer)))
    }
    return tempPomodoros;
  }

  componentDidUpdate = async() => {
    var updatedTask =  this.state.currentTask;
    const child_tasks = this.props.subTasks
    if (this.state.totalCurrentPomodoro !== this.totalCurrentPomodoro(child_tasks) || this.state.totalEstimatedPomodoro !== this.totalEstimatedPomodoro(child_tasks)) {
      updatedTask.pomodoros = this.totalCurrentPomodoro(child_tasks).toString()
      updatedTask.estimatedPomodoro = this.totalEstimatedPomodoro(child_tasks).toString()
      let {tableData, owner, ...graphqlUpdatedTask} = updatedTask;
      await API.graphql(graphqlOperation(mutations.updateTask, {input: graphqlUpdatedTask}));
      this.setState({currentTask: this.props.row, totalCurrentPomodoro: this.totalCurrentPomodoro(child_tasks), totalEstimatedPomodoro: this.totalEstimatedPomodoro(child_tasks)})
    }
  }

  pomoCompletedButtons = () => {
    if (this.props.allowEdit) {
      return (
        <React.Fragment>
          <button className="button-prettify" onClick={() => this.props.modifyPomodoro(-1,0)}>-</button>
          <button className="button-prettify" onClick={() => this.props.modifyPomodoro(1,0)}>+</button>
        </React.Fragment>
      )
    }
  }

  pomoEstimatedButtons = () => {
    if (this.props.allowEdit) {
      return (
        <React.Fragment>
          <button className="button-prettify" onClick={() => this.props.modifyPomodoro(0,-1)}>-</button>
          <button className="button-prettify" onClick={() => this.props.modifyPomodoro(0,1)}>+</button>
        </React.Fragment>
      )
    }
  }

  unitSummation = () => {
    const rowData = this.props.row
    if (this.props.subTasks.data && this.props.subTasks.data.listTasks.items.length > 0) {
      return (
        <div>
          Total Units: {this.state.totalCurrentPomodoro}/{this.state.totalEstimatedPomodoro}
        </div>
      )
    } else {
      return (
        <Row>
          <Col xs="12" className="smallfont">
           Completed / Total
          </Col>
          <Col xs="6" className="no-right-padding" >
            <Col xs="12" className="no-padding bigfont">
            { rowData.pomodoros } <div className="float-right">/</div>
            </Col>
            <Col xs="12" className="no-padding align-center">
              { this.pomoCompletedButtons() }
            </Col>
          </Col>
          <Col xs="6" className="no-padding">
            <Col xs="12" className="no-padding bigfont">
              { rowData.estimatedPomodoro }
            </Col>
            <Col xs="12" className="no-padding align-center">
              { this.pomoEstimatedButtons() }
            </Col>
          </Col>
        </Row>
      )
    }
  }

  render () {
    return (
      <div>
        { this.unitSummation() }
      </div>
    )
  }

}

export default Pomodoro;
