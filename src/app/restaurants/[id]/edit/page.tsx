import { notFound } from "next/navigation";
import RestaurantForm from "@/components/RestaurantForm";
import { getRestaurantById } from "@/lib/restaurants";

// DB から取得するため常に動的に評価する（ビルド時の静的化を防ぐ）。
export const dynamic = "force-dynamic";

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    notFound();
  }

  const restaurant = await getRestaurantById(numId);
  if (!restaurant) {
    notFound();
  }

  return (
    <RestaurantForm mode="edit" restaurantId={restaurant.id} initialValues={restaurant} />
  );
}
