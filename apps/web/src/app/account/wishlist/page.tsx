import { Heart } from "lucide-react";
import { EmptyState } from "../../../components/ui/EmptyState";

export default function WishlistPage() {
  return <EmptyState icon={Heart} title="Wishlist coming up" description="This is wired up in the next milestone." />;
}
