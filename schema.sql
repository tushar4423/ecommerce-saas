-- ==============================================================================
-- ECOMMERCE DATABASE SQL SCHEMA
-- Target DB: `ecommerce` (MySQL 5.7+ / MySQL 8.0 / MariaDB 10.3+)
-- Compatible with Core PHP Backend at https://api.skleup.com/api/ecommerce
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `ecommerce` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ecommerce`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. STORE BRANDING & CONFIGURATION SETTINGS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `store_settings`;
CREATE TABLE `store_settings` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `store_name` VARCHAR(150) NOT NULL DEFAULT 'Nandita Fashion',
  `tagline` VARCHAR(255) DEFAULT 'Ethnic & Kurti Studio',
  `logo_url` TEXT DEFAULT NULL,
  `logo_type` ENUM('text', 'image', 'both') NOT NULL DEFAULT 'both',
  `theme_id` VARCHAR(50) NOT NULL DEFAULT 'nandita-maroon',
  `primary_color` VARCHAR(20) NOT NULL DEFAULT '#7B2435',
  `primary_hover` VARCHAR(20) NOT NULL DEFAULT '#621C2A',
  `primary_light` VARCHAR(20) NOT NULL DEFAULT '#FFF0F3',
  `secondary_color` VARCHAR(20) NOT NULL DEFAULT '#C98C97',
  `accent_color` VARCHAR(20) NOT NULL DEFAULT '#E6A4B4',
  `background_color` VARCHAR(20) NOT NULL DEFAULT '#FAF6F0',
  `header_announcement_text` VARCHAR(255) DEFAULT 'Festive Launch: Use code NANDITA20 for Flat 20% OFF | COD Available Across India',
  `announcement_active` TINYINT(1) NOT NULL DEFAULT 1,
  `free_shipping_threshold` DECIMAL(10,2) NOT NULL DEFAULT 999.00,
  `support_email` VARCHAR(150) DEFAULT 'care@nanditafashion.com',
  `support_phone` VARCHAR(50) DEFAULT '+91 98765 43210',
  `address_text` TEXT DEFAULT NULL,
  `hero_banner_title` VARCHAR(255) DEFAULT 'The Royal Festive Weaves \'26',
  `hero_banner_subtitle` TEXT DEFAULT NULL,
  `coupon_promo_code` VARCHAR(50) DEFAULT 'NANDITA20',
  `coupon_promo_discount` VARCHAR(50) DEFAULT 'Flat 20% OFF',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `store_settings` (
  `id`, `store_name`, `tagline`, `logo_type`, `theme_id`, `primary_color`, `primary_hover`, 
  `primary_light`, `secondary_color`, `accent_color`, `background_color`, `header_announcement_text`,
  `announcement_active`, `free_shipping_threshold`, `support_email`, `support_phone`, `address_text`,
  `hero_banner_title`, `hero_banner_subtitle`, `coupon_promo_code`, `coupon_promo_discount`
) VALUES (
  1, 'Nandita Fashion', 'Ethnic & Kurti Studio', 'both', 'nandita-maroon', '#7B2435', '#621C2A',
  '#FFF0F3', '#C98C97', '#E6A4B4', '#FAF6F0', 'Festive Launch: Use code NANDITA20 for Flat 20% OFF | COD Available Across India',
  1, 999.00, 'care@nanditafashion.com', '+91 98765 43210', 'Nandita Fashion Studio, Indiranagar, Bengaluru, Karnataka 560038',
  'The Royal Festive Weaves \'26', 'Handcrafted pure cotton, mulmul, and chanderi kurtas styled for every celebratory moment.',
  'NANDITA20', 'Flat 20% OFF'
);

-- ------------------------------------------------------------------------------
-- 2. USERS & ADMIN ACCOUNTS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` VARCHAR(128) NOT NULL, -- Firebase UID or custom auth ID
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `role` ENUM('customer', 'admin', 'manager') NOT NULL DEFAULT 'customer',
  `avatar_url` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_email` (`email`),
  UNIQUE KEY `idx_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` (`uid`, `name`, `email`, `role`) VALUES 
('admin-root-1', 'Nandita Admin', 'kushagraavyukta@gmail.com', 'admin');

-- ------------------------------------------------------------------------------
-- 3. USER ADDRESSES
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `user_addresses`;
CREATE TABLE `user_addresses` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `address_line1` VARCHAR(255) NOT NULL,
  `address_line2` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `pincode` VARCHAR(20) NOT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_address_user` (`user_id`),
  CONSTRAINT `fk_address_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 4. CATEGORIES HIERARCHY
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `parent_id` INT(11) UNSIGNED DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `image_url` TEXT DEFAULT NULL,
  `banner_image` TEXT DEFAULT NULL,
  `display_order` INT(5) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_slug` (`slug`),
  KEY `fk_cat_parent` (`parent_id`),
  CONSTRAINT `fk_cat_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image_url`, `display_order`, `featured`) VALUES
(1, 'Kurtis & Tunics', 'kurtis', 'Everyday and festive designer ethnic kurtis in A-line, straight & flared cuts', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80', 1, 1),
(2, 'Kurta Sets & Suits', 'kurta-sets', 'Complete 2-piece and 3-piece sets paired with trousers and hand-block dupattas', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80', 2, 1),
(3, 'Ethnic Co-ord Sets', 'coord-sets', 'Contemporary fusion matching top and bottom sets crafted for comfort', 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=600&q=80', 3, 1),
(4, 'Plus Size (2XL - 5XL)', 'plus-size', 'Specially tailored comfortable silhouettes with relaxed drape', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80', 4, 1),
(5, 'Anarkalis & Maxi Dresses', 'dresses', 'Flared royal anarkali silhouettes with artisanal gota and zari work', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80', 5, 1);

-- ------------------------------------------------------------------------------
-- 5. PRODUCTS CATALOG
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `sku` VARCHAR(60) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `category_id` INT(11) UNSIGNED DEFAULT NULL,
  `short_description` VARCHAR(500) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `mrp` DECIMAL(10,2) NOT NULL,
  `selling_price` DECIMAL(10,2) NOT NULL,
  `fabric` VARCHAR(100) DEFAULT NULL,
  `work_type` VARCHAR(100) DEFAULT NULL,
  `length` VARCHAR(50) DEFAULT NULL,
  `sleeve_length` VARCHAR(50) DEFAULT NULL,
  `neck_type` VARCHAR(50) DEFAULT NULL,
  `fit_type` VARCHAR(50) DEFAULT NULL,
  `wash_care` VARCHAR(255) DEFAULT 'Dry Clean Recommended or Gentle Cold Wash',
  `is_new_arrival` TINYINT(1) NOT NULL DEFAULT 0,
  `is_best_seller` TINYINT(1) NOT NULL DEFAULT 0,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `rating` DECIMAL(3,2) NOT NULL DEFAULT 4.80,
  `review_count` INT(11) NOT NULL DEFAULT 12,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_sku` (`sku`),
  UNIQUE KEY `idx_prod_slug` (`slug`),
  KEY `fk_prod_category` (`category_id`),
  CONSTRAINT `fk_prod_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `products` (`id`, `sku`, `name`, `slug`, `category_id`, `short_description`, `mrp`, `selling_price`, `fabric`, `work_type`, `is_new_arrival`, `is_best_seller`, `is_featured`, `rating`, `review_count`) VALUES
(1, 'NF-KRT-001', 'Gulabo Chanderi Anarkali Kurta Set', 'gulabo-chanderi-anarkali-kurta-set', 2, 'Pure Chanderi silk kurta with intricate hand zardozi yoke and organza dupatta.', 4999.00, 2799.00, 'Chanderi Silk', 'Hand Zardozi & Gota Patti', 1, 1, 1, 4.90, 48),
(2, 'NF-KRT-002', 'Jaipur Indigo Dabu Print Cotton Kurti', 'jaipur-indigo-dabu-print-cotton-kurti', 1, 'Natural indigo mud-resist handblock printed 60s cambric cotton straight kurta.', 2499.00, 1299.00, '100% 60s Cambric Cotton', 'Authentic Bagru Hand Block', 1, 1, 1, 4.85, 34),
(3, 'NF-KRT-003', 'Noor Ivory Chikankari Georgette Kurta', 'noor-ivory-chikankari-georgette-kurta', 1, 'Traditional Lucknowi Bakhiya and Phanda embroidery on breathable viscose georgette.', 3799.00, 2199.00, 'Viscose Georgette', 'Lucknowi Hand Chikankari', 1, 0, 1, 4.95, 62),
(4, 'NF-KRT-004', 'Maroon Angrakha Flared Kurti Set', 'maroon-angrakha-flared-kurti-set', 2, 'Royal crimson maroon angrakha overlapping silhouette with mirror embroidery details.', 4499.00, 2499.00, 'Cotton Mulmul', 'Hand Mirror & Thread Work', 0, 1, 1, 4.75, 29),
(5, 'NF-KRT-005', 'Royal Emerald Linen Co-ord Set', 'royal-emerald-linen-co-ord-set', 3, 'Relaxed resort and festive ethnic fusion set with side slit top and flared palazzo.', 3999.00, 2299.00, 'Pure Cotton Linen', 'Minimalist Thread Work', 1, 0, 1, 4.80, 19),
(6, 'NF-KRT-006', 'Virasat Plus Size Gold Print Kurta', 'virasat-plus-size-gold-print-kurta', 4, 'Specially calibrated plus size comfort drape with foil gold border accents (2XL-5XL).', 3299.00, 1799.00, 'Cotton Silk Blend', 'Gold Foil & Lace Borders', 1, 1, 1, 4.88, 41);

-- ------------------------------------------------------------------------------
-- 6. PRODUCT IMAGES
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `product_images`;
CREATE TABLE `product_images` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT(11) UNSIGNED NOT NULL,
  `image_url` TEXT NOT NULL,
  `alt_text` VARCHAR(255) DEFAULT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `display_order` INT(5) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_img_product` (`product_id`),
  CONSTRAINT `fk_img_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `product_images` (`product_id`, `image_url`, `is_primary`, `display_order`) VALUES
(1, 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=85', 1, 0),
(1, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85', 0, 1),
(2, 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=85', 1, 0),
(3, 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=900&q=85', 1, 0),
(4, 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85', 1, 0),
(5, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85', 1, 0),
(6, 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=900&q=85', 1, 0);

-- ------------------------------------------------------------------------------
-- 7. PRODUCT VARIANTS (SIZES, COLORS, STOCKS)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `product_variants`;
CREATE TABLE `product_variants` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT(11) UNSIGNED NOT NULL,
  `size` VARCHAR(20) NOT NULL, -- XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL
  `color_name` VARCHAR(50) NOT NULL DEFAULT 'Original',
  `color_hex` VARCHAR(20) NOT NULL DEFAULT '#7B2435',
  `stock_quantity` INT(11) NOT NULL DEFAULT 15,
  `price_override` DECIMAL(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_prod_variant` (`product_id`, `size`, `color_name`),
  KEY `fk_var_product` (`product_id`),
  CONSTRAINT `fk_var_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `product_variants` (`product_id`, `size`, `color_name`, `color_hex`, `stock_quantity`) VALUES
(1, 'S', 'Blush Rose', '#C98C97', 12),
(1, 'M', 'Blush Rose', '#C98C97', 24),
(1, 'L', 'Blush Rose', '#C98C97', 18),
(1, 'XL', 'Blush Rose', '#C98C97', 8),
(2, 'M', 'Indigo Blue', '#1B2A4A', 15),
(2, 'L', 'Indigo Blue', '#1B2A4A', 20),
(2, 'XL', 'Indigo Blue', '#1B2A4A', 10),
(3, 'M', 'Pure Ivory', '#FAF6F0', 30),
(3, 'L', 'Pure Ivory', '#FAF6F0', 25),
(4, 'S', 'Regal Maroon', '#7B2435', 10),
(4, 'M', 'Regal Maroon', '#7B2435', 14),
(4, 'L', 'Regal Maroon', '#7B2435', 18),
(5, 'M', 'Emerald Green', '#1B4D3E', 12),
(5, 'L', 'Emerald Green', '#1B4D3E', 15),
(6, '2XL', 'Festive Mustard', '#E08E45', 15),
(6, '3XL', 'Festive Mustard', '#E08E45', 20),
(6, '4XL', 'Festive Mustard', '#E08E45', 12),
(6, '5XL', 'Festive Mustard', '#E08E45', 8);

-- ------------------------------------------------------------------------------
-- 8. COUPONS & PROMOTIONAL OFFERS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `discount_type` ENUM('percentage', 'flat') NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(10,2) NOT NULL,
  `min_order_value` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `max_discount_cap` DECIMAL(10,2) DEFAULT NULL,
  `valid_from` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `valid_until` DATETIME NOT NULL DEFAULT '2030-12-31 23:59:59',
  `usage_limit` INT(11) NOT NULL DEFAULT 1000,
  `times_used` INT(11) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `description` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `coupons` (`code`, `discount_type`, `discount_value`, `min_order_value`, `max_discount_cap`, `description`) VALUES
('NANDITA20', 'percentage', 20.00, 1499.00, 1000.00, 'Flat 20% OFF on all handcrafted festive styles above Rs.1499'),
('FIRSTBUY', 'flat', 300.00, 999.00, 300.00, 'Instant Rs.300 OFF for first-time shoppers'),
('FESTIVE500', 'flat', 500.00, 2499.00, 500.00, 'Special Rs.500 OFF on purchases above Rs.2499');

-- ------------------------------------------------------------------------------
-- 9. HERO BANNERS & PROMO CAROUSELS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `hero_banners`;
CREATE TABLE `hero_banners` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` TEXT DEFAULT NULL,
  `badge` VARCHAR(100) DEFAULT 'Festive Drop \'26',
  `desktop_image` TEXT NOT NULL,
  `mobile_image` TEXT DEFAULT NULL,
  `cta_text` VARCHAR(60) NOT NULL DEFAULT 'Explore Collection',
  `cta_link` VARCHAR(255) NOT NULL DEFAULT '/kurtis',
  `display_order` INT(5) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `hero_banners` (`title`, `subtitle`, `badge`, `desktop_image`, `mobile_image`, `cta_text`, `cta_link`, `display_order`) VALUES
('The Royal Festive Weaves \'26', 'Handcrafted pure cotton, mulmul, and chanderi kurtas styled for every celebratory moment.', 'Festive Premiere', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=85', 'Shop The Collection', '/kurtis', 1),
('Jaipur Heritage Block Prints', 'Natural indigo, turmeric yellow, and madder red hand-stamped by master Rajasthani artisans.', 'Artisanal Drop', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1600&q=85', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=85', 'Explore Handblocks', '/kurtis', 2);

-- ------------------------------------------------------------------------------
-- 10. ORDERS & CHECKOUT TRANSACTIONS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(60) NOT NULL,
  `user_id` INT(11) UNSIGNED DEFAULT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_email` VARCHAR(150) NOT NULL,
  `customer_phone` VARCHAR(30) NOT NULL,
  `shipping_address` TEXT NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `coupon_code` VARCHAR(50) DEFAULT NULL,
  `shipping_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(10,2) NOT NULL,
  `payment_method` ENUM('cod', 'upi', 'card', 'netbanking') NOT NULL DEFAULT 'cod',
  `payment_status` ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `order_status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'confirmed',
  `tracking_number` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_number`),
  KEY `fk_order_user` (`user_id`),
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 11. ORDER ITEMS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) UNSIGNED NOT NULL,
  `product_id` INT(11) UNSIGNED DEFAULT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `size` VARCHAR(20) NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `quantity` INT(11) NOT NULL DEFAULT 1,
  `total_price` DECIMAL(10,2) NOT NULL,
  `product_image` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_item_order` (`order_id`),
  CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 12. CUSTOMER REVIEWS & RATINGS
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `product_reviews`;
CREATE TABLE `product_reviews` (
  `id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT(11) UNSIGNED NOT NULL,
  `user_id` INT(11) UNSIGNED DEFAULT NULL,
  `author_name` VARCHAR(150) NOT NULL,
  `rating` INT(1) NOT NULL DEFAULT 5,
  `comment` TEXT NOT NULL,
  `is_verified_buyer` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_rev_product` (`product_id`),
  CONSTRAINT `fk_rev_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
