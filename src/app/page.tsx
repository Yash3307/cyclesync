'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Shield, Sparkles, Activity, Clock, HeartPulse, AlertTriangle, HelpCircle, Thermometer } from 'lucide-react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import styles from './landing.module.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (mounted) {
        if (user) {
          router.push('/dashboard');
        } else {
          setIsCheckingAuth(false);
        }
      }
    };
    checkAuth();
    return () => { mounted = false; };
  }, [router, supabase]);

  if (isCheckingAuth) {
     return (
       <div className={`min-h-screen ${styles.bgSurface} flex items-center justify-center ${jakarta.className} ${styles.landingLayout}`}>
         <div className={`w-8 h-8 rounded-full ${styles.bgPrimary} animate-ping`}></div>
       </div>
     );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${styles.bgSurface} ${styles.textOnSurface} ${jakarta.className} ${styles.landingLayout}`}>
      
      {/* 1. Navbar - Glassmorphism strictly enforced */}
      <nav className={`w-full px-8 py-4 flex items-center justify-between sticky top-0 z-50 ${styles.glassNav}`}>
        <div className="flex items-center gap-2">
           <HeartPulse className={`w-6 h-6 ${styles.textPrimary}`} />
           <span className={`font-bold text-xl tracking-tighter ${styles.textOnSurface}`}>CycleSync</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#features" className={`text-sm font-semibold transition-colors hidden md:block ${styles.navLink}`}>
            Features
          </Link>
          <Link href="#how-it-works" className={`text-sm font-semibold transition-colors hidden md:block ${styles.navLink}`}>
            How It Works
          </Link>
          <Link href="#privacy" className={`text-sm font-semibold transition-colors hidden md:block ${styles.navLink}`}>
            Privacy
          </Link>
          <Link href="/login" className={`px-6 py-2.5 text-white font-bold rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 ml-2 ${styles.btnLogin}`}>
            Login
          </Link>
        </div>
      </nav>

      <main className="flex-1 w-full overflow-hidden">
        
        {/* 2. Hero Section - Double vertical spacing, strict grid lg:grid-cols-2 */}
        <section className="px-6 py-40 lg:py-56 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Text - perfectly vertically centered natively by grid items-center */}
          <div className="text-left w-full max-w-xl mx-auto lg:mx-0">
            <h1 className={`text-6xl md:text-7xl font-extrabold tracking-tighter mb-8 leading-[1.05] ${styles.textOnSurface}`}>
              Track Your Cycle with <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Confidence</span>
            </h1>
            <p className={`text-xl mb-12 leading-relaxed font-medium ${styles.textOnSurfaceVariant}`}>
              Join thousands of women who have switched to a more intelligent, private, and beautiful tracking experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 items-center">
               <Link 
                 href="/login" 
                 className={`w-full sm:w-auto text-center px-10 py-5 text-lg font-bold text-white rounded-full shadow-[0_12px_40px_-10px_rgba(236,72,153,0.7)] transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(236,72,153,0.9)] ${styles.bgPrimary}`}
               >
                 Get Started Free
               </Link>
               <span className={`text-sm font-medium mt-2 sm:mt-0 sm:ml-2 tracking-tight ${styles.textOnSurfaceVariant}`}>
                 Available on iOS and Android
               </span>
            </div>
          </div>
          
          {/* Right: Phone Mockup Day 3 Container */}
          <div className="w-full flex justify-center lg:justify-end relative">
             {/* Pink ambient glow blur-3xl explicitly surrounding mockup */}
             <div className="absolute inset-0 bg-pink-400/30 blur-[100px] rounded-full transform scale-[1.3] -z-10 translate-y-12"></div>
             
             {/* Floating Card - max-w-[320px] strict rule with massive ambient shadow */}
             <div className="w-full max-w-[320px] bg-white rounded-[2.5rem] shadow-[0_45px_120px_-20px_rgba(236,72,153,0.25)] p-8 flex flex-col items-center relative transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-3 hover:shadow-[0_55px_140px_-20px_rgba(236,72,153,0.35)] border-0">
                
                <h3 className={`font-bold tracking-widest uppercase text-sm mb-8 ${styles.textOnSurfaceVariant}`}>Today</h3>
                
                {/* 24 Days to Go Circle in #ec4899 */}
                <div className="relative w-48 h-48 rounded-full flex items-center justify-center mb-10">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="#fdf2f8" strokeWidth="8" />
                    {/* Primary color partial arc */}
                    <circle cx="50" cy="50" r="46" fill="none" stroke="#ec4899" strokeWidth="8" strokeDasharray="289" strokeDashoffset="245" strokeLinecap="round" />
                  </svg>
                  
                  <div className="flex flex-col items-center z-10">
                    <span className="text-5xl font-extrabold text-[#ec4899] leading-none mb-1 tracking-tighter">Day 3</span>
                    <span className={`text-xs font-bold uppercase tracking-wider text-center ${styles.textOnSurface}`}>24 Days<br/>to Go</span>
                  </div>
                </div>

                <div className="w-full space-y-3">
                  <div className={`p-4 rounded-2xl flex items-center justify-between transition-colors ${styles.bgSurfaceContainerLow}`}>
                     <span className={`font-bold text-sm ${styles.textOnSurface}`}>Follicular Phase</span>
                     <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm ${styles.textPrimary}`}><Activity className="w-4 h-4"/></div>
                  </div>
                  <div className={`p-4 rounded-2xl flex items-center justify-between transition-colors ${styles.bgSurfaceContainerLow}`}>
                     <span className={`font-bold text-sm ${styles.textOnSurface}`}>Log Symptoms</span>
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xl leading-none ${styles.bgPrimaryContainer} ${styles.textPrimary}`}>+</div>
                  </div>
                </div>
             </div>
          </div>
        </section>

        {/* 3. Tired of guessing your cycle? */}
        <section className="px-6 py-40 lg:py-56 max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 md:gap-24 items-center">
             {/* Left - Visual Placeholder matching Stitch's green character background */}
             <div className="w-full aspect-[4/3] bg-[#7a9d91] rounded-[2.5rem] shadow-lg flex items-center justify-center relative overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 space-y-4">
                   <HelpCircle className="w-24 h-24 stroke-1"/>
                   <span className="font-medium tracking-widest uppercase text-sm">Visual Asset Replaced</span>
                </div>
             </div>
             
             {/* Right - Pain Points */}
             <div className="space-y-12">
                <h2 className={`text-4xl md:text-5xl font-extrabold leading-tight mb-4 tracking-tighter ${styles.textOnSurface}`}>Tired of guessing your cycle?</h2>
                
                <div className="flex gap-6 items-start">
                   <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${styles.bgSurfaceContainerLow}`}>
                     <AlertTriangle className="w-6 h-6 text-[#a8364b]" />
                   </div>
                   <div>
                     <h3 className={`text-xl font-bold mb-2 ${styles.textOnSurface}`}>Unexpected periods</h3>
                     <p className={`leading-relaxed text-lg ${styles.textOnSurfaceVariant}`}>Never get caught off guard again with our early-warning alerts.</p>
                   </div>
                </div>

                <div className="flex gap-6 items-start">
                   <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${styles.bgSurfaceContainerLow}`}>
                     <Thermometer className={`w-6 h-6 ${styles.textPrimary}`} />
                   </div>
                   <div>
                     <h3 className={`text-xl font-bold mb-2 ${styles.textOnSurface}`}>Confusing predictions</h3>
                     <p className={`leading-relaxed text-lg ${styles.textOnSurfaceVariant}`}>Generic calendars don&apos;t know your body. We learn your specific rhythm.</p>
                   </div>
                </div>

                <div className="flex gap-6 items-start">
                   <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${styles.bgSurfaceContainerLow}`}>
                     <Activity className={`w-6 h-6 ${styles.textSecondary}`} />
                   </div>
                   <div>
                     <h3 className={`text-xl font-bold mb-2 ${styles.textOnSurface}`}>No real insights</h3>
                     <p className={`leading-relaxed text-lg ${styles.textOnSurfaceVariant}`}>Move beyond simple dates to understand how your hormones affect your energy.</p>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* 4. Everything you need, none of the fluff */}
        <section id="features" className="px-6 py-40 lg:py-56 max-w-7xl mx-auto w-full">
           <h2 className={`text-4xl md:text-5xl font-extrabold text-center mb-24 tracking-tighter ${styles.textOnSurface}`}>Everything you need, none of the fluff.</h2>
           
           <div className="grid md:grid-cols-3 gap-8">
              {/* Easy Tracking */}
              <div className={`p-10 rounded-[2.5rem] border-0 transition-transform duration-500 hover:-translate-y-2 ${styles.bgSurfaceContainerLow}`}>
                 <div className={`w-16 h-16 rounded-full bg-white flex items-center justify-center mb-8 shadow-sm ${styles.textPrimary}`}>
                   <Activity className="w-8 h-8" />
                 </div>
                 <h3 className={`text-2xl font-bold mb-4 ${styles.textOnSurface}`}>Easy Tracking</h3>
                 <p className={`leading-relaxed mb-10 text-lg ${styles.textOnSurfaceVariant}`}>Log your cycle, symptoms, and moods in seconds with our minimalist interface.</p>
                 <div className="bg-white p-5 rounded-full flex items-center gap-4 shadow-sm">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${styles.bgPrimary20}`}>
                     <div className={`w-4 h-4 rounded-full ${styles.bgPrimary}`}></div>
                   </div>
                   <div className={`flex-1 h-3 rounded-full overflow-hidden shadow-inner ${styles.bgSurfaceContainerLow}`}>
                     <div className={`w-[80%] h-full rounded-full ${styles.bgPrimary}`}></div>
                   </div>
                 </div>
              </div>

              {/* Smart Predictions */}
              <div className={`p-10 rounded-[2.5rem] border-0 transition-transform duration-500 hover:-translate-y-2 ${styles.bgSurfaceContainerLow}`}>
                 <div className={`w-16 h-16 rounded-full bg-white flex items-center justify-center mb-8 shadow-sm ${styles.textSecondary}`}>
                   <Sparkles className="w-8 h-8" />
                 </div>
                 <h3 className={`text-2xl font-bold mb-4 ${styles.textOnSurface}`}>Smart Predictions</h3>
                 <p className="text-[#594a77] leading-relaxed mb-10 text-lg font-medium">Advanced AI-based logic that adapts to your unique cycle variations.</p>
              </div>

              {/* Reminders */}
              <div className={`p-10 rounded-[2.5rem] border-0 transition-transform duration-500 hover:-translate-y-2 ${styles.bgSurfaceContainerLow}`}>
                 <div className={`w-16 h-16 rounded-full bg-white flex items-center justify-center mb-8 shadow-sm ${styles.textOnSurfaceVariant}`}>
                   <Clock className="w-8 h-8" />
                 </div>
                 <h3 className={`text-2xl font-bold mb-4 ${styles.textOnSurface}`}>Reminders</h3>
                 <p className={`leading-relaxed text-lg ${styles.textOnSurfaceVariant}`}>Gentle, customizable notifications before your next period or fertile window.</p>
              </div>

              {/* Private & Secure */}
              <div className="md:col-span-3 bg-[#8b4b61] p-12 lg:p-16 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 border-0 mt-4 overflow-hidden relative">
                 <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-150 transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                 <div className="max-w-2xl relative z-10">
                    <h3 className="text-3xl font-extrabold mb-4 tracking-tighter">Private & Secure</h3>
                    <p className="text-white/90 leading-relaxed text-xl">Your data is encrypted and stored securely. We do not sell your health data to third parties. Ever.</p>
                 </div>
                 <div className="flex items-center gap-4 border border-white/20 px-8 py-5 rounded-2xl shrink-0 bg-white/10 backdrop-blur-md relative z-10 shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
                    <Shield className="w-8 h-8 text-white drop-shadow-sm" />
                    <span className="font-bold text-white tracking-wide text-lg">End-to-End Encrypted</span>
                 </div>
              </div>
           </div>
        </section>

        {/* 5. Start Your Journey (3 steps) */}
        <section id="how-it-works" className={`px-6 py-40 lg:py-56 w-full ${styles.bgSurface}`}>
           <div className="max-w-5xl mx-auto">
              <h2 className={`text-4xl md:text-5xl font-extrabold text-center mb-28 tracking-tighter ${styles.textOnSurface}`}>Start Your Journey</h2>
              <div className="grid md:grid-cols-3 gap-16 relative">
                 <div className="hidden md:block absolute top-[48px] left-[15%] right-[15%] h-[2px] bg-white z-0"></div>
                 {[
                   { step: 1, title: "Log your cycle", desc: "Tap a few buttons to record your start and end dates." },
                   { step: 2, title: "Get predictions", desc: "See exactly when your next period and fertile window are expected." },
                   { step: 3, title: "Understand patterns", desc: "Discover how your cycle links to your mood, energy, and sleep." }
                 ].map((item, i) => (
                   <div key={i} className="relative z-10 flex flex-col items-center text-center">
                     <div className={`w-24 h-24 rounded-full bg-white font-bold text-3xl flex items-center justify-center mb-10 shadow-sm border-0 transition-transform duration-500 hover:-translate-y-2 ${styles.textPrimary}`}>
                       {item.step}
                     </div>
                     <h3 className={`text-2xl font-bold mb-4 ${styles.textOnSurface}`}>{item.title}</h3>
                     <p className={`leading-relaxed px-2 text-lg ${styles.textOnSurfaceVariant}`}>{item.desc}</p>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* 6. Trust Section - Science First */}
        <section className={`py-40 lg:py-56 px-6 w-full ${styles.bgSurfaceContainerLow}`}>
          <div className="max-w-4xl mx-auto text-center">
             <div className={`inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-bold tracking-widest uppercase mb-10 shadow-sm ${styles.bgPrimaryContainer} ${styles.textPrimary}`}>
                Science First
             </div>
             <h2 className={`text-4xl md:text-5xl font-extrabold mb-16 leading-tight tracking-tighter ${styles.textOnSurface}`}>Not magic. Just data.</h2>
             
             <div className="bg-white rounded-[2.5rem] p-12 md:p-16 shadow-sm mb-24 border-0 hover:shadow-md transition-shadow duration-500">
               <p className={`text-2xl md:text-3xl leading-relaxed mb-16 font-medium px-4 tracking-tight ${styles.textOnSurfaceVariant}`}>
                 &quot;Predictions are based on your past cycles. The more you log, the more accurate it becomes. We use standardized biological patterns combined with your personal data to provide the most reliable forecast possible.&quot;
               </p>
               <div className={`grid grid-cols-3 gap-6 pt-12 border-t text-center ${styles.borderSurfaceContainer}`}>
                  <div>
                    <div className={`text-5xl font-extrabold mb-3 tracking-tighter ${styles.textPrimary}`}>98%</div>
                    <div className={`text-sm font-bold uppercase tracking-widest ${styles.textOnSurfaceVariant}`}>Accuracy</div>
                  </div>
                  <div>
                    <div className={`text-5xl font-extrabold mb-3 tracking-tighter ${styles.textPrimary}`}>0</div>
                    <div className={`text-sm font-bold uppercase tracking-widest ${styles.textOnSurfaceVariant}`}>Ads Sold</div>
                  </div>
                  <div>
                    <div className={`text-5xl font-extrabold mb-3 tracking-tighter ${styles.textPrimary}`}>24/7</div>
                    <div className={`text-sm font-bold uppercase tracking-widest ${styles.textOnSurfaceVariant}`}>Support</div>
                  </div>
               </div>
             </div>
             
             {/* Community Quotes */}
             <div className="text-left max-w-4xl mx-auto mt-16">
                <h3 className={`text-2xl md:text-3xl font-extrabold mb-10 text-center md:text-left tracking-tighter ${styles.textOnSurface}`}>What our community says</h3>
                <div className="grid md:grid-cols-2 gap-10">
                   <div className={`p-10 rounded-[2.5rem] shadow-sm border-0 transition-transform duration-500 hover:-translate-y-2 ${styles.bgSurface}`}>
                      <p className={`italic mb-10 leading-relaxed text-xl font-medium tracking-tight ${styles.textOnSurfaceVariant}`}>&quot;Simple and clean. Finally something that just works without all the unnecessary pink flowers and weird advice.&quot;</p>
                      <div className="flex items-center gap-5 mt-auto">
                         <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${styles.bgPrimaryContainer} ${styles.textPrimary}`}>S</div>
                         <div>
                           <div className={`font-bold text-lg ${styles.textOnSurface}`}>Sarah J.</div>
                           <div className={`text-sm font-medium ${styles.textOnSurfaceVariant}`}>User since 2022</div>
                         </div>
                      </div>
                   </div>
                   <div className={`p-10 rounded-[2.5rem] shadow-sm border-0 transition-transform duration-500 hover:-translate-y-2 ${styles.bgSurface}`}>
                      <p className={`italic mb-10 leading-relaxed text-xl font-medium tracking-tight ${styles.textOnSurfaceVariant}`}>&quot;Feels private and safe compared to other apps. I actually trust where my data is going for the first time.&quot;</p>
                      <div className="flex items-center gap-5 mt-auto">
                         <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${styles.bgSecondaryContainer} ${styles.textSecondary}`}>E</div>
                         <div>
                           <div className={`font-bold text-lg ${styles.textOnSurface}`}>Elena R.</div>
                           <div className={`text-sm font-medium ${styles.textOnSurfaceVariant}`}>Beta Tester</div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className={`bg-white py-16 px-8 w-full border-t border-0 mt-auto ${styles.borderSurfaceContainer}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <HeartPulse className={`w-8 h-8 ${styles.textPrimary}`} />
            <span className={`font-extrabold text-2xl tracking-tighter ${styles.textOnSurface}`}>CycleSync</span>
          </div>
          <div className={`flex flex-wrap justify-center gap-10 text-base font-bold ${styles.textOnSurfaceVariant}`}>
            <Link href="#" className={`transition-colors ${styles.hoverTextPrimary}`}>Features</Link>
            <Link href="#" className={`transition-colors ${styles.hoverTextPrimary}`}>How It Works</Link>
            <Link href="#" className={`transition-colors ${styles.hoverTextPrimary}`}>Privacy</Link>
          </div>
          <Link href="/login" className={`px-8 py-3 font-bold rounded-full transition-colors shadow-sm ${styles.bgSurface} ${styles.textPrimary} ${styles.hoverBgSurfaceContainer}`}>
             Login
          </Link>
        </div>
      </footer>
    </div>
  );
}
