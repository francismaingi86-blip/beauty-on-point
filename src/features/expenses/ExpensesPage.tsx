import { Receipt } from "lucide-react"
import { ComingSoonPage } from "@/components/shared/ComingSoonPage"

export function ExpensesPage() {
  return (
    <ComingSoonPage
      title="Expenses"
      description="Categories, receipts, and expense reports."
      icon={Receipt}
    />
  )
}

export default ExpensesPage
