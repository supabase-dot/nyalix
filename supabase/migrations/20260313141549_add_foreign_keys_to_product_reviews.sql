-- Add foreign key constraints to product_reviews table
ALTER TABLE public.product_reviews
ADD CONSTRAINT fk_product_reviews_product_id
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.product_reviews
ADD CONSTRAINT fk_product_reviews_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.product_reviews
ADD CONSTRAINT fk_product_reviews_order_id
FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;