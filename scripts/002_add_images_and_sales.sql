-- Agregar campo de imágenes a la tabla de productos
alter table public.products
add column if not exists images text[] default '{}';

-- Crear tabla para registrar las transacciones de ventas
create table if not exists public.sales_transactions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  product_name text not null,
  quantity_sold integer not null check (quantity_sold > 0),
  unit_price decimal(10, 2) not null,
  total_amount decimal(10, 2) not null,
  created_at timestamp with time zone default now()
);

-- Crear índice para búsquedas más rápidas por producto
create index if not exists idx_sales_product_id on public.sales_transactions(product_id);

-- Crear índice para búsquedas por fecha
create index if not exists idx_sales_created_at on public.sales_transactions(created_at desc);

-- Actualizar productos existentes con imágenes de placeholder
update public.products
set images = array[
  '/placeholder.svg?height=400&width=400&query=' || name || ' ' || category
]
where images = '{}' or images is null;
