import { ClipboardList } from "lucide-react"
import { ComingSoonPage } from "@/components/shared/ComingSoonPage"

export function PurchasesPage() {
  return (
    <ComingSoonPage
      title="Purchases"
      description="Purchase orders, receiving, and returns."
      icon={ClipboardList}
    />
  )
}

export default PurchasesPage
