import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createCalendarEvent } from '../../lib/calendarService';
import { RecurrenceType } from '../../types/calendar';
import { useAuth } from '../../contexts/AuthContext';

interface AddCalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CalendarEventForm {
  title: string;
  date: string;
  icon: string;
  description: string;
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
}

const popularEmojis = ['📅', '🎉', '📝', '💼', '🏥', '👥', '🍰', '🎂', '💰', '🏆', '📊', '🎯', '⚡', '🔥', '✨', '🌟', '❤️', '🎨'];

export default function AddCalendarEventModal({ isOpen, onClose, onSuccess }: AddCalendarEventModalProps) {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CalendarEventForm>({
    title: '',
    date: '',
    icon: '📅',
    description: '',
    isRecurring: false,
    recurrenceType: 'none'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    try {
      // Create date object from the date string
      const eventDate = new Date(formData.date + 'T00:00:00');

      await createCalendarEvent({
        title: formData.title,
        date: eventDate,
        icon: formData.icon,
        description: formData.description,
        isRecurring: formData.isRecurring,
        recurrenceType: formData.isRecurring ? formData.recurrenceType : undefined
      }, currentUser.uid);

      // Reset form and close modal
      setFormData({
        title: '',
        date: '',
        icon: '📅',
        description: '',
        isRecurring: false,
        recurrenceType: 'none'
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating calendar event:', error);
      alert('Failed to create calendar event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof CalendarEventForm, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Calendar Event</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter event title..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                required
              />
            </div>

            {/* Recurring Options */}
            <div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => handleChange('isRecurring', e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isRecurring" className="ml-2 text-sm font-semibold text-gray-700">
                  Make this a recurring event
                </label>
              </div>

              {formData.isRecurring && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Repeat Every
                  </label>
                  <select
                    value={formData.recurrenceType}
                    onChange={(e) => handleChange('recurrenceType', e.target.value as RecurrenceType)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                  >
                    <option value="none">No Repeat</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every 2 Weeks</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.recurrenceType === 'weekly' && 'Creates 52 weekly events (1 year)'}
                    {formData.recurrenceType === 'biweekly' && 'Creates 26 biweekly events (1 year)'}
                    {formData.recurrenceType === 'monthly' && 'Creates 12 monthly events (1 year)'}
                    {formData.recurrenceType === 'none' && 'Select a repeat option'}
                  </p>
                </div>
              )}
            </div>

            {/* Icon Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Event Icon
              </label>
              <div className="grid grid-cols-9 gap-2 p-4 border border-gray-300 rounded-lg">
                {popularEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleChange('icon', emoji)}
                    className={`p-2 text-2xl rounded-lg border-2 transition-all hover:bg-gray-50 ${
                      formData.icon === emoji 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                placeholder="Or enter custom emoji..."
                className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                maxLength={2}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter event description..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none resize-none"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
