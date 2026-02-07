import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, FileText, Plus } from 'lucide-react';
import { useTopics } from '../hooks/useTopics';
import { useDropdownAutoClose } from '../hooks/useDropdownAutoClose';

export const TopicsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    userTopics, 
    friendTopics, 
    userTopicsLoading, 
    friendTopicsLoading,
    userTopicsError,
    friendTopicsError
  } = useTopics();
  
  const toggleDropdown = () => setIsOpen(!isOpen);

  useDropdownAutoClose(containerRef, isOpen, () => setIsOpen(false));

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-1 text-sm font-bold hover:bg-black/5 
        px-3 py-1 border-2 border-transparent hover:border-black transition-all"
      >
        <span>Topics</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      
      {isOpen && (
        <div
          className={
            "absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 py-2 " +
            "border border-gray-200"
          }
          style={{ marginRight: '0.5rem' }}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="px-2 py-2 border-b border-gray-200">
            <Link
              to="/topics/new"
              className={
                "block px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded " +
                "flex items-center"
              }
              onClick={() => setIsOpen(false)}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>New Topic</span>
            </Link>
          </div>

          <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium text-sm">Your Topics</h3>
            <div />
          </div>
          
          {userTopicsLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : userTopicsError ? (
            <div className="px-4 py-2 text-sm text-red-500">{userTopicsError}</div>
          ) : userTopics.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {userTopics.slice(0, 5).map(topic => (
                <Link
                  key={topic.id}
                  to={`/topics/${topic.id}`}
                  className={
                    "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 " +
                    "flex items-center"
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="truncate">{topic.title}</span>
                </Link>
              ))}
              {userTopics.length > 5 && (
                <Link
                  to="/topics"
                  className={
                    "block px-4 py-2 text-xs text-blue-600 hover:bg-gray-100 text-center"
                  }
                  onClick={() => setIsOpen(false)}
                >
                  View all ({userTopics.length})
                </Link>
              )}
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No topics yet</div>
          )}
          
          <div className="px-4 py-2 border-t border-b border-gray-200">
            <h3 className="font-medium text-sm">Friend Topics</h3>
          </div>
          
          {friendTopicsLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : friendTopicsError ? (
            <div className="px-4 py-2 text-sm text-red-500">{friendTopicsError}</div>
          ) : friendTopics.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {friendTopics.slice(0, 5).map(topic => (
                <Link
                  key={topic.id}
                  to={`/topics/${topic.id}`}
                  className={
                    "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 " +
                    "flex items-center"
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="truncate">{topic.title}</span>
                </Link>
              ))}
              {friendTopics.length > 5 && (
                <Link
                  to="/friend-topics"
                  className={
                    "block px-4 py-2 text-xs text-blue-600 hover:bg-gray-100 text-center"
                  }
                  onClick={() => setIsOpen(false)}
                >
                  View all ({friendTopics.length})
                </Link>
              )}
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No friend topics yet</div>
          )}
        </div>
      )}

    </div>
  );
};

export default TopicsDropdown;
