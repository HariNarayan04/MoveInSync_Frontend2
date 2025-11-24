import React, { useState } from 'react';
import { ModalFactory } from '@/factory/ModalFactory';
import { ButtonFactory } from '@/factory/ButtonFactory';
import { toast } from '@/factory/ToastFactory';
import { floorService } from '@/api/FloorService';
import { formatErrorForDisplay } from '@/errors/errorHandler';
import type { CreateFloorRoomPayload } from '@/types';

interface AddFloorRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  floorId: string;
  floorName: string;
  onSuccess: () => void;
}

const AVAILABLE_FEATURES = ['Wifi', 'Whiteboard', 'Projector'];

export const AddFloorRoomModal: React.FC<AddFloorRoomModalProps> = ({
  isOpen,
  onClose,
  floorId,
  floorName,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    roomId: 0,
    name: '',
    capacity: 1,
    features: [] as string[],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' || name === 'roomId' ? Number(value) : value,
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const payload: CreateFloorRoomPayload = {
        floor_id: floorId,
        roomId: formData.roomId,
        roomName: formData.name,
        capacity: formData.capacity,
        roomFeatures: formData.features,
      };

      await floorService.createFloorRoom(payload);
      toast.success('Room created successfully!');
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        roomId: 0,
        name: '',
        capacity: 1,
        features: [] as string[],
      });
    } catch (error) {
      toast.error(formatErrorForDisplay(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        roomId: 0,
        name: '',
        capacity: 1,
        features: [] as string[],
      });
      onClose();
    }
  };

  return (
    <ModalFactory isOpen={isOpen} onClose={handleClose} title="Add New Room">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Floor
          </label>
          <input
            type="text"
            value={floorName}
            disabled
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="roomId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Room ID *
          </label>
          <input
            id="roomId"
            name="roomId"
            type="number"
            required
            min="1"
            value={formData.roomId}
            onChange={handleChange}
            placeholder="e.g., 101"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Unique room number identifier
          </p>
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Room Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Conference Room A"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="capacity"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Capacity *
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            required
            min="1"
            value={formData.capacity}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Maximum number of people
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Features (Optional)
          </label>
          <div className="space-y-3">
            {AVAILABLE_FEATURES.map((feature) => (
              <label
                key={feature}
                className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.features.includes(feature)}
                  onChange={() => handleFeatureToggle(feature)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {feature}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-6 border-t border-gray-100">
          <ButtonFactory
            type="button"
            onClick={handleClose}
            variant="secondary"
            fullWidth
            disabled={isLoading}
          >
            Cancel
          </ButtonFactory>
          <ButtonFactory
            type="submit"
            loading={isLoading}
            fullWidth
          >
            Create Room
          </ButtonFactory>
        </div>
      </form>
    </ModalFactory>
  );
};
