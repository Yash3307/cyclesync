'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import CycleModal from '@/components/CycleModal';
import { createClient } from '@/lib/supabase/client';
import { calculatePrediction, Cycle, PredictionResult } from '@/lib/prediction';
import { format, parseISO } from 'date-fns';
import { Download, Edit2, Loader2, FileText, Calendar as CalendarIcon, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const supabase = createClient();

  const fetchCycles = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false }); // Latest first for table

      if (error) {
         toast.error("Failed to load history");
      } else if (data) {
        setCycles(data);
        // For prediction, algorithm expects oldest first
        const sortedOldestFirst = [...data].reverse();
        const result = calculatePrediction(sortedOldestFirst);
        setPrediction(result);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const handleEditClick = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setIsModalOpen(true);
  };

  const exportPDF = async () => {
     setIsExporting(true);
     try {
        const { jsPDF } = await import('jspdf');
        await import('jspdf-autotable');
        
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(22);
        doc.text("CycleSync Health Report", 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 20, 30);
        
        // Stats Summary
        doc.setFontSize(16);
        doc.text("Summary Statistics", 20, 45);
        doc.setFontSize(12);
        if (prediction) {
           doc.text(`Average Cycle Length: ${prediction.avg_cycle_length} days`, 20, 55);
           doc.text(`Average Period Duration: ${prediction.avg_period_duration} days`, 20, 65);
           doc.text(`Irregular Cycles Detected: ${prediction.irregular_flag ? 'Yes' : 'No'}`, 20, 75);
           doc.text(`Predicted Next Period: ${format(parseISO(prediction.predicted_start), 'MMMM d, yyyy')}`, 20, 85);
           
           let yPos = 95;
           if (prediction.insights.length > 0) {
              doc.text("Insights:", 20, yPos);
              yPos += 10;
              prediction.insights.forEach(insight => {
                 doc.text(`• ${insight}`, 25, yPos);
                 yPos += 10;
              });
           }
        } else {
           doc.text("Not enough data to generate statistics.", 20, 55);
        }

        // Cycle History Table
        let startY = prediction && prediction.insights.length > 0 ? 100 + (prediction.insights.length * 10) : 100;
        
        doc.setFontSize(16);
        doc.text("Recent Cycle History", 20, startY);
        
        startY += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Start Date", 25, startY);
        doc.text("End Date", 70, startY);
        doc.text("Duration", 115, startY);
        doc.text("Cycle Length", 160, startY);
        
        doc.setFont("helvetica", "normal");
        startY += 8;

        // Draw line
        doc.line(20, startY - 5, 190, startY - 5);

        const limit = Math.min(cycles.length, 12); // Export latest 12
        for (let i = 0; i < limit; i++) {
           const c = cycles[i];
           const prev = i < cycles.length - 1 ? cycles[i+1] : null;
           
           const startDate = format(parseISO(c.start_date), 'MMM d, yyyy');
           const endDate = c.end_date ? format(parseISO(c.end_date), 'MMM d, yyyy') : 'Ongoing';
           const duration = c.end_date 
                 ? Math.round((new Date(c.end_date).getTime() - new Date(c.start_date).getTime()) / (1000 * 3600 * 24)) + 1 
                 : '-';
           
           const cycleLength = prev 
                 ? Math.round((new Date(c.start_date).getTime() - new Date(prev.start_date).getTime()) / (1000 * 3600 * 24)) 
                 : '-';

           doc.text(startDate, 25, startY);
           doc.text(endDate, 70, startY);
           doc.text(`${duration} ${duration !== '-' ? 'days' : ''}`, 115, startY);
           doc.text(`${cycleLength} ${cycleLength !== '-' ? 'days' : ''}`, 160, startY);
           
           startY += 10;
           
           // Add new page if getting full
           if (startY > 270) {
              doc.addPage();
              startY = 20;
           }
        }

        doc.save("CycleSync_Health_Report.pdf");
        toast.success("Report downloaded successfully");
     } catch (e: any) {
        console.error("PDF Export Error:", e);
        toast.error("Failed to generate PDF");
     } finally {
        setIsExporting(false);
     }
  };

  return (
    <>
      <Navigation />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">History & Stats</h1>
            <p className="text-gray-500 mt-1">Review your past cycles and generate health reports.</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={exportPDF}
              disabled={isExporting || cycles.length === 0}
              className="btn-secondary flex items-center bg-white"
            >
              {isExporting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
              Export PDF
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="card flex items-center gap-4">
              <div className="p-4 bg-primary-100 rounded-full text-primary-600">
                 <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-sm text-gray-500 font-medium">Avg Cycle Length</p>
                 <p className="text-2xl font-bold text-gray-900">
                    {prediction ? prediction.avg_cycle_length : '--'}<span className="text-sm font-normal text-gray-500 ml-1">days</span>
                 </p>
              </div>
           </div>
           
           <div className="card flex items-center gap-4">
              <div className="p-4 bg-primary-100 rounded-full text-primary-600">
                 <FileText className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-sm text-gray-500 font-medium">Avg Period Duration</p>
                 <p className="text-2xl font-bold text-gray-900">
                    {prediction ? prediction.avg_period_duration : '--'}<span className="text-sm font-normal text-gray-500 ml-1">days</span>
                 </p>
              </div>
           </div>

           <div className="card flex items-center gap-4">
              <div className={`p-4 rounded-full ${prediction?.irregular_flag ? 'bg-amber-100 text-amber-600' : 'bg-secondary-100 text-secondary-600'}`}>
                 <Activity className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-sm text-gray-500 font-medium">Regularity</p>
                 <p className={`text-lg font-bold ${prediction?.irregular_flag ? 'text-amber-700' : 'text-secondary-700'}`}>
                    {prediction ? (prediction.irregular_flag ? 'High Variability' : 'Consistent') : 'Gathering Data'}
                 </p>
              </div>
           </div>
        </div>

        {/* History Table */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800">All Logged Cycles</h2>
              <span className="text-sm text-gray-500">{cycles.length} records</span>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                 <thead className="text-xs uppercase bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                       <th className="px-6 py-4">Start Date</th>
                       <th className="px-6 py-4">End Date</th>
                       <th className="px-6 py-4">Duration</th>
                       <th className="px-6 py-4">Cycle Length</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    {isLoading ? (
                       <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                             <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                             Loading records...
                          </td>
                       </tr>
                    ) : cycles.length === 0 ? (
                       <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                             No cycles logged yet.
                          </td>
                       </tr>
                    ) : (
                       cycles.map((cycle, index) => {
                          // In reverse cron order, the next in array is chronologically previous
                          const previousCycle = index < cycles.length - 1 ? cycles[index + 1] : null;
                          
                          let cycleLength = null;
                          if (previousCycle) {
                             cycleLength = Math.round((new Date(cycle.start_date).getTime() - new Date(previousCycle.start_date).getTime()) / (1000 * 3600 * 24));
                          }

                          let duration = null;
                          if (cycle.end_date) {
                             duration = Math.round((new Date(cycle.end_date).getTime() - new Date(cycle.start_date).getTime()) / (1000 * 3600 * 24)) + 1;
                          }

                          return (
                             <tr key={cycle.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900 border-l-4 border-l-transparent hover:border-l-primary-500">
                                   {format(parseISO(cycle.start_date), 'MMM d, yyyy')}
                                </td>
                                <td className="px-6 py-4">
                                   {cycle.end_date ? format(parseISO(cycle.end_date), 'MMM d, yyyy') : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                                         Ongoing
                                      </span>
                                   )}
                                </td>
                                <td className="px-6 py-4">
                                   {duration ? `${duration} days` : '-'}
                                </td>
                                <td className="px-6 py-4">
                                   {cycleLength ? `${cycleLength} days` : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <button 
                                      onClick={() => handleEditClick(cycle)}
                                      className="text-gray-400 hover:text-primary-600 p-1.5 rounded-md hover:bg-primary-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300"
                                      title="Edit Record"
                                   >
                                      <Edit2 className="w-4 h-4" />
                                   </button>
                                </td>
                             </tr>
                          );
                       })
                    )}
                 </tbody>
              </table>
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
