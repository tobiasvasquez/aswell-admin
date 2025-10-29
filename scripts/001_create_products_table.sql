-- Crear tabla de productos para el inventario
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  stock integer not null default 0 check (stock >= 0),
  price decimal(10, 2),
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Crear índice para búsquedas más rápidas por categoría
create index if not exists idx_products_category on public.products(category);

-- Crear función para actualizar el campo updated_at automáticamente
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Crear trigger para actualizar updated_at
drop trigger if exists update_products_updated_at on public.products;
create trigger update_products_updated_at
  before update on public.products
  for each row
  execute function public.update_updated_at_column();

-- Insertar algunos productos de ejemplo
insert into public.products (name, category, stock, price, description) values
  ('Collar de Perlas', 'collares', 15, 25.99, 'Collar elegante con perlas naturales'),
  ('Cinturón de Cuero', 'cinturones', 8, 35.50, 'Cinturón de cuero genuino color marrón'),
  ('Brazalete Plateado', 'brazaletes', 20, 18.75, 'Brazalete de plata con diseño moderno'),
  ('Alpargatas Clásicas', 'alpargatas', 12, 42.00, 'Alpargatas cómodas para el verano');
