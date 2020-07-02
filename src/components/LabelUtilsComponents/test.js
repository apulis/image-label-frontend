import React from 'react';

export default class Test extends React.Component {
    constructor(props) {
      super(props);
      this.state = {value: '',labelType:'bbox'};
  
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }
  
    handleChange(event) {
        const target = event.target;
        this.setState({[target.name]: target.value});
    }
  
    handleSubmit(event) {
        this.props.onAddLabel(parseInt(this.state.value),this.state.labelType)
        event.preventDefault();
    }
  
    render() {
      return (
        <form onSubmit={this.handleSubmit} style={{bottom:0,position:"absolute",left:'300px'}}>
          <label>
            Label Name:
            <input type="text" name="value" value={this.state.value} onChange={this.handleChange} />
          </label>
          <label>
            label Type:
            <select name="labelType" value={this.state.labelType} onChange={this.handleChange}>
                <option value="bbox">bbox</option>
                <option value="polygon">polygon</option>
            </select>
            </label>
          <input type="submit" value="Submit" />
        </form>
      );
    }
  }