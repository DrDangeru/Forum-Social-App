import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Plus, Users } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import type { Group } from '../types';
import { useDropdownAutoClose } from '../hooks/useDropdownAutoClose';

export const GroupsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { user } = useAuth();

  useDropdownAutoClose(containerRef, isOpen, () => setIsOpen(false));

  const fetchMyGroups = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await axios.get(`/api/groups/my/${user.userId}`);
      setMyGroups(res.data);
    } catch (error: any) {
      console.error('Failed to fetch my groups:', error);
      setErrorMessage('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) {
            fetchMyGroups();
          }
        }}
        className={
          "flex items-center space-x-1 text-gray-700 hover:text-gray-900 " +
          "px-3 py-2 rounded-md"
        }
      >
        <span>Group Chats</span>
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
              to="/groups/new"
              className={
                "block px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded " +
                "flex items-center"
              }
              onClick={() => setIsOpen(false)}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>New Group</span>
            </Link>
            <Link
              to="/groups"
              className={
                "block px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded " +
                "flex items-center"
              }
              onClick={() => setIsOpen(false)}
            >
              <Users className="h-4 w-4 mr-2" />
              <span>All Groups</span>
            </Link>
          </div>

          <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium text-sm">My Groups</h3>
            <div />
          </div>

          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : errorMessage ? (
            <div className="px-4 py-2 text-sm text-red-500">{errorMessage}</div>
          ) : myGroups.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {myGroups.slice(0, 7).map((group) => (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className={
                    "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 " +
                    "flex items-center"
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  <span className="truncate">{group.name}</span>
                </Link>
              ))}
              {myGroups.length > 7 && (
                <Link
                  to="/groups"
                  className={
                    "block px-4 py-2 text-xs text-blue-600 hover:bg-gray-100 text-center"
                  }
                  onClick={() => setIsOpen(false)}
                >
                  View all ({myGroups.length})
                </Link>
              )}
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No groups yet</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupsDropdown;
