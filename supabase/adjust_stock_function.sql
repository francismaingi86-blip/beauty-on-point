-- Beauty on Point — atomic stock adjustment
--
-- Every sale, purchase receipt, purchase return, and credit note used to
-- push its own calculated "final" stock number straight to the products
-- table. If two devices adjusted the same product's stock at close to the
-- same time (two staff selling at once, a sale and a stock receipt
-- overlapping), whichever push landed second would silently overwrite the
-- first — the earlier change would just vanish, causing stock to drift
-- from reality over time (the "stock losing/gaining itself" symptom).
--
-- This function makes stock changes additive and atomic at the database
-- level: instead of "set stock to X", every change now says "add/subtract
-- X from whatever the current value is", computed inside a single
-- database operation. Concurrent changes from any number of devices now
-- correctly accumulate instead of racing each other.

create or replace function adjust_product_stock(p_id uuid, delta numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  new_stock numeric;
begin
  update products
  set stock = greatest(stock + delta, 0)
  where id = p_id
  returning stock into new_stock;

  return new_stock;
end;
$$;

grant execute on function adjust_product_stock(uuid, numeric) to authenticated;
