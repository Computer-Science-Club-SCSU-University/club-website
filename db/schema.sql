-- 1. Users (officers only)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    clerk_user_id TEXT UNIQUE NOT NULL,  -- from Clerk
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    role VARCHAR(100) NOT NULL,          -- used for display e.g. "President", "VP of Events"
    is_officer BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Events
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    event_date TIMESTAMP NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- 3. Announcements
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL, display_text VARCHAR(200), 
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_draft BOOLEAN NOT NULL DEFAULT TRUE,
    discord_message_id VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Officers (subset of users shown publicly)
CREATE TABLE officers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    position VARCHAR(100) NOT NULL,   -- e.g. "VP of Tech", "Treasurer"
    bio TEXT,
    image_url TEXT,
    linkedin_url TEXT,
    email TEXT,
    order_index INTEGER DEFAULT 0     -- used to control ordering on frontend
);

-- 5. Highlights / Projects
CREATE TABLE highlights (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url TEXT,
    link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Event RSVPs
CREATE TABLE event_rsvps (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(150),
    email VARCHAR(150) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, email) -- prevents duplicate RSVPs
);
