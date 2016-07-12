-- Get available inventory
SELECT inv.id, inv.item_name, inv.unit_price, (inv.quantity - SUM(COALESCE(alloc.quantity, 0))) AS avail_qty
FROM inventory AS inv
LEFT JOIN job_allocation AS alloc ON inv.id = alloc.inventory_id
GROUP BY inv.id
HAVING (inv.quantity - SUM(COALESCE(alloc.quantity, 0))) > 0;

