import React, { useEffect } from 'react';
import { Task, Goal } from '../../types';
import { TaskCalendarView } from './TaskCalendarView';
import { X } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

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
  useEffect(() => {
    if (!task) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, onClose]);

  if (!task) return null;

  return (
    <ModalPortal isOpen={!!task}>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Task Calendar Modal"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-5xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        >
          {/* Mandatory, Always-Visible 'X' Close Button in Top-Right Corner */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-10 h-10 rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-950 dark:text-stone-400 dark:hover:text-white bg-white/95 hover:bg-stone-100 dark:bg-stone-800/95 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-all shrink-0 cursor-pointer shadow-xs"
            aria-label="Close calendar modal"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Modal Header Bar with Close Button */}
          <div className="shrink-0 flex items-center justify-between px-6 pr-16 sm:pr-20 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Task Continuity & Consistency Calendar
              </span>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 p-6 overflow-y-auto">
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
    </ModalPortal>
  );
};
