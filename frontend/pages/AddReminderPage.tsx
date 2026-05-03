import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReminderStore } from '../store/reminderStore';
import { ReminderType } from '../types';
import Button from '../components/ui/Button';

const AddReminderPage: React.FC = () => {
  const navigate = useNavigate();
  const { addReminder } = useReminderStore();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date + time
    const fullDateTime = new Date(`${date}T${time}`);

    await addReminder({
      title,
      time: fullDateTime.toISOString(), // store proper datetime
      type: ReminderType.MEDICATION,
      isCompleted: false
    });

    navigate('/reminders');
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">New Reminder</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title (e.g. Take Medicine)"
          className="form-input"
          required
        />

        {/* ✅ DATE PICKER */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="form-input"
          required
        />

        {/* ✅ TIME PICKER */}
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="form-input"
          required
        />

        <Button type="submit" className="w-full">
          Add Reminder
        </Button>

      </form>
    </div>
  );
};

export default AddReminderPage;