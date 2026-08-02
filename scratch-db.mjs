import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://lzfksqzuiavlwrnteykt.supabase.co"
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmtzcXp1aWF2bHdybnRleWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzEwMTMzOSwiZXhwIjoyMDgyNjc3MzM5fQ.i-wf4GvnfqUyMGKIFudYjGpJ1QOUg0C8A9-Zo5HUwGw"

const supabase = createClient(supabaseUrl, serviceKey)

async function fixSharedItemsClerkId() {
  console.log("=== CHECKING SHARED ITEMS WITH NULL CLERK_USER_ID ===")
  const { data: shares, error } = await supabase.from("shared_items").select("*")
  console.log("All shared items:", shares, error || "")

  const { data: profiles } = await supabase.from("profiles").select("id, clerk_user_id")
  const profileMap = new Map((profiles || []).map((p) => [p.id, p.clerk_user_id]))

  if (shares && shares.length > 0) {
    for (const share of shares) {
      const ownerClerkId = profileMap.get(share.owner_id)
      if (ownerClerkId) {
        console.log(`Updating share ${share.id} with clerk_user_id: ${ownerClerkId}`)
        const { error: updateErr } = await supabase
          .from("shared_items")
          .update({ clerk_user_id: ownerClerkId })
          .eq("id", share.id)
        
        if (updateErr) {
          console.error("Update error:", updateErr)
        } else {
          console.log("Successfully updated!")
        }
      }
    }
  }

  const { data: updatedShares } = await supabase.from("shared_items").select("*")
  console.log("=== UPDATED SHARED ITEMS ===")
  console.log(JSON.stringify(updatedShares, null, 2))
}

fixSharedItemsClerkId()
