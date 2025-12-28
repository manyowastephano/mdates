import React, { useState } from 'react';
import './styles/Filters.css'
const Filters = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'online', label: 'Online Now' },
    { id: 'near', label: 'Near Me' },
    { id: 'new', label: 'New' },
    { id: 'recommended', label: 'Recommended' }
  ];

  const handleFilterClick = (filterId) => {
    if (onFilterChange) {
      onFilterChange(filterId);
    }
  };
  return (
    <div className="filters">
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`filter ${activeFilter === filter.id ? 'active' : ''}`}
          data-filter={filter.id}
          onClick={() => handleFilterClick(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default Filters;