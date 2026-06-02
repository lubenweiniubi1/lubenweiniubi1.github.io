import React from 'react';
import { useRef } from 'react';
import { Component } from 'react';
import { forwardRef } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';

class Mouse extends Component {
  state = { x: 0, y: 0 };

  handleMouseMove = (event) => {
    this.setState({
      x: event.clientX,
      y: event.clientY,
    });
  };

  componentDidMount() {
    const dx = document.getElementById('ab')
    const kes = Object.keys(dx);
    console.log(dx[kes[0]]);
    
    
  }

  render() {
    return (
      <div id='ab' style={{ height: '100vh' }} onMouseMove={this.handleMouseMove}>
       { this.props.render(this.state)}
      </div>
    );
  }
}

export default function () {
  return (
    <Mouse
      render={(mouse) => (
        <h1>
          鼠标在 ({mouse.x}, {mouse.y})
        </h1>
      )}
    />
  );
}
