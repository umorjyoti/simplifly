import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { formatHoursDisplay } from '../utils/timeUtils';

const TicketBoard = ({ tickets, onStatusChange, onTicketClick, workspaceId: propWorkspaceId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const workspaceId = propWorkspaceId || params.id || params.workspaceId;
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
      case 'todo': 
        return {
          header: 'bg-white border-2 border-brand-dark',
          body: 'bg-blue-50/30',
          accent: 'text-brand-dark',
          badge: 'bg-brand-dark text-white'
        };
      case 'in-progress': 
        return {
          header: 'bg-brand-accent border-2 border-brand-accent',
          body: 'bg-amber-50/30',
          accent: 'text-white',
          badge: 'bg-white text-brand-accent'
        };
      case 'completed': 
        return {
          header: 'bg-brand-dark border-2 border-brand-dark',
          body: 'bg-emerald-50/30',
          accent: 'text-white',
          badge: 'bg-white text-brand-dark'
        };
      default: 
        return {
          header: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200',
          body: 'bg-gray-50/30',
          accent: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-700'
        };
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => {
          const columnTickets = getTicketsByStatus(column.status);
          const colors = getStatusColor(column.status);
          
          return (
            <div key={column.id} className="flex flex-col min-h-[200px]">
              <div className={`${colors.header} px-6 py-4 rounded-none border-b-4 flex-shrink-0 shadow-none`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-black ${colors.accent} text-xs uppercase tracking-[0.3em]`}>
                    {column.title}
                </h3>
                  <span className={`${colors.badge} px-2.5 py-0.5 rounded-none text-xs font-semibold`}>
                    {columnTickets.length}
                  </span>
                </div>
              </div>
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-3 rounded-none ${colors.body} ${
                      snapshot.isDraggingOver ? 'ring-2 ring-primary-400 ring-opacity-50' : ''
                    } transition-all`}
                  >
                    {columnTickets.length === 0 ? (
                      <div className="text-center text-gray-400 py-8 text-xs uppercase tracking-[0.3em]">
                        <div className="opacity-50">No tickets</div>
                      </div>
                    ) : (
                      columnTickets.map((ticket, index) => (
                        <Draggable key={ticket._id} draggableId={ticket._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={(e) => {
                                // Allow opening in full-screen view
                                if (e.ctrlKey || e.metaKey) {
                                  navigate(`/workspace/${workspaceId}/ticket/${ticket._id}`);
                                } else {
                                  onTicketClick(ticket);
                                }
                              }}
                              className={`bg-white rounded-none shadow-none border border-gray-200 p-3 mb-3 cursor-pointer hover:shadow-none hover:border-gray-300 transition-all duration-200 ${
                                snapshot.isDragging ? 'opacity-60 rotate-2 scale-105 shadow-xl' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    {ticket.ticketNumber && (
                                      <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-none flex-shrink-0 font-semibold">
                                        {ticket.ticketNumber}
                                      </span>
                                    )}
                                    <div className="font-semibold text-gray-900 line-clamp-2 text-xs uppercase tracking-[0.3em] flex-1 min-w-0 leading-tight">
                                      {ticket.title}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-none font-medium ${
                                      ticket.type === 'story' 
                                        ? 'bg-brand-dark text-white' 
                                        : 'bg-purple-100 text-purple-700'
                                    }`}>
                                      {ticket.type === 'story' ? 'Story' : 'Subtask'}
                                    </span>
                                    {ticket.parentTicket && (
                                      <span className="text-xs text-gray-500 truncate">
                                        of {ticket.parentTicket.title}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {ticket.description && (
                                <div className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                                  {ticket.description}
                                </div>
                              )}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-none bg-brand-dark flex items-center justify-center text-white text-xs font-semibold">
                                    {(ticket.assignee?.name || ticket.assignee?.username || '?').charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs text-gray-600 font-medium truncate max-w-[100px]">
                                    {ticket.assignee?.name || ticket.assignee?.username}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                {ticket.hoursWorked > 0 && (
                                    <span className="bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-none text-xs font-semibold flex-shrink-0">
                                    {formatHoursDisplay(ticket.hoursWorked)}
                                  </span>
                                )}
                                </div>
                              </div>
                              {ticket.goLiveDate && (
                                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
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
