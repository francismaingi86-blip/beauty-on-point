import { Boxes } from "lucide-react"
import { ComingSoonPage } from "@/components/shared/ComingSoonPage"

export function InventoryPage() {
  return (
    <ComingSoonPage
      title="Inventory"
      description="Stock in/out, adjustments, transfers, stock takes."
      icon={Boxes}
    />
  )
}

export default InventoryPage
