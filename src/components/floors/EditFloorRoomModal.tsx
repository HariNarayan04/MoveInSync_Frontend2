import React, { useState, useEffect } from 'react';
import { ModalFactory } from '@/factory/ModalFactory';
import { ButtonFactory } from '@/factory/ButtonFactory';
import { toast } from '@/factory/ToastFactory';
import { floorService } from '@/api/FloorService';
import { formatErrorForDisplay } from '@/errors/errorHandler';
import type { FloorRoom, UpdateFloorRoomPayload } from '@/types';

interface EditFloorRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: FloorRoom | null;
  onSuccess: () => void;
}

const AVAILABLE_FEATURES = ['Wifi', 'Whiteboard', 'Projector'];

export const EditFloorRoomModal: React.FC<EditFloorRoomModalProps> = ({
  isOpen,
  onClose,
  room,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 1,
    features: [] as string[],
  });

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name,
        capacity: room.capacity,
        features: [...room.features],
      });
    }
  }, [room]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? Number(value) : value,
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

    if (!room) return;

    setIsLoading(true);

    try {
      const payload: UpdateFloorRoomPayload = {
        name: formData.name,
        capacity: formData.capacity,
        features: formData.features,
      };

      await floorService.updateFloorRoom(room.id, payload);
      toast.success('Room updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(formatErrorForDisplay(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!room) return null;

  return (
    <ModalFactory isOpen={isOpen} onClose={handleClose} title="Edit Room">
      <form onSubmit={handleSubmit} className="space-y-6">
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
            Save Changes
          </ButtonFactory>
        </div>
      </form>
    </ModalFactory>
  );
};
