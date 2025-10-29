-- Crear tabla de categorías
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
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

-- Insertar categorías existentes
insert into public.categories (name) values
  ('collares'),
  ('cinturones'),
  ('brazaletes'),
  ('alpargatas')
on conflict (name) do nothing;

-- Modificar tabla de productos para usar referencia a categorías
alter table public.products
drop constraint if exists products_category_check;

alter table public.products
add column if not exists category_id uuid references public.categories(id) on delete set null;

-- Actualizar productos existentes con category_id
update public.products p
set category_id = c.id
from public.categories c
where c.name = p.category;

-- Eliminar columna de categoría antigua
alter table public.products
drop column if exists category;

-- Renombrar category_id a category para mantener consistencia
alter table public.products
rename column category_id to category;

-- Añadir constraint de not null a la nueva columna category
alter table public.products
alter column category set not null;
