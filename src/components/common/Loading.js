import React from 'react';
import './Common.css'; 
const Loading = ({ message = 'Loading...', fullScreen = true }) => {
  if (fullScreen) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>{message}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="loading-inline">
      <div className="spinner"></div>
      <span>{message}</span>
    </div>
  );
};
export default Loading;