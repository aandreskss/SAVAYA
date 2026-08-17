-- =============================================================
-- SAVAYA TIENDA NUEVA — Seed de datos iniciales + Admin
-- Ejecutar en Supabase > SQL Editor > New query
-- Requiere haber ejecutado SUPABASE_MANUAL_MIGRATION.sql primero
-- =============================================================

DO $$
DECLARE
  -- Sizes
  v_s35 uuid; v_s36 uuid; v_s37 uuid; v_s38 uuid; v_s39 uuid; v_s40 uuid;

  -- Shipping
  v_zone_carabobo uuid;
  v_zone_nacional  uuid;
  v_zone_pickup    uuid;
  v_method_carabobo uuid;
  v_method_zoom    uuid;
  v_method_tealca  uuid;
  v_method_mrw     uuid;
  v_method_pickup  uuid;

  -- CMS
  v_home_page uuid;

  -- Roles
  v_role_super_admin      uuid; v_role_admin         uuid; v_role_catalog       uuid;
  v_role_inventory        uuid; v_role_sales          uuid; v_role_finance       uuid;
  v_role_customer_service uuid; v_role_marketing      uuid; v_role_analyst       uuid;

  -- Permissions (29 total)
  v_p_catalog_read   uuid; v_p_catalog_write   uuid; v_p_catalog_delete   uuid;
  v_p_inv_read       uuid; v_p_inv_write       uuid;
  v_p_ord_read       uuid; v_p_ord_write       uuid;
  v_p_pay_read       uuid; v_p_pay_approve     uuid; v_p_pay_reject       uuid;
  v_p_cust_read      uuid; v_p_cust_write      uuid;
  v_p_cms_read       uuid; v_p_cms_write       uuid;
  v_p_promo_read     uuid; v_p_promo_write     uuid;
  v_p_ship_read      uuid; v_p_ship_write      uuid;
  v_p_exch_read      uuid; v_p_exch_write      uuid; v_p_exch_override    uuid;
  v_p_analytics_read uuid;
  v_p_users_read     uuid; v_p_users_write     uuid;
  v_p_roles_read     uuid; v_p_roles_write     uuid;
  v_p_settings_read  uuid; v_p_settings_write  uuid; v_p_settings_payment uuid;

  -- Admin user
  v_admin_user_id uuid;
  v_super_admin_role_id uuid;

BEGIN

  -- ============================================================
  -- GUARD: abortar si ya hay datos
  -- ============================================================
  IF EXISTS (SELECT 1 FROM sizes LIMIT 1) THEN
    RAISE NOTICE 'Seed ya aplicado (sizes encontradas). Abortando.';
    RETURN;
  END IF;

  -- ============================================================
  -- 1. SIZES
  -- ============================================================
  INSERT INTO sizes (name, sort_order) VALUES ('35', 1) RETURNING id INTO v_s35;
  INSERT INTO sizes (name, sort_order) VALUES ('36', 2) RETURNING id INTO v_s36;
  INSERT INTO sizes (name, sort_order) VALUES ('37', 3) RETURNING id INTO v_s37;
  INSERT INTO sizes (name, sort_order) VALUES ('38', 4) RETURNING id INTO v_s38;
  INSERT INTO sizes (name, sort_order) VALUES ('39', 5) RETURNING id INTO v_s39;
  INSERT INTO sizes (name, sort_order) VALUES ('40', 6) RETURNING id INTO v_s40;

  -- ============================================================
  -- 2. COLORS (19)
  -- ============================================================
  INSERT INTO colors (name, hex) VALUES
    ('Negro',       '#111111'),
    ('Blanco',      '#FFFFFF'),
    ('Beige',       '#D4B896'),
    ('Café',        '#6B3F2A'),
    ('Camel',       '#C19A6B'),
    ('Gris',        '#9E9E9E'),
    ('Plateado',    '#C0C0C0'),
    ('Dorado',      '#C9A227'),
    ('Rosado',      '#F4A7B9'),
    ('Rojo',        '#C0362C'),
    ('Azul',        '#1E3A8A'),
    ('Azul marino', '#172554'),
    ('Verde',       '#1E7F4F'),
    ('Mostaza',     '#B8791A'),
    ('Naranja',     '#EA580C'),
    ('Lila',        '#A855F7'),
    ('Nude',        '#E8C9A5'),
    ('Multicolor',  NULL),
    ('Estampado',   NULL);

  -- ============================================================
  -- 3. CATEGORIES (7 — mujeres, top-level)
  -- ============================================================
  INSERT INTO categories (name, slug, is_active, sort_order) VALUES
    ('Sandalias',   'sandalias',   true, 1),
    ('Tacones',     'tacones',     true, 2),
    ('Plataformas', 'plataformas', true, 3),
    ('Flats',       'flats',       true, 4),
    ('Botas',       'botas',       true, 5),
    ('Sneakers',    'sneakers',    true, 6),
    ('Mules',       'mules',       true, 7);

  -- ============================================================
  -- 4. PAYMENT METHODS (6)
  -- ============================================================
  INSERT INTO payment_methods (name, type, currency, is_active, instructions, account_details, sort_order) VALUES
    ('Zelle',                'zelle',         'usd', true,
     'Realiza tu transferencia Zelle al email o teléfono indicado. Guarda el comprobante con la referencia de confirmación.',
     '{}', 1),
    ('Pago Móvil',           'pago_movil',    'ves', true,
     'Realiza tu pago móvil al banco, teléfono y cédula indicados. Incluye tu cédula en la referencia.',
     '{}', 2),
    ('Transferencia Bancaria','bank_transfer', 'ves', true,
     'Realiza la transferencia a la cuenta indicada. Envía el comprobante con la referencia bancaria.',
     '{}', 3),
    ('USDT TRC20',           'usdt_trc20',    'usd', true,
     'Envía USDT por la red TRC20 a la dirección de wallet indicada. Incluye el hash de la transacción.',
     '{}', 4),
    ('Binance Pay',          'binance_pay',   'usd', true,
     'Envía el pago a nuestro Pay ID de Binance. Adjunta la captura de confirmación.',
     '{}', 5),
    ('Efectivo',             'cash',          'usd', true,
     'Solo disponible para retiro en tienda. Cancela en el local al retirar tu pedido. Dirección: CC Multi Tienda God is Good, local A-4, Valencia, Carabobo.',
     '{}', 6);

  -- ============================================================
  -- 5. SHIPPING
  -- ============================================================

  -- Zona 1: Delivery Carabobo
  INSERT INTO shipping_zones (name, type, is_active, sort_order)
    VALUES ('Delivery Carabobo', 'local_delivery', true, 1)
    RETURNING id INTO v_zone_carabobo;

  INSERT INTO shipping_cities (zone_id, name, state, is_active) VALUES
    (v_zone_carabobo, 'Valencia',        'Carabobo', true),
    (v_zone_carabobo, 'Naguanagua',      'Carabobo', true),
    (v_zone_carabobo, 'San Diego',       'Carabobo', true),
    (v_zone_carabobo, 'Libertador',      'Carabobo', true),
    (v_zone_carabobo, 'Los Guayos',      'Carabobo', true),
    (v_zone_carabobo, 'Guacara',         'Carabobo', true),
    (v_zone_carabobo, 'San Joaquín',     'Carabobo', true),
    (v_zone_carabobo, 'Bejuma',          'Carabobo', true),
    (v_zone_carabobo, 'Montalbán',       'Carabobo', true),
    (v_zone_carabobo, 'Miranda',         'Carabobo', true),
    (v_zone_carabobo, 'Puerto Cabello',  'Carabobo', true),
    (v_zone_carabobo, 'Carlos Arvelo',   'Carabobo', true),
    (v_zone_carabobo, 'Diego Ibarra',    'Carabobo', true),
    (v_zone_carabobo, 'Juan José Mora',  'Carabobo', true);

  INSERT INTO shipping_methods (zone_id, name, provider, estimated_days, is_active)
    VALUES (v_zone_carabobo, 'Delivery a domicilio', NULL, 1, true)
    RETURNING id INTO v_method_carabobo;

  INSERT INTO shipping_rates (method_id, city_id, min_order_usd, max_order_usd, rate_usd, free_shipping_threshold_usd)
    VALUES (v_method_carabobo, NULL, '0', NULL, '3', '80');

  -- Zona 2: Envío Nacional
  INSERT INTO shipping_zones (name, type, is_active, sort_order)
    VALUES ('Envío Nacional', 'national_agency', true, 2)
    RETURNING id INTO v_zone_nacional;

  INSERT INTO shipping_cities (zone_id, name, state, is_active) VALUES
    (v_zone_nacional, 'Caracas',         'Distrito Capital', true),
    (v_zone_nacional, 'Valencia',        'Carabobo',         true),
    (v_zone_nacional, 'Maracay',         'Aragua',           true),
    (v_zone_nacional, 'Barquisimeto',    'Lara',             true),
    (v_zone_nacional, 'Puerto La Cruz',  'Anzoátegui',       true),
    (v_zone_nacional, 'Puerto Ordaz',    'Bolívar',          true),
    (v_zone_nacional, 'Barinas',         'Barinas',          true),
    (v_zone_nacional, 'San Cristóbal',   'Táchira',          true),
    (v_zone_nacional, 'Mérida',          'Mérida',           true),
    (v_zone_nacional, 'Maracaibo',       'Zulia',            true),
    (v_zone_nacional, 'Acarigua',        'Portuguesa',       true),
    (v_zone_nacional, 'San Félix',       'Bolívar',          true),
    (v_zone_nacional, 'Guanare',         'Portuguesa',       true),
    (v_zone_nacional, 'El Tigre',        'Anzoátegui',       true),
    (v_zone_nacional, 'Cantaura',        'Anzoátegui',       true),
    (v_zone_nacional, 'Puerto Cabello',  'Carabobo',         true),
    (v_zone_nacional, 'Valera',          'Trujillo',         true),
    (v_zone_nacional, 'Trujillo',        'Trujillo',         true),
    (v_zone_nacional, 'Maturín',         'Monagas',          true),
    (v_zone_nacional, 'Upata',           'Bolívar',          true),
    (v_zone_nacional, 'Valle la Pascua', 'Guárico',          true);

  INSERT INTO shipping_methods (zone_id, name, provider, estimated_days, is_active)
    VALUES (v_zone_nacional, 'Zoom', 'Zoom', 3, true)
    RETURNING id INTO v_method_zoom;
  INSERT INTO shipping_rates (method_id, city_id, min_order_usd, rate_usd, free_shipping_threshold_usd)
    VALUES (v_method_zoom, NULL, '0', '5', '80');

  INSERT INTO shipping_methods (zone_id, name, provider, estimated_days, is_active)
    VALUES (v_zone_nacional, 'Tealca', 'Tealca', 3, true)
    RETURNING id INTO v_method_tealca;
  INSERT INTO shipping_rates (method_id, city_id, min_order_usd, rate_usd, free_shipping_threshold_usd)
    VALUES (v_method_tealca, NULL, '0', '5', '80');

  INSERT INTO shipping_methods (zone_id, name, provider, estimated_days, is_active)
    VALUES (v_zone_nacional, 'MRW', 'MRW', 4, true)
    RETURNING id INTO v_method_mrw;
  INSERT INTO shipping_rates (method_id, city_id, min_order_usd, rate_usd, free_shipping_threshold_usd)
    VALUES (v_method_mrw, NULL, '0', '5', '80');

  -- Zona 3: Retiro en Tienda
  INSERT INTO shipping_zones (name, type, is_active, sort_order)
    VALUES ('Retiro en Tienda', 'pickup', true, 3)
    RETURNING id INTO v_zone_pickup;

  INSERT INTO shipping_methods (zone_id, name, provider, estimated_days, is_active)
    VALUES (v_zone_pickup, 'Retiro en local', NULL, 0, true)
    RETURNING id INTO v_method_pickup;

  INSERT INTO shipping_rates (method_id, city_id, min_order_usd, rate_usd, free_shipping_threshold_usd)
    VALUES (v_method_pickup, NULL, '0', '0', NULL);

  -- ============================================================
  -- 6. APPLICATION SETTINGS (14)
  -- ============================================================
  INSERT INTO application_settings (key, value, description) VALUES
    ('reservation_expiry_hours',    '24',                          'Horas antes de que expire la reserva de inventario de un pedido en PENDING_PAYMENT'),
    ('partial_payment_options',     '20,35,50',                    'Porcentajes disponibles para reserva parcial (adelanto). Separados por coma.'),
    ('free_shipping_threshold_usd', '80',                          'Monto mínimo en USD a partir del cual el envío es gratis'),
    ('standard_shipping_cost_usd',  '5',                           'Costo de envío estándar nacional en USD'),
    ('express_shipping_cost_usd',   '10',                          'Costo de envío express nacional en USD'),
    ('store_whatsapp',              '584141100100',                 'Número de WhatsApp de la tienda en formato internacional sin +'),
    ('usdt_policy',                 'pending',                     'Política de tasa USDT: "1:1" usa 1 USDT = 1 USD. Configurar antes de activar el método en producción.'),
    ('store_name',                  'Savaya',                      'Nombre de la tienda'),
    ('store_tagline',               'Marca tu moda',               'Tagline de la tienda'),
    ('store_email',                 'Savayarrss@gmail.com',        'Email de contacto de la tienda'),
    ('store_instagram',             '@Savayavzla',                 'Instagram de la tienda'),
    ('store_address',               'Calle 73, CC Multi Tienda God is Good, local A-4, Valencia, Carabobo', 'Dirección física de la tienda'),
    ('low_stock_threshold',         '3',                           'Cantidad mínima de unidades antes de mostrar alerta de stock bajo'),
    ('order_number_prefix',         'SAV',                         'Prefijo del número de pedido (ej. SAV-000001)');

  -- ============================================================
  -- 7. ROLES (9)
  -- ============================================================
  INSERT INTO roles (name, description, is_system) VALUES ('super_admin',      'Super Admin',       true) RETURNING id INTO v_role_super_admin;
  INSERT INTO roles (name, description, is_system) VALUES ('admin',            'Admin',             true) RETURNING id INTO v_role_admin;
  INSERT INTO roles (name, description, is_system) VALUES ('catalog',          'Catalog',           true) RETURNING id INTO v_role_catalog;
  INSERT INTO roles (name, description, is_system) VALUES ('inventory',        'Inventory',         true) RETURNING id INTO v_role_inventory;
  INSERT INTO roles (name, description, is_system) VALUES ('sales',            'Sales',             true) RETURNING id INTO v_role_sales;
  INSERT INTO roles (name, description, is_system) VALUES ('finance',          'Finance',           true) RETURNING id INTO v_role_finance;
  INSERT INTO roles (name, description, is_system) VALUES ('customer_service', 'Customer Service',  true) RETURNING id INTO v_role_customer_service;
  INSERT INTO roles (name, description, is_system) VALUES ('marketing',        'Marketing',         true) RETURNING id INTO v_role_marketing;
  INSERT INTO roles (name, description, is_system) VALUES ('analyst',          'Analyst',           true) RETURNING id INTO v_role_analyst;

  -- ============================================================
  -- 8. PERMISSIONS (29)
  -- ============================================================
  INSERT INTO permissions (resource, action) VALUES ('catalog',        'read')             RETURNING id INTO v_p_catalog_read;
  INSERT INTO permissions (resource, action) VALUES ('catalog',        'write')            RETURNING id INTO v_p_catalog_write;
  INSERT INTO permissions (resource, action) VALUES ('catalog',        'delete')           RETURNING id INTO v_p_catalog_delete;
  INSERT INTO permissions (resource, action) VALUES ('inventory',      'read')             RETURNING id INTO v_p_inv_read;
  INSERT INTO permissions (resource, action) VALUES ('inventory',      'write')            RETURNING id INTO v_p_inv_write;
  INSERT INTO permissions (resource, action) VALUES ('orders',         'read')             RETURNING id INTO v_p_ord_read;
  INSERT INTO permissions (resource, action) VALUES ('orders',         'write')            RETURNING id INTO v_p_ord_write;
  INSERT INTO permissions (resource, action) VALUES ('payments',       'read')             RETURNING id INTO v_p_pay_read;
  INSERT INTO permissions (resource, action) VALUES ('payments',       'approve')          RETURNING id INTO v_p_pay_approve;
  INSERT INTO permissions (resource, action) VALUES ('payments',       'reject')           RETURNING id INTO v_p_pay_reject;
  INSERT INTO permissions (resource, action) VALUES ('customers',      'read')             RETURNING id INTO v_p_cust_read;
  INSERT INTO permissions (resource, action) VALUES ('customers',      'write')            RETURNING id INTO v_p_cust_write;
  INSERT INTO permissions (resource, action) VALUES ('cms',            'read')             RETURNING id INTO v_p_cms_read;
  INSERT INTO permissions (resource, action) VALUES ('cms',            'write')            RETURNING id INTO v_p_cms_write;
  INSERT INTO permissions (resource, action) VALUES ('promotions',     'read')             RETURNING id INTO v_p_promo_read;
  INSERT INTO permissions (resource, action) VALUES ('promotions',     'write')            RETURNING id INTO v_p_promo_write;
  INSERT INTO permissions (resource, action) VALUES ('shipping',       'read')             RETURNING id INTO v_p_ship_read;
  INSERT INTO permissions (resource, action) VALUES ('shipping',       'write')            RETURNING id INTO v_p_ship_write;
  INSERT INTO permissions (resource, action) VALUES ('exchange_rates', 'read')             RETURNING id INTO v_p_exch_read;
  INSERT INTO permissions (resource, action) VALUES ('exchange_rates', 'write')            RETURNING id INTO v_p_exch_write;
  INSERT INTO permissions (resource, action) VALUES ('exchange_rates', 'override')         RETURNING id INTO v_p_exch_override;
  INSERT INTO permissions (resource, action) VALUES ('analytics',      'read')             RETURNING id INTO v_p_analytics_read;
  INSERT INTO permissions (resource, action) VALUES ('users',          'read')             RETURNING id INTO v_p_users_read;
  INSERT INTO permissions (resource, action) VALUES ('users',          'write')            RETURNING id INTO v_p_users_write;
  INSERT INTO permissions (resource, action) VALUES ('roles',          'read')             RETURNING id INTO v_p_roles_read;
  INSERT INTO permissions (resource, action) VALUES ('roles',          'write')            RETURNING id INTO v_p_roles_write;
  INSERT INTO permissions (resource, action) VALUES ('settings',       'read')             RETURNING id INTO v_p_settings_read;
  INSERT INTO permissions (resource, action) VALUES ('settings',       'write')            RETURNING id INTO v_p_settings_write;
  INSERT INTO permissions (resource, action) VALUES ('settings',       'payment_accounts') RETURNING id INTO v_p_settings_payment;

  -- ============================================================
  -- 9. ROLE → PERMISSIONS
  -- ============================================================

  -- super_admin: all 29
  INSERT INTO role_permissions (role_id, permission_id) VALUES
    (v_role_super_admin, v_p_catalog_read),   (v_role_super_admin, v_p_catalog_write),
    (v_role_super_admin, v_p_catalog_delete), (v_role_super_admin, v_p_inv_read),
    (v_role_super_admin, v_p_inv_write),      (v_role_super_admin, v_p_ord_read),
    (v_role_super_admin, v_p_ord_write),      (v_role_super_admin, v_p_pay_read),
    (v_role_super_admin, v_p_pay_approve),    (v_role_super_admin, v_p_pay_reject),
    (v_role_super_admin, v_p_cust_read),      (v_role_super_admin, v_p_cust_write),
    (v_role_super_admin, v_p_cms_read),       (v_role_super_admin, v_p_cms_write),
    (v_role_super_admin, v_p_promo_read),     (v_role_super_admin, v_p_promo_write),
    (v_role_super_admin, v_p_ship_read),      (v_role_super_admin, v_p_ship_write),
    (v_role_super_admin, v_p_exch_read),      (v_role_super_admin, v_p_exch_write),
    (v_role_super_admin, v_p_exch_override),  (v_role_super_admin, v_p_analytics_read),
    (v_role_super_admin, v_p_users_read),     (v_role_super_admin, v_p_users_write),
    (v_role_super_admin, v_p_roles_read),     (v_role_super_admin, v_p_roles_write),
    (v_role_super_admin, v_p_settings_read),  (v_role_super_admin, v_p_settings_write),
    (v_role_super_admin, v_p_settings_payment);

  -- admin: all except exchange_rates:override
  INSERT INTO role_permissions (role_id, permission_id) VALUES
    (v_role_admin, v_p_catalog_read),   (v_role_admin, v_p_catalog_write),
    (v_role_admin, v_p_catalog_delete), (v_role_admin, v_p_inv_read),
    (v_role_admin, v_p_inv_write),      (v_role_admin, v_p_ord_read),
    (v_role_admin, v_p_ord_write),      (v_role_admin, v_p_pay_read),
    (v_role_admin, v_p_pay_approve),    (v_role_admin, v_p_pay_reject),
    (v_role_admin, v_p_cust_read),      (v_role_admin, v_p_cust_write),
    (v_role_admin, v_p_cms_read),       (v_role_admin, v_p_cms_write),
    (v_role_admin, v_p_promo_read),     (v_role_admin, v_p_promo_write),
    (v_role_admin, v_p_ship_read),      (v_role_admin, v_p_ship_write),
    (v_role_admin, v_p_exch_read),      (v_role_admin, v_p_exch_write),
    (v_role_admin, v_p_analytics_read), (v_role_admin, v_p_users_read),
    (v_role_admin, v_p_users_write),    (v_role_admin, v_p_roles_read),
    (v_role_admin, v_p_roles_write),    (v_role_admin, v_p_settings_read),
    (v_role_admin, v_p_settings_write), (v_role_admin, v_p_settings_payment);

  -- catalog
  INSERT INTO role_permissions (role_id, permission_id) VALUES
    (v_role_catalog, v_p_catalog_read), (v_role_catalog, v_p_catalog_write),
    (v_role_catalog, v_p_catalog_delete), (v_role_catalog, v_p_inv_read);

  -- inventory
  INSERT INTO role_permissions (role_id, permission_id) VALUES
    (v_role_inventory, v_p_inv_read), (v_role_inventory, v_p_inv_write),
    (v_role_inventory, v_p_catalog_read);

  -- sales
  INSERT INTO role_permissions (role_id, permission_id) VALUES
    (v_role_sales, v_p_ord_read), (v_role_sales, v_p_ord_write),
    (v_role_sales, v_p_cust_read), (v_role_sales, v_p_pay_read);

  -- finance
  INSERT INTO role_permissions (role_id, permission_id) VALUES
    (v_role_finance, v_p_pay_read), (v_role_finance, v_p_pay_approve),
    (v_role_finance, v_p_pay_reject), (v_role_finance, v_p_ord_read),
    (v_role_finance, v_p_exch_read);

  -- customer_service
  INSERT INTO role_permissions (role_id, permission_id) VALUES
    (v_role_customer_service, v_p_cust_read), (v_role_customer_service, v_p_cust_write),
    (v_role_customer_service, v_p_ord_read);

  -- marketing
  INSERT INTO role_permissions (role_id, permission_id) VALUES
    (v_role_marketing, v_p_cms_read), (v_role_marketing, v_p_cms_write),
    (v_role_marketing, v_p_promo_read), (v_role_marketing, v_p_promo_write),
    (v_role_marketing, v_p_analytics_read);

  -- analyst
  INSERT INTO role_permissions (role_id, permission_id) VALUES
    (v_role_analyst, v_p_analytics_read), (v_role_analyst, v_p_ord_read),
    (v_role_analyst, v_p_cust_read);

  -- ============================================================
  -- 10. HOME CMS
  -- ============================================================
  INSERT INTO pages (slug, title, is_active) VALUES ('home', 'Home', true) RETURNING id INTO v_home_page;

  INSERT INTO page_sections (page_id, type, content, sort_order, is_active) VALUES
    (v_home_page, 'announcement_bar', '{"text":"Envíos a todo Venezuela desde Valencia, Carabobo. ¡Compra ahora!","linkText":"Ver colección","linkHref":"/coleccion","bgColor":"brand-black"}', 0, true),
    (v_home_page, 'hero', '{"headline":"Marca tu moda","subheadline":"Calzado femenino venezolano. Tallas 35 al 40.","ctaPrimaryText":"Ver colección","ctaPrimaryHref":"/coleccion","ctaSecondaryText":"Novedades","ctaSecondaryHref":"/nuevo","imageDesktopUrl":"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1920&q=80","imageMobileUrl":"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=768&q=80","imageAlt":"Colección SAVAYA — calzado femenino venezolano","overlayOpacity":0.35}', 1, true),
    (v_home_page, 'shop_by_category', '{"title":"Compra por categoría","categories":[{"name":"Sandalias","slug":"sandalias","imageUrl":"https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80"},{"name":"Tacones","slug":"tacones","imageUrl":"https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600&q=80"},{"name":"Plataformas","slug":"plataformas","imageUrl":"https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80"},{"name":"Flats","slug":"flats","imageUrl":"https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80"}]}', 2, true),
    (v_home_page, 'product_carousel', '{"title":"Nuevos ingresos","subtitle":"Lo último en calzado SAVAYA","source":"new","limit":8,"ctaText":"Ver todos","ctaHref":"/nuevo"}', 3, true),
    (v_home_page, 'benefits_block', '{"benefits":[{"icon":"truck","title":"Envíos a todo Venezuela","description":"Despachamos por Zoom, Tealca y MRW desde Valencia, Carabobo."},{"icon":"whatsapp","title":"Atención por WhatsApp","description":"Respuesta rápida de lunes a sábado de 9 am a 6 pm."},{"icon":"refresh","title":"Cambios en 7 días","description":"Si el calzado no es tu talla, realizamos el cambio sin costo adicional."},{"icon":"shield","title":"Compra segura","description":"Múltiples métodos de pago verificados. Tu pedido está protegido."}]}', 4, true);

  -- ============================================================
  -- 11. ADMIN USER (Arnaldo Casadiego / aandreskss@gmail.com)
  -- ============================================================

  -- Crear user
  INSERT INTO users (email, name, email_verified)
    VALUES ('aandreskss@gmail.com', 'Arnaldo Casadiego', now())
    RETURNING id INTO v_admin_user_id;

  -- Credenciales (Auth.js convention: hash en access_token)
  INSERT INTO accounts (user_id, type, provider, provider_account_id, access_token)
    VALUES (
      v_admin_user_id,
      'credentials',
      'credentials',
      v_admin_user_id::text,
      '$2b$12$hOs0GpJGkao20HSJdhM6fOPBKNAt9mjNUDZL3l7XVm8ffC.w9nnia'
    );

  -- Asignar rol super_admin
  INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES (v_admin_user_id, v_role_super_admin, v_admin_user_id);

  RAISE NOTICE '✅ Seed completado. Admin: aandreskss@gmail.com | Rol: super_admin';

END $$;
