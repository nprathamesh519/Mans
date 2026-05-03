import React, { useEffect } from 'react';
import { useReminderStore } from '../store/reminderStore';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';

const RemindersPage: React.FC = () => {
  const { reminders, markAsCompleted, fetchReminders } = useReminderStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReminders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reminders</h1>

        {user?.role === 'caretaker' && (
          <Button
            onClick={() => navigate('/reminders/add')}
            className="transition-transform hover:scale-105 active:scale-95"
          >
            + Add Reminder
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {Array.isArray(reminders) && reminders.length > 0 ? (
          reminders.map(r => (
            <div key={r.id} className="p-4 bg-white rounded-xl shadow flex justify-between items-center">
              <div>
                <p className={`font-bold ${r.isCompleted ? 'line-through text-gray-400' : ''}`}>
                  {r.title}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(r.time).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>

              {r.isCompleted ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                  Done ✓
                </span>
              ) : (
                <button
                  onClick={() => markAsCompleted(r.id)}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium"
                >
                  Mark Done
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400">No reminders found</p>
        )}
      </div>
    </div>
  );
};

export default RemindersPage;