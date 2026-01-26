import React, { useState, useMemo } from 'react';
import { getMonthsInYear, getYearsFromTickets, formatPeriodLabel } from '../utils/periodUtils';

const PeriodNavigation = ({ 
  tickets, 
  currentPeriod, 
  periodType, 
  onPeriodSelect,
  onBacklogClick 
}) => {
  const [expandedYears, setExpandedYears] = useState(new Set());
  const [expandedMonths, setExpandedMonths] = useState(new Set());

  // Get unique years from tickets
  const years = useMemo(() => {
    const ticketYears = getYearsFromTickets(tickets);
    const currentYear = new Date().getFullYear();
    // Always include current year and a few future/past years
    const allYears = new Set([...ticketYears, currentYear, currentYear - 1, currentYear + 1]);
    return Array.from(allYears).sort((a, b) => b - a);
  }, [tickets]);

  const toggleYear = (year) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  const toggleMonth = (year, month) => {
    const key = `${year}-${month}`;
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedMonths(newExpanded);
  };

  const isYearExpanded = (year) => expandedYears.has(year);
  const isMonthExpanded = (year, month) => expandedMonths.has(`${year}-${month}`);

  const handlePeriodClick = (date) => {
    onPeriodSelect(date);
  };

  const getMonthsForYear = (year) => {
    return getMonthsInYear(year);
  };

  const isCurrentPeriod = (date) => {
    if (!currentPeriod) return false;
    const current = new Date(currentPeriod);
    const check = new Date(date);
    return current.getFullYear() === check.getFullYear() && 
           current.getMonth() === check.getMonth();
  };

  return (
    <div className="w-56 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-2 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm mb-1">Navigation</h3>
        <button
          onClick={onBacklogClick}
          className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 transition text-gray-700 text-sm font-medium"
        >
          📋 Backlog
        </button>
      </div>

      <div className="p-2">
        {periodType === 'monthly' && (
          <div className="space-y-1">
            {years.map(year => {
              const months = getMonthsForYear(year);
              const yearExpanded = isYearExpanded(year);
              
              return (
                <div key={year} className="mb-1">
                  <button
                    onClick={() => toggleYear(year)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 transition flex items-center justify-between text-gray-700 text-sm font-medium"
                  >
                    <span>{year}</span>
                    <span className="text-gray-400 text-xs">
                      {yearExpanded ? '▼' : '▶'}
                    </span>
                  </button>
                  
                  {yearExpanded && (
                    <div className="ml-2 mt-0.5 space-y-0.5">
                      {months.map(month => {
                        const monthDate = new Date(year, month.monthIndex, 1);
                        const isCurrent = isCurrentPeriod(monthDate);
                        
                        return (
                          <button
                            key={month.monthIndex}
                            onClick={() => handlePeriodClick(monthDate)}
                            className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 transition text-xs ${
                              isCurrent 
                                ? 'bg-primary-100 text-primary-700 font-medium' 
                                : 'text-gray-900/60'
                            }`}
                          >
                            {month.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {periodType === 'quarterly' && (
          <div className="space-y-1">
            {years.map(year => {
              const yearExpanded = isYearExpanded(year);
              const quarters = [
                { num: 1, start: new Date(year, 0, 1) },
                { num: 2, start: new Date(year, 3, 1) },
                { num: 3, start: new Date(year, 6, 1) },
                { num: 4, start: new Date(year, 9, 1) }
              ];
              
              return (
                <div key={year} className="mb-1">
                  <button
                    onClick={() => toggleYear(year)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 transition flex items-center justify-between text-gray-700 text-sm font-medium"
                  >
                    <span>{year}</span>
                    <span className="text-gray-400 text-xs">
                      {yearExpanded ? '▼' : '▶'}
                    </span>
                  </button>
                  
                  {yearExpanded && (
                    <div className="ml-2 mt-0.5 space-y-0.5">
                      {quarters.map(quarter => {
                        const isCurrent = isCurrentPeriod(quarter.start);
                        return (
                          <button
                            key={quarter.num}
                            onClick={() => handlePeriodClick(quarter.start)}
                            className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 transition text-xs ${
                              isCurrent 
                                ? 'bg-primary-100 text-primary-700 font-medium' 
                                : 'text-gray-900/60'
                            }`}
                          >
                            Q{quarter.num}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {periodType === 'weekly' && (
          <div className="space-y-1">
            <p className="text-xs text-gray-500 px-3 py-2">
              Weekly navigation coming soon. Use month view for now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeriodNavigation;
