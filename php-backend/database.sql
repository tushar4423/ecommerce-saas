-- Vedaaya ecommerce API schema for MariaDB 10.11 / MySQL 8+
-- Money is stored in INR decimal values. All dates are UTC.
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(64) NOT NULL PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings_documents (
  document_key VARCHAR(64) NOT NULL PRIMARY KEY,
  data JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  parent_id VARCHAR(64) NULL,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categories_slug (slug), KEY idx_categories_order (is_active, display_order), KEY idx_categories_parent (parent_id),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS collections (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(160) NOT NULL, slug VARCHAR(190) NOT NULL, display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1, assignment_type VARCHAR(20) NOT NULL DEFAULT 'manual',
  rules_json JSON NULL, data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_collections_slug (slug), KEY idx_collections_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attributes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  attribute_key VARCHAR(100) NOT NULL, name VARCHAR(160) NOT NULL, display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1, data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attributes_key (attribute_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL, slug VARCHAR(190) NOT NULL, sku VARCHAR(100) NOT NULL,
  category VARCHAR(160) NOT NULL, subcategory VARCHAR(160) NULL, sub_subcategory VARCHAR(160) NULL, brand VARCHAR(160) NULL,
  mrp DECIMAL(12,2) NOT NULL DEFAULT 0, selling_price DECIMAL(12,2) NOT NULL DEFAULT 0, cost_price DECIMAL(12,2) NULL,
  discount_percent DECIMAL(6,2) NOT NULL DEFAULT 0, rating DECIMAL(3,2) NOT NULL DEFAULT 0, review_count INT UNSIGNED NOT NULL DEFAULT 0,
  is_bestseller TINYINT(1) NOT NULL DEFAULT 0, is_new_arrival TINYINT(1) NOT NULL DEFAULT 0,
  is_trending TINYINT(1) NOT NULL DEFAULT 0, is_plus_size TINYINT(1) NOT NULL DEFAULT 0,
  is_festive TINYINT(1) NOT NULL DEFAULT 0, is_active TINYINT(1) NOT NULL DEFAULT 1,
  data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_products_slug (slug), UNIQUE KEY uq_products_sku (sku),
  KEY idx_products_category (category, subcategory, is_active), KEY idx_products_price (selling_price, is_active),
  KEY idx_products_flags (is_active, is_new_arrival, is_bestseller, is_trending),
  FULLTEXT KEY ft_products_search (name, sku, category, subcategory, brand)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id VARCHAR(64) NOT NULL PRIMARY KEY, product_id VARCHAR(64) NOT NULL, url TEXT NOT NULL,
  alt_text VARCHAR(255) NOT NULL DEFAULT '', image_type VARCHAR(40) NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0, display_order INT NOT NULL DEFAULT 0, data JSON NULL,
  KEY idx_product_images_product (product_id, display_order),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
  id VARCHAR(64) NOT NULL PRIMARY KEY, product_id VARCHAR(64) NOT NULL, sku VARCHAR(100) NOT NULL,
  size VARCHAR(40) NOT NULL, color VARCHAR(100) NOT NULL DEFAULT 'Standard', color_hex VARCHAR(20) NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0, price DECIMAL(12,2) NULL, mrp DECIMAL(12,2) NULL,
  barcode VARCHAR(100) NULL, weight_in_grams INT UNSIGNED NULL, data JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_product_variants_sku (sku), KEY idx_product_variants_product (product_id),
  KEY idx_product_variants_lookup (product_id, size, color), KEY idx_product_variants_stock (stock),
  CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS collection_products (
  collection_id VARCHAR(64) NOT NULL, product_id VARCHAR(64) NOT NULL, display_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id), KEY idx_collection_products_product (product_id),
  CONSTRAINT fk_collection_products_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  CONSTRAINT fk_collection_products_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS banners (
  id VARCHAR(64) NOT NULL PRIMARY KEY, title VARCHAR(255) NOT NULL, display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1, starts_at DATETIME NULL, ends_at DATETIME NULL, data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_banners_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(64) NOT NULL PRIMARY KEY, code VARCHAR(64) NOT NULL, discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL, min_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  max_discount_amount DECIMAL(12,2) NULL, first_order_only TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1, valid_until DATETIME NULL,
  usage_limit INT UNSIGNED NULL, usage_count INT UNSIGNED NOT NULL DEFAULT 0, data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_coupons_code (code), KEY idx_coupons_validity (is_active, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupon_products (
  coupon_id VARCHAR(64) NOT NULL, product_id VARCHAR(64) NOT NULL, PRIMARY KEY (coupon_id, product_id),
  CONSTRAINT fk_coupon_products_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  CONSTRAINT fk_coupon_products_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupon_categories (
  coupon_id VARCHAR(64) NOT NULL, category VARCHAR(160) NOT NULL, PRIMARY KEY (coupon_id, category),
  CONSTRAINT fk_coupon_categories_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(128) NOT NULL PRIMARY KEY, email VARCHAR(190) NOT NULL, name VARCHAR(160) NOT NULL, phone VARCHAR(40) NULL,
  avatar_url TEXT NULL, role VARCHAR(40) NOT NULL DEFAULT 'customer', auth_provider VARCHAR(30) NOT NULL DEFAULT 'guest',
  provider_subject VARCHAR(255) NULL, is_active TINYINT(1) NOT NULL DEFAULT 1, data JSON NOT NULL, last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email), UNIQUE KEY uq_users_provider_subject (auth_provider, provider_subject),
  KEY idx_users_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_addresses (
  id VARCHAR(64) NOT NULL PRIMARY KEY, user_id VARCHAR(128) NOT NULL, is_default TINYINT(1) NOT NULL DEFAULT 0,
  data JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user_addresses_user (user_id, is_default),
  CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
  id CHAR(36) NOT NULL PRIMARY KEY, user_id VARCHAR(128) NOT NULL, token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL, revoked_at DATETIME NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_sessions_token (token_hash), KEY idx_user_sessions_user (user_id, expires_at),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) NOT NULL PRIMARY KEY, email VARCHAR(190) NOT NULL, name VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL, role VARCHAR(40) NOT NULL DEFAULT 'admin', permissions JSON NOT NULL,
  avatar_url TEXT NULL, is_active TINYINT(1) NOT NULL DEFAULT 1, last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admin_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id CHAR(36) NOT NULL PRIMARY KEY, admin_id VARCHAR(64) NOT NULL, token_hash CHAR(64) NOT NULL,
  ip_address VARCHAR(64) NULL, user_agent VARCHAR(500) NULL, expires_at DATETIME NOT NULL, revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admin_sessions_token (token_hash), KEY idx_admin_sessions_admin (admin_id, expires_at),
  CONSTRAINT fk_admin_sessions_admin FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_rate_limits (
  rate_key CHAR(64) NOT NULL PRIMARY KEY,
  hits INT UNSIGNED NOT NULL DEFAULT 1,
  window_started_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  KEY idx_api_rate_limits_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS carts (
  user_id VARCHAR(128) NOT NULL PRIMARY KEY, items JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wishlist_items (
  user_id VARCHAR(128) NOT NULL, product_id VARCHAR(64) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id), KEY idx_wishlist_product (product_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recently_viewed (
  user_id VARCHAR(128) NOT NULL, product_id VARCHAR(64) NOT NULL,
  viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id), KEY idx_recently_viewed_time (user_id, viewed_at),
  CONSTRAINT fk_recently_viewed_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_recently_viewed_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) NOT NULL PRIMARY KEY, order_number VARCHAR(64) NOT NULL, invoice_number VARCHAR(64) NULL,
  user_id VARCHAR(128) NULL, customer_name VARCHAR(160) NOT NULL, customer_email VARCHAR(190) NOT NULL,
  customer_phone VARCHAR(40) NULL, shipping_address JSON NOT NULL, billing_address JSON NULL,
  payment_method VARCHAR(50) NOT NULL, payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  razorpay_payment_id VARCHAR(120) NULL, razorpay_order_id VARCHAR(120) NULL,
  subtotal DECIMAL(12,2) NOT NULL, discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  coupon_code VARCHAR(64) NULL, shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0, grand_total DECIMAL(12,2) NOT NULL,
  order_status VARCHAR(50) NOT NULL DEFAULT 'Confirmed', tracking_number VARCHAR(120) NULL,
  courier_partner VARCHAR(120) NULL, estimated_delivery_date DATE NULL, cancellation_reason TEXT NULL,
  data JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_orders_number (order_number), KEY idx_orders_user_date (user_id, created_at),
  KEY idx_orders_email_date (customer_email, created_at), KEY idx_orders_status_date (order_status, created_at),
  KEY idx_orders_tracking (tracking_number),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) NOT NULL PRIMARY KEY, order_id VARCHAR(64) NOT NULL, product_id VARCHAR(64) NOT NULL,
  variant_id VARCHAR(64) NOT NULL, sku VARCHAR(100) NOT NULL, product_name VARCHAR(255) NOT NULL,
  product_image TEXT NULL, size VARCHAR(40) NOT NULL, color VARCHAR(100) NOT NULL, quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL, mrp DECIMAL(12,2) NOT NULL, subtotal DECIMAL(12,2) NOT NULL, data JSON NOT NULL,
  KEY idx_order_items_order (order_id), KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_status_history (
  id VARCHAR(64) NOT NULL PRIMARY KEY, order_id VARCHAR(64) NOT NULL, status VARCHAR(50) NOT NULL,
  comment TEXT NULL, updated_by VARCHAR(160) NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_order_history_order (order_id, created_at),
  CONSTRAINT fk_order_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_returns (
  id VARCHAR(64) NOT NULL PRIMARY KEY, order_id VARCHAR(64) NOT NULL, status VARCHAR(50) NOT NULL DEFAULT 'Requested',
  reason VARCHAR(255) NOT NULL, description TEXT NULL, resolution_type VARCHAR(50) NULL,
  courier_partner VARCHAR(120) NULL, tracking_number VARCHAR(120) NULL, refund_amount DECIMAL(12,2) NULL,
  admin_notes TEXT NULL, data JSON NOT NULL, restocked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_order_returns_order (order_id), KEY idx_order_returns_status (status, created_at),
  CONSTRAINT fk_order_returns_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupon_usages (
  id VARCHAR(64) NOT NULL PRIMARY KEY, coupon_id VARCHAR(64) NOT NULL, user_id VARCHAR(128) NULL,
  order_id VARCHAR(64) NOT NULL, discount_amount DECIMAL(12,2) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_coupon_usages_order (order_id), KEY idx_coupon_usages_coupon (coupon_id, created_at),
  KEY idx_coupon_usages_user (user_id, created_at),
  CONSTRAINT fk_coupon_usages_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE RESTRICT,
  CONSTRAINT fk_coupon_usages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_coupon_usages_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_transactions (
  id VARCHAR(64) NOT NULL PRIMARY KEY, provider VARCHAR(30) NOT NULL, provider_order_id VARCHAR(120) NULL,
  provider_payment_id VARCHAR(120) NULL, order_id VARCHAR(64) NULL, amount_paise BIGINT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR', status VARCHAR(30) NOT NULL, verified_at DATETIME NULL,
  data JSON NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payment_provider_order (provider, provider_order_id),
  UNIQUE KEY uq_payment_provider_payment (provider, provider_payment_id), KEY idx_payment_order (order_id),
  CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(64) NOT NULL PRIMARY KEY, product_id VARCHAR(64) NOT NULL, user_id VARCHAR(128) NULL,
  rating TINYINT UNSIGNED NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  helpful_count INT UNSIGNED NOT NULL DEFAULT 0, data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_reviews_product_status (product_id, status, created_at),
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS review_votes (
  review_id VARCHAR(64) NOT NULL, voter_key VARCHAR(128) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id, voter_key),
  CONSTRAINT fk_review_votes_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_logs (
  id VARCHAR(64) NOT NULL PRIMARY KEY, product_id VARCHAR(64) NOT NULL, variant_id VARCHAR(64) NOT NULL,
  previous_stock INT UNSIGNED NOT NULL, new_stock INT UNSIGNED NOT NULL, quantity_change INT NOT NULL,
  reason VARCHAR(120) NULL, notes TEXT NULL, actor_id VARCHAR(64) NULL, actor_name VARCHAR(160) NULL,
  actor_email VARCHAR(190) NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_inventory_logs_variant (variant_id, created_at), KEY idx_inventory_logs_product (product_id, created_at),
  CONSTRAINT fk_inventory_logs_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_inventory_logs_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS size_groups (
  id VARCHAR(64) NOT NULL PRIMARY KEY, name VARCHAR(160) NOT NULL, is_default TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1, data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS size_group_values (
  size_group_id VARCHAR(64) NOT NULL, size_value VARCHAR(40) NOT NULL, display_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (size_group_id, size_value),
  CONSTRAINT fk_size_group_values_group FOREIGN KEY (size_group_id) REFERENCES size_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_colors (
  id VARCHAR(64) NOT NULL PRIMARY KEY, name VARCHAR(100) NOT NULL, hex VARCHAR(20) NOT NULL,
  display_order INT NOT NULL DEFAULT 0, is_active TINYINT(1) NOT NULL DEFAULT 1, data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_store_colors_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS size_guides (
  id VARCHAR(64) NOT NULL PRIMARY KEY, title VARCHAR(255) NOT NULL, measurement_type VARCHAR(20) NOT NULL,
  precedence_level VARCHAR(20) NOT NULL, version INT UNSIGNED NOT NULL DEFAULT 1,
  is_default TINYINT(1) NOT NULL DEFAULT 0, is_active TINYINT(1) NOT NULL DEFAULT 1, data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_size_guides_precedence (is_active, precedence_level, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS size_guide_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, size_guide_id VARCHAR(64) NOT NULL,
  version INT UNSIGNED NOT NULL, snapshot JSON NOT NULL, created_by VARCHAR(160) NULL,
  change_summary VARCHAR(500) NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_size_guide_version (size_guide_id, version),
  CONSTRAINT fk_size_guide_versions_guide FOREIGN KEY (size_guide_id) REFERENCES size_guides(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fit_profiles (
  user_id VARCHAR(128) NOT NULL PRIMARY KEY, has_consented TINYINT(1) NOT NULL DEFAULT 0,
  retention_days INT NOT NULL DEFAULT 90, data JSON NOT NULL, expires_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_fit_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS size_fit_audit_logs (
  id VARCHAR(64) NOT NULL PRIMARY KEY, action VARCHAR(80) NOT NULL, entity_id VARCHAR(128) NOT NULL,
  actor_id VARCHAR(64) NULL, data JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_size_fit_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS size_override_analytics (
  id VARCHAR(64) NOT NULL PRIMARY KEY, product_id VARCHAR(64) NOT NULL, user_id VARCHAR(128) NULL,
  recommended_size VARCHAR(40) NOT NULL, chosen_size VARCHAR(40) NOT NULL,
  confidence_score DECIMAL(5,2) NOT NULL DEFAULT 0, data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_size_override_product (product_id, created_at), KEY idx_size_override_user (user_id, created_at),
  CONSTRAINT fk_size_override_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_size_override_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_assets (
  id VARCHAR(64) NOT NULL PRIMARY KEY, file_name VARCHAR(255) NOT NULL, mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL, storage_path VARCHAR(500) NOT NULL, public_url TEXT NOT NULL,
  alt_text VARCHAR(255) NOT NULL DEFAULT '', uploaded_by VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, KEY idx_media_assets_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) NOT NULL PRIMARY KEY, admin_id VARCHAR(64) NULL, action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL, entity_id VARCHAR(128) NOT NULL, details TEXT NOT NULL,
  ip_address VARCHAR(64) NULL, data JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_logs_created (created_at), KEY idx_audit_logs_entity (entity_type, entity_id),
  CONSTRAINT fk_audit_logs_admin FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gini_config_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, version INT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', config JSON NOT NULL, created_by VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, published_at DATETIME NULL,
  UNIQUE KEY uq_gini_config_version (version), KEY idx_gini_config_status (status, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gini_sessions (
  id VARCHAR(64) NOT NULL PRIMARY KEY, user_id VARCHAR(128) NULL, channel VARCHAR(30) NOT NULL DEFAULT 'text',
  status VARCHAR(30) NOT NULL DEFAULT 'active', locale VARCHAR(20) NOT NULL DEFAULT 'en-IN', context JSON NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ended_at DATETIME NULL,
  last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_gini_sessions_user (user_id, started_at), KEY idx_gini_sessions_status (status, last_activity_at),
  CONSTRAINT fk_gini_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gini_turns (
  id VARCHAR(64) NOT NULL PRIMARY KEY, session_id VARCHAR(64) NOT NULL, role VARCHAR(20) NOT NULL,
  message MEDIUMTEXT NOT NULL, intent VARCHAR(80) NULL, data JSON NULL, latency_ms INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, KEY idx_gini_turns_session (session_id, created_at),
  CONSTRAINT fk_gini_turns_session FOREIGN KEY (session_id) REFERENCES gini_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gini_confirmations (
  id VARCHAR(64) NOT NULL PRIMARY KEY, session_id VARCHAR(64) NOT NULL, action_name VARCHAR(80) NOT NULL,
  parameters JSON NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', expires_at DATETIME NOT NULL,
  resolved_at DATETIME NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_gini_confirmations_session (session_id, status),
  CONSTRAINT fk_gini_confirmations_session FOREIGN KEY (session_id) REFERENCES gini_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gini_feedback (
  id VARCHAR(64) NOT NULL PRIMARY KEY, session_id VARCHAR(64) NULL, turn_id VARCHAR(64) NULL,
  rating SMALLINT NULL, data JSON NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_gini_feedback_session (session_id, created_at),
  CONSTRAINT fk_gini_feedback_session FOREIGN KEY (session_id) REFERENCES gini_sessions(id) ON DELETE SET NULL,
  CONSTRAINT fk_gini_feedback_turn FOREIGN KEY (turn_id) REFERENCES gini_turns(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (version) VALUES ('2026_09_09_001_initial')
ON DUPLICATE KEY UPDATE version = VALUES(version);
