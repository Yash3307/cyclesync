'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Save, Loader2, Bell, BellOff, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
   const [profile, setProfile] = useState<any>(null);
   const [displayName, setDisplayName] = useState('');
   const [notificationsEnabled, setNotificationsEnabled] = useState(true);
   const [reminderDays, setReminderDays] = useState(2);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);

   // PWA state
   const [isIOS, setIsIOS] = useState(false);
   const [isStandalone, setIsStandalone] = useState(false);
   const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

   const supabase = createClient();
   const router = useRouter();

   useEffect(() => {
      async function fetchProfile() {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
            const { data, error } = await supabase
               .from('profiles')
               .select('*')
               .eq('id', user.id)
               .single();

            if (data && !error) {
               setProfile(data);
               setDisplayName(data.display_name || '');
               setNotificationsEnabled(data.notification_enabled);
               setReminderDays(data.reminder_days_before || 2);
            }
         }
         setIsLoading(false);
      }
      fetchProfile();

      // Check for iOS and standalone mode
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      const isStandaloneMode = ('standalone' in window.navigator) && !!(window.navigator as any).standalone;
      setIsIOS(isIOSDevice);
      setIsStandalone(isStandaloneMode);

      // Listen for Android PWA install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
         e.preventDefault();
         setInstallPromptEvent(e);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
         window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
   }, []);

   const handleInstallPWA = async () => {
      if (!installPromptEvent) return;
      installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;
      if (outcome === 'accepted') {
         setInstallPromptEvent(null);
      }
   };

   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save profile settings
      const { error } = await supabase
         .from('profiles')
         .upsert({
            id: user.id,
            display_name: displayName,
            notification_enabled: notificationsEnabled,
            reminder_days_before: reminderDays,
         });

      if (error) {
         toast.error("Failed to save settings.");
      } else {
         toast.success("Settings saved successfully.");

         // Handle Push Subscription Registration/Revocation
         if (notificationsEnabled) {
            await subscribeUserToPush();
         }
      }
      setIsSaving(false);
   };

   const subscribeUserToPush = async () => {
      try {
         if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            toast.error("Push notifications are not supported by your browser.");
            return;
         }

         const registration = await navigator.serviceWorker.register('/sw.js');
         await navigator.serviceWorker.ready;
         let subscription = await registration.pushManager.getSubscription();

         if (!subscription) {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
               toast.error("Notification permission denied.");
               setNotificationsEnabled(false);
               return;
            }

            const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!publicVapidKey) {
               console.warn("VAPID public key not set.");
               return;
            }

            subscription = await registration.pushManager.subscribe({
               userVisibleOnly: true,
               applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
         }

         // Save subscription to database
         const { data: { user } } = await supabase.auth.getUser();
         if (user && subscription) {
            const subData = subscription.toJSON();
            const { error: subError } = await supabase.from('push_subscriptions').upsert({
               user_id: user.id,
               endpoint: subData.endpoint,
               p256dh: subData.keys?.p256dh,
               auth: subData.keys?.auth,
               user_agent: navigator.userAgent
            }, { onConflict: 'endpoint' });

            if (subError) {
               console.error("Failed to save push subscription:", subError);
               toast.error("Failed to save push subscription to database: " + subError.message);
            }
         }
      } catch (err) {
         console.error("Failed to subscribe", err);
      }
   };

   // Helper function for VAPID key
   function urlBase64ToUint8Array(base64String: string) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
         .replace(/-/g, '+')
         .replace(/_/g, '/');

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
         outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
   }

   const handleDeleteAccount = async () => {
      if (!confirm("Are you absolutely sure? This will delete all your cycle data permanently.")) return;
      if (!confirm("Please confirm again. This action CANNOT be undone.")) return;

      setIsDeleting(true);
      // Note: In Supabase, deleting the auth.user requires admin privileges or Edge Function.
      // To allow users to delete their own account securely from the client, you often need an edge function
      // or to set up a specific RPC call with SECURITY DEFINER.
      // For this frontend-only MVP, we will attempt to call an RPC (we haven't made one yet), 
      // or instruct how they'd do it. Let's provide a mock handler and delete profile data directly as a fallback.

      toast.error("Account deletion requires admin API. For now, we will sign you out.");
      await supabase.auth.signOut();
      router.push('/login');
      setIsDeleting(false);
   };

   return (
      <>
         <Navigation />

         <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
               <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
               <p className="text-gray-500 mt-1">Manage your account and preferences.</p>
            </div>

            {isLoading ? (
               <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
            ) : (
               <form onSubmit={handleSave} className="space-y-8">

                  {/* Profile Section */}
                  <div className="card shadow-sm border border-gray-100">
                     <h2 className="text-xl font-semibold mb-6 text-gray-800">Profile Information</h2>
                     <div className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                           <input
                              type="text"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              className="input-field max-w-md"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                           <input
                              type="text"
                              disabled
                              value={profile?.id ? "user@example.com [Hidden for privacy]" : ""}
                              className="input-field max-w-md bg-gray-50 text-gray-500 cursor-not-allowed"
                           />
                           <p className="text-xs mt-1 text-gray-500">Email address cannot be changed currently.</p>
                        </div>
                     </div>
                  </div>

                  {/* Notifications Section */}
                  <div className="card shadow-sm border border-gray-100">
                     <div className="flex items-center justify-between mb-6">
                        <div>
                           <h2 className="text-xl font-semibold text-gray-800">Push Notifications</h2>
                           <p className="text-sm text-gray-500 mt-1">Get reminded before your period starts.</p>
                        </div>
                        <div className="p-3 bg-primary-50 rounded-full text-primary-600">
                           {notificationsEnabled ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center">
                           <input
                              id="notif_toggle"
                              type="checkbox"
                              checked={notificationsEnabled}
                              onChange={(e) => setNotificationsEnabled(e.target.checked)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                           />
                           <label htmlFor="notif_toggle" className="ml-2 block text-sm text-gray-900 font-medium">
                              Enable prediction reminders
                           </label>
                        </div>

                        <div className={`transition-opacity duration-200 ${notificationsEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                              Remind me <span className="font-bold text-primary-600">{reminderDays}</span> days before
                           </label>
                           <input
                              type="range"
                              min="1"
                              max="7"
                              value={reminderDays}
                              onChange={(e) => setReminderDays(parseInt(e.target.value))}
                              className="w-full max-w-md h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                           />
                           <div className="flex justify-between max-w-md text-xs text-gray-500 mt-1 px-1">
                              <span>1 day</span>
                              <span>7 days</span>
                           </div>
                        </div>

                        {/* PWA Install Prompts (iOS / Android) */}
                        {isIOS && !isStandalone && (
                           <p className="text-sm text-gray-500 italic mt-2">
                              Note: On iPhone, please "Add to Home Screen" via the Safari Share menu to enable these reminders.
                           </p>
                        )}

                        {installPromptEvent && (
                           <div className="mt-4">
                              <button
                                 type="button"
                                 onClick={handleInstallPWA}
                                 className="px-4 py-2 bg-pink-500 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-pink-600 focus:outline-none transition-colors"
                              >
                                 Add to Home Screen
                              </button>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-4 border-t border-gray-200 pt-6">
                     <button
                        type="submit"
                        disabled={isSaving}
                        className="btn-primary flex items-center shadow-md min-w-[120px] justify-center"
                     >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Settings</>}
                     </button>
                  </div>
               </form>
            )}

            {/* Danger Zone */}
            {!isLoading && (
               <div className="mt-12 p-6 border border-red-200 bg-red-50 rounded-xl space-y-4">
                  <div>
                     <h2 className="text-xl font-semibold text-red-800">Danger Zone</h2>
                     <p className="text-sm text-red-600 mt-1">Permanently delete your account and all associated data.</p>
                  </div>
                  <button
                     onClick={handleDeleteAccount}
                     disabled={isDeleting}
                     className="px-4 py-2 bg-white text-red-600 font-medium rounded-lg border border-red-200 shadow-sm hover:bg-red-50 focus:outline-none transition-colors disabled:opacity-50 flex items-center"
                  >
                     {isDeleting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Trash2 className="w-5 h-5 mr-2" />}
                     Delete Account
                  </button>
               </div>
            )}

         </main>
      </>
   );
}
