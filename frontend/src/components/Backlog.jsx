import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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
      case 'todo': return 'bg-blue-100 border-blue-300';
      case 'in-progress': return 'bg-yellow-100 border-yellow-300';
      case 'completed': return 'bg-green-100 border-green-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-4 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Backlog</h2>
          <span className="text-sm text-gray-300">
            {filteredTickets.length} {filteredTickets.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        
        {/* Search and Filter */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search backlog..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <div className="text-center text-gray-500 py-12">
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
                          className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition ${
                            snapshot.isDragging ? 'opacity-50 shadow-xl' : ''
                          } border-l-4 ${
                            ticket.status === 'todo' ? 'border-blue-500' :
                            ticket.status === 'in-progress' ? 'border-yellow-500' :
                            'border-green-500'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {ticket.ticketNumber && (
                                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                    {ticket.ticketNumber}
                                  </span>
                                )}
                                <div className="font-semibold text-gray-900 line-clamp-2 flex-1">
                                  {ticket.title}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  ticket.type === 'story' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {ticket.type === 'story' ? 'Story' : 'Subtask'}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(ticket.status)}`}>
                                  {ticket.status === 'todo' ? 'To Do' :
                                   ticket.status === 'in-progress' ? 'In Progress' :
                                   'Completed'}
                                </span>
                              </div>
                            </div>
                          </div>
                          {ticket.description && (
                            <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {ticket.description}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                            <span>{ticket.assignee?.name || ticket.assignee?.username}</span>
                            {ticket.hoursWorked > 0 && (
                              <span className="bg-gray-200 px-2 py-1 rounded">
                                {ticket.hoursWorked}h
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
