import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const TicketBoard = ({ tickets, onStatusChange, onTicketClick }) => {
  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo' },
    { id: 'in-progress', title: 'In Progress', status: 'in-progress' },
    { id: 'completed', title: 'Completed', status: 'completed' }
  ];

  const getTicketsByStatus = (status) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    const ticket = tickets.find(t => t._id === draggableId);

    if (ticket && ticket.status !== newStatus) {
      // If moving to completed, check if hours are set
      if (newStatus === 'completed' && (!ticket.hoursWorked || ticket.hoursWorked === 0)) {
        onStatusChange(ticket._id, newStatus, true); // true = show hours modal
      } else {
        onStatusChange(ticket._id, newStatus, false);
      }
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
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4 h-full">
        {columns.map((column) => {
          const columnTickets = getTicketsByStatus(column.status);
          
          return (
            <div key={column.id} className="flex flex-col h-full">
              <div className={`${getStatusColor(column.status)} px-4 py-3 rounded-t-lg border-2`}>
                <h3 className="font-semibold text-gray-800">
                  {column.title} ({columnTickets.length})
                </h3>
              </div>
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 rounded-b-lg border-2 border-t-0 ${
                      getStatusColor(column.status)
                    } ${snapshot.isDraggingOver ? 'bg-opacity-80' : ''} min-h-[500px] overflow-y-auto`}
                  >
                    {columnTickets.length === 0 ? (
                      <div className="text-center text-gray-500 py-8 text-sm">
                        No tickets
                      </div>
                    ) : (
                      columnTickets.map((ticket, index) => (
                        <Draggable key={ticket._id} draggableId={ticket._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => onTicketClick(ticket)}
                              className={`bg-white rounded-lg shadow-md p-4 mb-3 cursor-pointer hover:shadow-lg transition ${
                                snapshot.isDragging ? 'opacity-50' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                    {ticket.title}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      ticket.type === 'story' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-purple-100 text-purple-800'
                                    }`}>
                                      {ticket.type === 'story' ? 'Story' : 'Subtask'}
                                    </span>
                                    {ticket.parentTicket && (
                                      <span className="text-xs text-gray-400">
                                        of {ticket.parentTicket.title}
                                      </span>
                                    )}
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
                              {ticket.goLiveDate && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Due: {new Date(ticket.goLiveDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default TicketBoard;
