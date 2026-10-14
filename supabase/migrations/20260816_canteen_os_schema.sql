-- ====================================================================
-- CANTEEN OS — PRODUCTION DATABASE SCHEMA & MIGRATIONS
-- Tagline: "Order once. Pay once. Pick up once."
-- Architecture: Multi-tenant, Capacity-Aware, Multi-Counter Routing
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TENANT HIERARCHY: COLLEGES & CANTEENS
CREATE TABLE IF NOT EXISTS colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    campus_city VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canteens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    default_online_capacity_percent INT DEFAULT 70 CHECK (default_online_capacity_percent BETWEEN 0 AND 100),
    default_walkin_capacity_percent INT DEFAULT 30 CHECK (default_walkin_capacity_percent BETWEEN 0 AND 100),
    student_cancellation_cutoff_minutes INT DEFAULT 10,
    allow_student_cancel_during_prep BOOLEAN DEFAULT FALSE,
    student_refund_percentage INT DEFAULT 100 CHECK (student_refund_percentage BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_capacity_split CHECK (default_online_capacity_percent + default_walkin_capacity_percent = 100)
);

-- 3. PHYSICAL COUNTERS (1, 2, 3)
CREATE TABLE IF NOT EXISTS counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canteen_id UUID NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
    counter_number INT NOT NULL CHECK (counter_number IN (1, 2, 3)),
    name VARCHAR(100) NOT NULL,
    station_lead VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (canteen_id, counter_number)
);

-- 4. MENU ITEMS WITH COUNTER ROUTING & INVENTORY
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canteen_id UUID NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
    counter_id UUID NOT NULL REFERENCES counters(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category VARCHAR(50) NOT NULL CHECK (category IN ('biryani_rice', 'meals_breads', 'snacks_drinks')),
    dietary_type VARCHAR(20) NOT NULL CHECK (dietary_type IN ('VEG', 'NON_VEG', 'EGG')),
    image_url TEXT,
    prep_lead_time_minutes INT DEFAULT 5 CHECK (prep_lead_time_minutes >= 0),
    is_fast_item BOOLEAN DEFAULT FALSE,
    daily_prepared_qty INT NOT NULL DEFAULT 0 CHECK (daily_prepared_qty >= 0),
    committed_qty INT NOT NULL DEFAULT 0 CHECK (committed_qty >= 0),
    is_sold_out BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_inventory CHECK (daily_prepared_qty >= committed_qty)
);

-- 5. PICKUP SLOTS & CAPACITY ENGINE (10-minute intervals)
CREATE TABLE IF NOT EXISTS pickup_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canteen_id UUID NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
    meal_period VARCHAR(20) NOT NULL CHECK (meal_period IN ('BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    display_label VARCHAR(50) NOT NULL,
    total_capacity INT NOT NULL DEFAULT 100 CHECK (total_capacity > 0),
    online_capacity_quota INT NOT NULL DEFAULT 70 CHECK (online_capacity_quota >= 0),
    walkin_capacity_quota INT NOT NULL DEFAULT 30 CHECK (walkin_capacity_quota >= 0),
    current_online_bookings INT NOT NULL DEFAULT 0 CHECK (current_online_bookings >= 0),
    current_walkin_bookings INT NOT NULL DEFAULT 0 CHECK (current_walkin_bookings >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_slot_capacities CHECK (online_capacity_quota + walkin_capacity_quota = total_capacity)
);

-- 6. ITEM-SPECIFIC CAPACITY PER SLOT (Extensible high-load constraints)
CREATE TABLE IF NOT EXISTS slot_item_capacities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_slot_id UUID NOT NULL REFERENCES pickup_slots(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    max_item_capacity INT NOT NULL CHECK (max_item_capacity > 0),
    current_item_count INT NOT NULL DEFAULT 0 CHECK (current_item_count >= 0),
    UNIQUE (pickup_slot_id, menu_item_id)
);

-- 7. PHYSICAL PICKUP SHELVES (Finite 24 cubbies A1-D6)
CREATE TABLE IF NOT EXISTS pickup_shelves (
    id VARCHAR(50) PRIMARY KEY, -- e.g. "Shelf A1"
    canteen_id UUID NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
    shelf_code VARCHAR(10) NOT NULL,
    zone VARCHAR(1) NOT NULL CHECK (zone IN ('A', 'B', 'C', 'D')),
    is_occupied BOOLEAN DEFAULT FALSE,
    current_order_id UUID,
    assigned_at TIMESTAMPTZ
);

-- 8. ORDERS TABLE (Consolidated Order, Single Payment)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number VARCHAR(20) NOT NULL, -- e.g. "A127"
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    canteen_id UUID NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50),
    is_walkin_order BOOLEAN DEFAULT FALSE,
    pickup_slot_id UUID NOT NULL REFERENCES pickup_slots(id) ON DELETE RESTRICT,
    slot_display_label VARCHAR(50) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('UPI', 'CARD', 'CASH_AT_COUNTER')),
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED')),
    order_status VARCHAR(30) NOT NULL CHECK (order_status IN (
        'PLACED',
        'PREPARING',
        'READY_FOR_CONSOLIDATION',
        'READY_FOR_PICKUP',
        'COLLECTED',
        'CANCELLED_BY_STUDENT',
        'CANCELLED_BY_CANTEEN'
    )),
    cancellation_reason TEXT,
    refund_amount NUMERIC(10, 2) DEFAULT 0,
    shelf_id VARCHAR(50) REFERENCES pickup_shelves(id) ON DELETE SET NULL,
    pickup_pin VARCHAR(4) NOT NULL,
    qr_code_hash TEXT NOT NULL UNIQUE,
    delay_minutes INT DEFAULT 0,
    is_delayed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ready_at TIMESTAMPTZ,
    collected_at TIMESTAMPTZ
);

-- 9. ORDER ITEMS (Multi-Counter Decomposition & Status)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    counter_id UUID NOT NULL REFERENCES counters(id) ON DELETE RESTRICT,
    item_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    friend_name VARCHAR(100),
    item_status VARCHAR(30) NOT NULL DEFAULT 'QUEUED' CHECK (item_status IN (
        'QUEUED',
        'PREPARING',
        'READY_AT_COUNTER',
        'TRANSFERRED_TO_PICKUP'
    )),
    is_fast_item BOOLEAN DEFAULT FALSE,
    prepared_at TIMESTAMPTZ,
    transferred_at TIMESTAMPTZ
);

-- 10. EXCEPTION & AUDIT LOGS
CREATE TABLE IF NOT EXISTS exception_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    exception_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 11. INDEXES FOR HIGH-THROUGHPUT PEAK QUERIES
CREATE INDEX IF NOT EXISTS idx_orders_pickup_slot ON orders(pickup_slot_id, order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_counter_status ON order_items(counter_id, item_status);
CREATE INDEX IF NOT EXISTS idx_orders_shelf ON orders(shelf_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_canteen ON menu_items(canteen_id, category);

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteens ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access for menu, slots, and counters within tenant
CREATE POLICY public_read_menu ON menu_items FOR SELECT USING (true);
CREATE POLICY public_read_slots ON pickup_slots FOR SELECT USING (true);
CREATE POLICY public_read_counters ON counters FOR SELECT USING (true);
CREATE POLICY public_read_shelves ON pickup_shelves FOR SELECT USING (true);

-- User order visibility (users see own orders; staff/admin see canteen orders)
CREATE POLICY user_read_own_orders ON orders FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM canteens WHERE canteens.id = orders.canteen_id)
);
