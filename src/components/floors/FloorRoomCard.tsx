import React from 'react';
import type { FloorRoom } from '@/types';
import { ButtonFactory } from '@/factory/ButtonFactory';

interface FloorRoomCardProps {
  room: FloorRoom;
  onEdit: (room: FloorRoom) => void;
  onDelete: (roomId: string) => void;
}

export const FloorRoomCard: React.FC<FloorRoomCardProps> = ({
  room,
  onEdit,
  onDelete,
}) => {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${room.name}"?`)) {
      onDelete(room.id);
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100"
      style={{ fontFamily: '"Elms Sans", sans-serif' }}
    >
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{room.name}</h3>
          <div className="space-y-1">
            {room.roomId && (
              <p className="text-sm text-gray-600">
                Room ID: <span className="font-medium text-gray-900">{room.roomId}</span>
              </p>
            )}
            <p className="text-sm text-gray-600">
              Capacity: <span className="font-medium text-gray-900">{room.capacity} people</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Features:</p>
        <div className="flex flex-wrap gap-2">
          {room.features.map((feature) => (
            <span
              key={feature}
              className="px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full capitalize"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <ButtonFactory
          onClick={() => onEdit(room)}
          variant="secondary"
          size="sm"
          fullWidth
        >
          Edit
        </ButtonFactory>
        <ButtonFactory
          onClick={handleDelete}
          variant="danger"
          size="sm"
          fullWidth
        >
          Delete
        </ButtonFactory>
      </div>
    </div>
  );
};
