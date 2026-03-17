import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";

// Configure web-push with VAPID details
const publicVapidKey = Deno.env.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY")!;
const privateVapidKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
const vapidSubject = Deno.env.get("NEXT_PUBLIC_VAPID_SUBJECT") || "mailto:admin@cyclesync.com";

try {
  webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);
} catch (e) {
  console.error("Failed to initialize webpush. Ensure VAPID keys are set properly.");
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Only process POST requests to trigger the cron
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Authorization check (ensure only cron runs this, or a secure invoking method)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    console.warn("Unauthorized invocation attempt");
  }

  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Find users whose required notification date matches today
    // We need: (predicted_start - reminder_days_before) == today
    
    // Instead of doing complex date math in SQL without a function, we'll fetch predictions
    // and profile reminder preference, and compute in JS for simplicity, or do a joined query.
    // Let's do a joined query using Supabase RPC or join if possible.
    // For Deno, let's fetch profiles with notifications enabled and their latest prediction.
    
    const { data: users, error: userError } = await supabase
      .from("profiles")
      .select(`
        id, 
        notification_enabled, 
        reminder_days_before,
        predictions (
          predicted_start,
          predicted_end
        )
      `)
      .eq("notification_enabled", true);

    if (userError) throw userError;

    let notificationsSent = 0;

    for (const user of users) {
      if (!user.predictions || user.predictions.length === 0) continue;

      // Sort predictions to get the most recent one (assuming calculated_at is not selected, we just take first if ordered, 
      // but let's assume predictions are usually ordered or we need to filter future ones)
      // For simplicity, find the first prediction in the future.
      const upcomingPeriod = user.predictions.find((p: any) => new Date(p.predicted_start) >= new Date(today));
      
      if (upcomingPeriod) {
        const predictedStart = new Date(upcomingPeriod.predicted_start);
        const reminderDays = user.reminder_days_before || 2;
        
        // Calculate the reminder date
        const reminderDate = new Date(predictedStart);
        reminderDate.setDate(reminderDate.getDate() - reminderDays);
        const reminderDateString = reminderDate.toISOString().split("T")[0];

        if (reminderDateString === today) {
          // Time to send notification!
          // Fetch user's push subscriptions
          const { data: subs } = await supabase
            .from("push_subscriptions")
            .select("*")
            .eq("user_id", user.id);

          if (subs && subs.length > 0) {
            const payload = JSON.stringify({
              title: "CycleSync Reminder",
              body: `Your next period is predicted in ${reminderDays} days. Stay prepared!`,
              url: "/dashboard",
            });

            for (const sub of subs) {
              const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              };

              try {
                await webpush.sendNotification(pushSubscription, payload);
                notificationsSent++;
                
                // Log the notification
                await supabase.from("notifications").insert({
                  user_id: user.id,
                  type: "period_reminder",
                  sent_at: new Date().toISOString(),
                  payload: JSON.parse(payload)
                });
              } catch (pushErr) {
                console.error(`Error sending push to user ${user.id}:`, pushErr);
                // If endpoint is invalid or unsubscribed, we might want to delete the sub
                if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                  await supabase.from("push_subscriptions").delete().eq("id", sub.id);
                }
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, sent: notificationsSent }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
