import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://lzfksqzuiavlwrnteykt.supabase.co"
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmtzcXp1aWF2bHdybnRleWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzEwMTMzOSwiZXhwIjoyMDgyNjc3MzM5fQ.i-wf4GvnfqUyMGKIFudYjGpJ1QOUg0C8A9-Zo5HUwGw"

const supabase = createClient(supabaseUrl, serviceKey)

async function testInvalidUuidQuery() {
  const mixedIds = ['user_3FxJM7P318YR7fpLom9VufrsUh9', '2b9a0c8b-0970-48e2-811a-ddc4707638d0']

  console.log("--- Testing .in('shared_with_id', mixedIds) ---")
  const { data: d1, error: e1 } = await supabase
    .from("shared_items")
    .select("resource_id")
    .in("shared_with_id", mixedIds)

  console.log("Result 1 (mixedIds):", d1, e1)

  const validUuids = mixedIds.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
  console.log("\n--- Testing .in('shared_with_id', validUuids) ---")
  const { data: d2, error: e2 } = await supabase
    .from("shared_items")
    .select("resource_id")
    .in("shared_with_id", validUuids)

  console.log("Result 2 (validUuids):", d2, e2)
}

testInvalidUuidQuery()
