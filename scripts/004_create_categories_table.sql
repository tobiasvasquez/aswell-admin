-- Crear tabla de categorías
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#6366f1',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Crear índice para búsquedas más rápidas por nombre
create index if not exists idx_categories_name on public.categories(name);

-- Crear función para actualizar el campo updated_at automáticamente
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Crear trigger para actualizar updated_at
drop trigger if exists update_categories_updated_at on public.categories;
create trigger update_categories_updated_at
  before update on public.categories
  for each row
  execute function public.update_updated_at_column();

-- Insertar categorías existentes con colores por defecto
insert into public.categories (name, color) values
  ('collares', '#3b82f6'),
  ('cinturones', '#10b981'),
  ('brazaletes', '#8b5cf6'),
  ('alpargatas', '#f59e0b')
on conflict (name) do nothing;

-- Modificar tabla de productos para usar referencia a categorías
alter table public.products
drop constraint if exists products_category_check;

alter table public.products
add column if not exists category_id uuid references public.categories(id) on delete set null;

-- Crear una tabla temporal para mapear categorías
create temp table category_mapping as
select p.id as product_id, c.id as category_id
from public.products p,
     public.categories c
where c.name = p.category::text;

-- Actualizar productos existentes con category_id usando la tabla temporal
update public.products
set category_id = (
  select category_id from category_mapping
  where product_id = public.products.id
)
where id in (select product_id from category_mapping);

-- Asegurar que todos los productos tengan category_id
update public.products
set category_id = (
  select id from public.categories
  where name = 'collares'
  limit 1
)
where category_id is null;

-- Eliminar columna de categoría antigua
alter table public.products
drop column if exists category;

-- Renombrar category_id a category para mantener consistencia
alter table public.products
rename column category_id to category;

-- Añadir constraint de not null a la nueva columna category
alter table public.products
alter column category set not null;
