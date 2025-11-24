import React, { useState } from 'react';
import { ModalFactory } from '@/factory/ModalFactory';
import { ButtonFactory } from '@/factory/ButtonFactory';
import { toast } from '@/factory/ToastFactory';
import { floorService } from '@/api/FloorService';
import { formatErrorForDisplay } from '@/errors/errorHandler';
import type { CreateFloorPayload } from '@/types';

interface AddFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddFloorModal: React.FC<AddFloorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    floorName: '',
    floorNumber: 0,
    floorDescription: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'floorNumber' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const payload: CreateFloorPayload = {
        floorName: formData.floorName,
        floorNumber: formData.floorNumber,
        floorDescription: formData.floorDescription || undefined,
      };

      await floorService.createFloor(payload);
      toast.success('Floor created successfully!');
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        floorName: '',
        floorNumber: 0,
        floorDescription: '',
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
        floorName: '',
        floorNumber: 0,
        floorDescription: '',
      });
      onClose();
    }
  };

  return (
    <ModalFactory isOpen={isOpen} onClose={handleClose} title="Add New Floor">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="floorName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Floor Name *
          </label>
          <input
            id="floorName"
            name="floorName"
            type="text"
            required
            value={formData.floorName}
            onChange={handleChange}
            placeholder="e.g., Ground Floor"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="floorNumber"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Floor Number *
          </label>
          <input
            id="floorNumber"
            name="floorNumber"
            type="number"
            required
            min="0"
            value={formData.floorNumber}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Floor number (0 for ground floor)
          </p>
        </div>

        <div>
          <label
            htmlFor="floorDescription"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description (Optional)
          </label>
          <textarea
            id="floorDescription"
            name="floorDescription"
            value={formData.floorDescription}
            onChange={handleChange}
            placeholder="e.g., Main entrance and reception area"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
          />
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
            Create Floor
          </ButtonFactory>
        </div>
      </form>
    </ModalFactory>
  );
};
