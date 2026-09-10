# Vedaaya PHP/MySQL API

This directory is the production backend for the Vedaaya React storefront and admin panel. It uses PHP 8.2+, PDO, MySQL/MariaDB, clean REST paths, server-authoritative checkout totals, transactional stock updates, and opaque hashed login sessions.

## Structure

```text
php-backend/
├── app/
│   ├── Api.php                 # Router, authentication, shared helpers
│   ├── AdminApiTrait.php       # Admin login, dashboard, audit, reports
│   ├── CatalogApiTrait.php     # Products, categories, CMS, settings
│   ├── CommerceApiTrait.php    # Checkout, orders, customers, reviews
│   ├── GiniApiTrait.php        # Gini assistant HTTP endpoints
│   ├── SizingApiTrait.php      # Size guides, fit profiles, analytics
│   └── bootstrap.php           # Environment, PDO, JSON utilities
├── database.sql                # Full utf8mb4 relational schema
├── seed-data.json              # Storefront content exported from React data
├── seed.php                    # Idempotent CLI seed and initial admin creation
├── index.php                   # HTTP front controller
├── nginx-ecommerce.conf        # Nginx locations for clean API routes
└── .env.example                # Configuration reference without secrets
```

The old `config/`, `core/`, `controllers/`, and `models/` directories remain for source-history compatibility, but the production entry point uses the `app/` implementation above.

## Database model

The schema is grouped by responsibility:

- Catalog: categories, collections, attributes, products, images, variants.
- Commerce: coupons, carts, orders, order items, status history, returns, payments.
- Customers: users, addresses, sessions, reviews, wishlists, recently viewed.
- Operations: settings, banners, media, inventory logs, admin users/sessions, audit logs.
- Sizing: size groups, colors, guides, versions, fit profiles, override analytics.
- Gini: configuration versions, sessions, turns, confirmations, and feedback.

Money uses fixed-point `DECIMAL` columns. Relationships use foreign keys. Checkout and cancellation use database transactions so stock and order state cannot partially update.

## Configuration

Copy `.env.example` to a file outside the web root, preferably `/etc/vedaaya-ecommerce.env`, and restrict it to the PHP-FPM user. `bootstrap.php` loads that file automatically. A different path can be supplied with `VEDAAYA_ENV_FILE`.

Never commit database, Razorpay, Firebase private, or Google Cloud secrets. Frontend Firebase configuration is public application configuration; server credentials are not.

## Initial installation

```bash
mysql -u root -p ecommerce < database.sql
php seed.php
```

Run `seed.php` only from the command line. On the first run it creates a random administrator password. Store that output in a root-only file, sign in once, and replace the password through a controlled database or admin-management workflow.

## Nginx

Copy the two locations from `nginx-ecommerce.conf` into the HTTPS `server` block for the API domain. Then validate before reloading:

```bash
nginx -t
systemctl reload nginx
```

The API base URL is:

```text
https://api.skleup.com/api/ecommerce
```

Configure the Vercel frontend with:

```text
VITE_ECOMMERCE_API_URL=https://api.skleup.com/api/ecommerce
```

## Checks

```bash
find . -name '*.php' -print0 | xargs -0 -n1 php -l
curl -fsS https://api.skleup.com/api/ecommerce/health
```

Public health, catalog, CMS, search, checkout validation, tracking summary, and Gini shopping-turn endpoints do not require an admin token. Admin mutations and reports require `Authorization: Bearer <admin-session-token>`. Customer resources require the matching customer session returned by `/auth/google`.

Razorpay endpoints stay disabled until all three Razorpay environment variables are configured. The frontend never treats an unverified or mocked payment as successful.
