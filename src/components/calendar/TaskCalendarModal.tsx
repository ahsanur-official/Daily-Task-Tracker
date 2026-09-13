import React from 'react';
import { Task, Goal } from '../../types';
import { TaskCalendarView } from './TaskCalendarView';
import { X } from 'lucide-react';

interface TaskCalendarModalProps {
  task: Task | null;
  goal?: Goal;
  onClose: () => void;
  onSelectTask?: (task: Task) => void;
}

export const TaskCalendarModal: React.FC<TaskCalendarModalProps> = ({
  task,
  goal,
  onClose,
  onSelectTask,
}) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-5xl shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Modal Header Bar with Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Task Continuity & Consistency Calendar
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <TaskCalendarView
            task={task}
            goal={goal}
            onSelectTask={onSelectTask}
            onClose={onClose}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
};
