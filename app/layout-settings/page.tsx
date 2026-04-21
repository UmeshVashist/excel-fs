import { Suspense } from "react"
import { LayoutSettingsContent } from "./layout-settings-content"

export default function LayoutSettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LayoutSettingsContent />
    </Suspense>
  )
}
