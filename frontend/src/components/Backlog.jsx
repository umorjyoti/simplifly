import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { formatHoursDisplay } from '../utils/timeUtils';

const Backlog = ({ tickets, onTicketClick, onMoveToPeriod, workspaceId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter backlog tickets (tickets without goLiveDate)
  const backlogTickets = tickets.filter(ticket => !ticket.goLiveDate);

  // Apply search and status filters
  const filteredTickets = backlogTickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const ticket = backlogTickets.find(t => t._id === draggableId);

    if (ticket && destination.droppableId === 'backlog') {
      // Reordering within backlog - could implement if needed
      return;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-amber-100 text-amber-700';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-brand-dark">Backlog</h2>
            <span className="text-xs sm:text-sm text-brand-dark/60 mt-1">
            {filteredTickets.length} {filteredTickets.length === 1 ? 'item' : 'items'}
          </span>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input
            type="text"
            placeholder="Search backlog..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-none border border-gray-300 bg-transparent text-brand-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm shadow-none"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-none border border-gray-300 bg-transparent text-brand-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm shadow-none"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Backlog List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="backlog">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 overflow-y-auto p-4 bg-gray-50 ${
                snapshot.isDraggingOver ? 'bg-gray-100' : ''
              }`}
            >
              {filteredTickets.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'No tickets match your filters'
                    : 'No items in backlog. Create tickets without a go-live date to add them here.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTickets.map((ticket, index) => (
                    <Draggable key={ticket._id} draggableId={ticket._id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onTicketClick(ticket)}
                          className={`bg-transparent rounded-none shadow-none border border-gray-200 p-4 cursor-pointer hover:shadow-none hover:border-gray-300 transition-all duration-200 ${
                            snapshot.isDragging ? 'opacity-60 rotate-2 scale-105 shadow-xl' : ''
                          } border-l-4 ${
                            ticket.status === 'todo' ? 'border-blue-500' :
                            ticket.status === 'in-progress' ? 'border-amber-500' :
                            'border-emerald-500'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {ticket.ticketNumber && (
                                  <span className="text-xs font-mono text-brand-dark/60 bg-gray-100 px-2 py-0.5 rounded-none font-semibold">
                                    {ticket.ticketNumber}
                                  </span>
                                )}
                                <div className="font-semibold text-brand-dark line-clamp-2 flex-1 text-sm">
                                  {ticket.title}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded-none font-medium ${
                                  ticket.type === 'story' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {ticket.type === 'story' ? 'Story' : 'Subtask'}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-none font-medium ${getStatusColor(ticket.status)}`}>
                                  {ticket.status === 'todo' ? 'To Do' :
                                   ticket.status === 'in-progress' ? 'In Progress' :
                                   'Completed'}
                                </span>
                              </div>
                            </div>
                          </div>
                          {ticket.description && (
                            <div className="text-xs text-brand-dark/60 mb-3 line-clamp-2 leading-relaxed">
                              {ticket.description}
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-brand-dark flex items-center justify-center text-white text-xs font-semibold">
                                {(ticket.assignee?.name || ticket.assignee?.username || '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs text-brand-dark/60 font-medium">
                                {ticket.assignee?.name || ticket.assignee?.username}
                              </span>
                            </div>
                            {ticket.hoursWorked > 0 && (
                              <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-none text-xs font-semibold">
                                {formatHoursDisplay(ticket.hoursWorked)}
                              </span>
                            )}
                          </div>
                          {onMoveToPeriod && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveToPeriod(ticket);
                              }}
                              className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                              Move to period →
                            </button>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Backlog;
