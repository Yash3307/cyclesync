'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import CycleModal from '@/components/CycleModal';
import { createClient } from '@/lib/supabase/client';
import { calculatePrediction, Cycle, PredictionResult } from '@/lib/prediction';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Droplets, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchCycles = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true }); // sort ascending for prediction logic

      if (error) {
         toast.error("Failed to load cycles");
         console.error(error);
      } else if (data) {
        setCycles(data);
        
        // Recalculate prediction
        const result = calculatePrediction(data);
        setPrediction(result);

        // Store prediction in DB implicitly (optional step for syncing, skipping for now to rely on real-time calc, but we can do it if needed per plan)
        if (result) {
           await supabase.from('predictions').upsert({
              user_id: user.id,
              predicted_start: result.predicted_start,
              predicted_end: result.predicted_end,
              confidence: result.confidence_score,
              fertile_start: result.fertile_start,
              fertile_end: result.fertile_end,
              ovulation_day: result.ovulation_day
           }, { onConflict: 'user_id' }); 
           // Need unique constraint on user_id for pure upsert, assuming one active prediction per user
        }
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const handleStartPeriod = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if there's already an active period (start_date exists, no end_date)
    const activeCycle = cycles.find(c => !c.end_date);
    if (activeCycle) {
      toast.error("You already have an ongoing period logged.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('cycles').insert({
      user_id: user.id,
      start_date: today
    });

    if (error) {
       toast.error("Failed to log start date.");
    } else {
       toast.success("Period logged successfully.");
       fetchCycles();
    }
  };

  const handleEndPeriod = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Find active period
    const activeCycle = cycles.find(c => !c.end_date);
    if (!activeCycle) {
      toast.error("No active period to end.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('cycles').update({
      end_date: today
    }).eq('id', activeCycle.id).eq('user_id', user.id);

    if (error) {
       toast.error("Failed to log end date.");
    } else {
       toast.success("Period ended successfully.");
       fetchCycles();
    }
  };

  const handleDayClick = (dayStr: string) => {
    // Find if a cycle exists on this day to edit it
    const date = new Date(dayStr);
    const cycleOnDay = cycles.find(c => {
       const start = parseISO(c.start_date);
       if (c.end_date) {
         const end = parseISO(c.end_date);
         return isWithinInterval(date, { start, end });
       }
       return isSameDay(date, start);
    });

    if (cycleOnDay) {
       setSelectedCycle(cycleOnDay);
       setIsModalOpen(true);
    }
  };


  // Calendar rendering logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const activePeriod = cycles.find(c => !c.end_date);

  return (
    <>
      <Navigation />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Track your cycle and view predictions.</p>
          </div>
          
          <div className="flex gap-3">
             {!activePeriod ? (
                <button onClick={handleStartPeriod} className="btn-primary flex items-center shadow-md">
                   <Droplets className="w-5 h-5 mr-2" /> Start Period Today
                </button>
             ) : (
                <button onClick={handleEndPeriod} className="btn-secondary text-primary-600 border-primary-200 bg-primary-50 hover:bg-primary-100 flex items-center shadow-md">
                   End Period Today
                </button>
             )}
            <button 
              onClick={() => { setSelectedCycle(null); setIsModalOpen(true); }}
              className="btn-secondary flex items-center"
            >
              <Plus className="w-5 h-5 mr-1" /> Log Past
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="card shadow-md">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    {format(currentDate, "MMMM yyyy")}
                 </h2>
                 <div className="flex space-x-2">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 rounded-full hover:bg-gray-100 transition"><ChevronLeft className="w-5 h-5 text-gray-600"/></button>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 rounded-full hover:bg-gray-100 transition"><ChevronRight className="w-5 h-5 text-gray-600"/></button>
                 </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = isSameDay(day, new Date());
                  
                  // Styles priority: 
                  // 1. Logged Period (Solid Primary)
                  // 2. Predicted Period (Light Primary)
                  // 3. Fertile Window (Light Green)
                  // 4. Ovulation Day (Dark Green dots/border)

                  let isLoggedPeriod = false;
                  let isPredictedPeriod = false;
                  let isFertile = false;
                  let isOvulation = false;

                  // Check logged cycles
                  for (const c of cycles) {
                     const start = parseISO(c.start_date);
                     const end = c.end_date ? parseISO(c.end_date) : new Date(); // assume till today if ongoing
                     if (isWithinInterval(day, { start, end: end })) {
                        isLoggedPeriod = true;
                        break;
                     }
                  }

                  // Check predictions
                  if (prediction) {
                     const pStart = parseISO(prediction.predicted_start);
                     const pEnd = parseISO(prediction.predicted_end);
                     if (isWithinInterval(day, { start: pStart, end: pEnd })) {
                        isPredictedPeriod = true;
                     }

                     const fStart = parseISO(prediction.fertile_start);
                     const fEnd = parseISO(prediction.fertile_end);
                     if (isWithinInterval(day, { start: fStart, end: fEnd })) {
                        isFertile = true;
                     }

                     if (isSameDay(day, parseISO(prediction.ovulation_day))) {
                        isOvulation = true;
                     }
                  }

                  let dayClasses = "h-12 sm:h-14 md:h-16 flex flex-col items-center justify-center rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer ";
                  
                  if (!isCurrentMonth) {
                     dayClasses += "text-gray-300 ";
                  } else {
                     dayClasses += "text-gray-700 font-medium ";
                  }

                  if (isLoggedPeriod) {
                     dayClasses += "bg-primary-500 text-white shadow-sm hover:bg-primary-600 ";
                  } else if (isPredictedPeriod) {
                     dayClasses += "bg-primary-100 border border-primary-200 text-primary-800 hover:bg-primary-200 ";
                  } else if (isOvulation) {
                     dayClasses += "bg-secondary-50 border-2 border-secondary-500 text-secondary-600 font-bold ";
                  } else if (isFertile) {
                     dayClasses += "bg-secondary-50 text-secondary-600 border border-secondary-100 hover:bg-secondary-100 ";
                  } else {
                     dayClasses += "hover:bg-gray-50 ";
                  }

                  if (isToday && !isLoggedPeriod) {
                     dayClasses += "ring-2 ring-primary-300 ring-offset-1 font-bold ";
                  }

                  return (
                    <button
                      key={day.toString()}
                      onClick={() => handleDayClick(dayStr)}
                      className={dayClasses}
                      aria-label={`${format(day, 'MMM d')}${isLoggedPeriod ? ' Logged Period' : ''}`}
                    >
                      <span>{format(day, dateFormat)}</span>
                      {isOvulation && !isLoggedPeriod && <span className="w-1.5 h-1.5 bg-secondary-500 rounded-full mt-1"></span>}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-600">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary-500"></div> Logged Period</div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary-100 border border-primary-200"></div> Predicted</div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded border-2 border-secondary-500 bg-secondary-50"></div> Ovulation</div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-secondary-50 border border-secondary-100"></div> Fertile Window</div>
              </div>
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-6">
            
            {/* Next Period Card */}
            <div className="card shadow-md bg-gradient-to-br from-primary-500 to-primary-600 border-none text-white">
              <h3 className="text-primary-100 font-medium mb-1">Next Predicted Period</h3>
              {isLoading ? (
                 <div className="animate-pulse h-10 bg-white/20 rounded w-2/3 mt-2"></div>
              ) : prediction ? (
                 <>
                   <div className="text-3xl font-bold mb-2">
                     {format(parseISO(prediction.predicted_start), "MMM d, yyyy")}
                   </div>
                   <div className="text-sm text-primary-100 flex items-center justify-between mt-4">
                     <span>Confidence: {Math.round(prediction.confidence_score * 100)}%</span>
                     <span>~{prediction.avg_period_duration} days</span>
                   </div>
                 </>
              ) : (
                <div className="mt-2 text-sm text-primary-50">
                   Not enough data to make a prediction yet. Log at least 2 cycles.
                </div>
              )}
            </div>

            {/* Insights Card */}
            <div className="card shadow-sm border-gray-200">
               <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-gray-400"/>
                  Cycle Insights
               </h3>
               {isLoading ? (
                  <div className="space-y-3">
                     <div className="animate-pulse h-4 bg-gray-200 rounded w-full"></div>
                     <div className="animate-pulse h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
               ) : prediction ? (
                  <div className="space-y-4">
                     {prediction.insights.map((insight, idx) => (
                        <div key={idx} className={`p-3 rounded-lg text-sm flex gap-3
                           ${prediction.irregular_flag && insight.includes('irregular') 
                             ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                             : 'bg-gray-50 text-gray-700 border border-gray-100'}`}
                        >
                           <div className="mt-0.5">•</div>
                           <div>{insight}</div>
                        </div>
                     ))}

                     <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                        <div>
                           <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Avg Length</div>
                           <div className="text-xl font-bold text-gray-900 mt-1">{prediction.avg_cycle_length} <span className="text-sm font-normal text-gray-500">days</span></div>
                        </div>
                        <div>
                           <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Avg Duration</div>
                           <div className="text-xl font-bold text-gray-900 mt-1">{prediction.avg_period_duration} <span className="text-sm font-normal text-gray-500">days</span></div>
                        </div>
                     </div>
                  </div>
               ) : (
                  <p className="text-sm text-gray-500">More data required to generate personalized insights.</p>
               )}
            </div>

          </div>

        </div>
      </main>

      <CycleModal 
         isOpen={isModalOpen}
         onClose={() => { setIsModalOpen(false); setSelectedCycle(null); }}
         onSuccess={fetchCycles}
         existingCycle={selectedCycle}
      />
    </>
  );
}
