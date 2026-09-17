-- Seed local de desarrollo. Idempotente: se puede ejecutar más de una vez.
-- Alinea restaurants.id = 1 con VITE_RESTAURANT_ID del frontend.
-- Columnas: id, name, city, created_at (esta última la genera MySQL).

INSERT INTO restaurants (id, name, city)
VALUES (1, 'La Terraza Azul', 'Lima') AS new
ON DUPLICATE KEY UPDATE
  name = new.name,
  city = new.city;
