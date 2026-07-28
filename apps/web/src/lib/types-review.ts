export interface ReviewDto {
  id: string;
  rating: number;
  title: string;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: { id: string; name: string };
}
