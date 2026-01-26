import React from 'react';

const UserAvatar = ({ user, isActive = false, onClick }) => {
  // Get initials from name or username
  const getInitials = (user) => {
    if (user?.name) {
      const names = user.name.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  // Generate color based on user ID for consistent colors
  const getColor = (userId) => {
    if (!userId) return 'bg-gray-400';
    
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ];
    
    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const displayName = user?.name || user?.username || 'Unknown User';
  const initials = getInitials(user);
  const bgColor = getColor(user?._id || user?.id);

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`
          relative w-10 h-10 rounded-full ${bgColor} text-white font-semibold
          flex items-center justify-center text-sm
          transition-all duration-200
          ${isActive 
            ? 'ring-2 ring-primary-600 ring-offset-2 scale-110' 
            : 'hover:scale-110 hover:ring-2 hover:ring-gray-300 hover:ring-offset-2'
          }
          cursor-pointer
        `}
        aria-label={`Filter by ${displayName}`}
      >
        {initials}
      </button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {displayName}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
};

export default UserAvatar;
