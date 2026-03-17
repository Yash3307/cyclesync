'use client';

import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Loader2, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface Cycle {
  id?: string;
  start_date: string;
  end_date: string | null;
}

interface CycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCycle?: Cycle | null;
}

export default function CycleModal({ isOpen, onClose, onSuccess, existingCycle }: CycleModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  // Reset form when opened or when existingCycle changes
  useEffect(() => {
    if (isOpen) {
      if (existingCycle) {
        setStartDate(existingCycle.start_date);
        setEndDate(existingCycle.end_date || '');
      } else {
        setStartDate('');
        setEndDate('');
      }
    }
  }, [isOpen, existingCycle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      if (endDate && new Date(endDate) < new Date(startDate)) {
        toast.error("End date cannot be before start date.");
        setIsLoading(false);
        return;
      }

      if (existingCycle && existingCycle.id) {
        // Update
        const { error } = await supabase
          .from('cycles')
          .update({
            start_date: startDate,
            end_date: endDate || null
          })
          .eq('id', existingCycle.id)
          .eq('user_id', user.id); // extra security check
        
        if (error) throw error;
        toast.success("Cycle updated successfully.");
      } else {
        // Insert
        const { error } = await supabase
          .from('cycles')
          .insert({
            user_id: user.id,
            start_date: startDate,
            end_date: endDate || null
          });
        
        if (error) throw error;
        toast.success("Cycle added successfully.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingCycle?.id) return;
    
    if (!confirm("Are you sure you want to delete this cycle record? This cannot be undone.")) return;

    setIsDeleting(true);
    try {
       const { error } = await supabase
          .from('cycles')
          .delete()
          .eq('id', existingCycle.id);
          
       if (error) throw error;
       toast.success("Cycle deleted successfully.");
       onSuccess();
       onClose();
    } catch (err: any) {
       toast.error(err.message || "Failed to delete cycle.");
    } finally {
       setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary-500" />
            {existingCycle ? 'Edit Cycle Record' : 'Add Past Cycle'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <form id="cycle-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date (First day of period) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || new Date().toISOString().split('T')[0]} // Default max today if no end date
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (Last day of period, optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]} 
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank if the period is currently ongoing.</p>
            </div>
            
            {/* If we had symptoms here, they would go here */}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center gap-3">
           {existingCycle ? (
             <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isLoading}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                title="Delete Record"
             >
               {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
             </button>
           ) : <div />}
             
           <div className="flex gap-3">
             <button
               type="button"
               onClick={onClose}
               className="btn-secondary"
               disabled={isLoading || isDeleting}
             >
               Cancel
             </button>
             <button
               form="cycle-form"
               type="submit"
               disabled={isLoading || isDeleting || !startDate}
               className="btn-primary flex justify-center items-center min-w-[100px]"
             >
               {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
               {existingCycle ? 'Save Changes' : 'Add Cycle'}
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}
