-- Initial seed data for Naath Archive
-- This file should be run after the schema.sql file

-- Create admin user (password: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active) 
VALUES (
  'admin',
  'admin@naatharchive.org',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqHh6e', -- admin123
  'Admin',
  'User',
  'admin',
  true
);

-- Create sample contributor user (password: contributor123)
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active) 
VALUES (
  'contributor',
  'contributor@naatharchive.org',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqHh6e', -- contributor123
  'Sample',
  'Contributor',
  'contributor',
  true
);

-- Create sample tags
INSERT INTO tags (name, description, color) VALUES
('Culture', 'Cultural practices and traditions', '#8B4513'),
('History', 'Historical events and periods', '#00008B'),
('Art', 'Artistic expressions and artifacts', '#8B4513'),
('Language', 'Language and linguistics', '#00008B'),
('Religion', 'Religious practices and beliefs', '#8B4513'),
('Music', 'Musical traditions and instruments', '#00008B'),
('Food', 'Culinary traditions and recipes', '#8B4513'),
('Clothing', 'Traditional clothing and textiles', '#00008B');

-- Create sample articles
INSERT INTO articles (title, slug, content, excerpt, featured_image_url, author_id, status, published_at, tags) VALUES
(
  'The Origins of Naath Culture',
  'origins-of-naath-culture',
  'This is a comprehensive article about the origins of Naath culture, exploring the historical roots and development of cultural practices that have shaped the community over generations. The content would include detailed historical analysis, cultural significance, and contemporary relevance.',
  'Explore the historical roots and development of Naath cultural practices that have shaped the community over generations.',
  'https://example.com/images/naath-culture.jpg',
  (SELECT id FROM users WHERE username = 'contributor'),
  'published',
  CURRENT_TIMESTAMP,
  ARRAY['Culture', 'History']
),
(
  'Traditional Naath Music and Instruments',
  'traditional-naath-music-instruments',
  'This article delves into the rich musical traditions of the Naath people, examining traditional instruments, musical styles, and the cultural significance of music in community gatherings and ceremonies.',
  'Discover the rich musical traditions of the Naath people, including traditional instruments and cultural significance.',
  'https://example.com/images/naath-music.jpg',
  (SELECT id FROM users WHERE username = 'contributor'),
  'published',
  CURRENT_TIMESTAMP,
  ARRAY['Music', 'Culture']
),
(
  'Naath Culinary Traditions',
  'naath-culinary-traditions',
  'Explore the diverse and flavorful culinary traditions of the Naath people, including traditional recipes, cooking methods, and the cultural importance of food in community life.',
  'Explore the diverse and flavorful culinary traditions of the Naath people.',
  'https://example.com/images/naath-food.jpg',
  (SELECT id FROM users WHERE username = 'contributor'),
  'published',
  CURRENT_TIMESTAMP,
  ARRAY['Food', 'Culture']
);

-- Create sample artifacts
INSERT INTO artifacts (name, description, category, period, location, image_urls, material, condition_notes, donor_id, is_featured) VALUES
(
  'Traditional Beaded Necklace',
  'A beautiful traditional beaded necklace made with colorful glass beads and natural materials, representing cultural significance in ceremonial occasions.',
  'Jewelry',
  'Traditional',
  'South Sudan',
  ARRAY['https://example.com/images/necklace1.jpg', 'https://example.com/images/necklace2.jpg'],
  'Glass beads, natural fibers',
  'Excellent condition with minor wear on clasp',
  (SELECT id FROM users WHERE username = 'contributor'),
  true
),
(
  'Wooden Carved Bowl',
  'Hand-carved wooden bowl used in traditional ceremonies and daily life, featuring intricate geometric patterns.',
  'Household Items',
  'Traditional',
  'South Sudan',
  ARRAY['https://example.com/images/bowl1.jpg'],
  'Hardwood',
  'Good condition with some natural aging',
  (SELECT id FROM users WHERE username = 'contributor'),
  false
),
(
  'Traditional Textile',
  'Hand-woven traditional textile with distinctive patterns and colors, used in clothing and ceremonial purposes.',
  'Textiles',
  'Traditional',
  'South Sudan',
  ARRAY['https://example.com/images/textile1.jpg', 'https://example.com/images/textile2.jpg'],
  'Cotton, natural dyes',
  'Very good condition, colors still vibrant',
  (SELECT id FROM users WHERE username = 'contributor'),
  true
);

-- Create sample oral histories
INSERT INTO oral_histories (title, narrator_name, narrator_bio, interview_date, location, duration_minutes, summary, tags, interviewer_id, is_featured) VALUES
(
  'Growing Up in Naath Community',
  'Mary Nyandeng',
  'Elder community member who has lived through significant changes in Naath society and culture.',
  '2023-06-15',
  'Juba, South Sudan',
  45,
  'Mary shares her experiences growing up in the Naath community, discussing traditional practices, family life, and how things have changed over the years.',
  ARRAY['Culture', 'History', 'Family'],
  (SELECT id FROM users WHERE username = 'contributor'),
  true
),
(
  'Traditional Healing Practices',
  'Dr. James Gatkuoth',
  'Traditional healer and community leader with extensive knowledge of medicinal plants and healing rituals.',
  '2023-07-20',
  'Bentiu, South Sudan',
  60,
  'Dr. Gatkuoth discusses traditional healing methods, the use of medicinal plants, and how traditional medicine continues to play a role in community health.',
  ARRAY['Health', 'Culture', 'Traditional Medicine'],
  (SELECT id FROM users WHERE username = 'contributor'),
  false
);

-- Create sample comments
INSERT INTO comments (content, article_id, user_id, parent_id, is_approved) VALUES
(
  'This is a fascinating article about our cultural heritage. Thank you for sharing this knowledge.',
  (SELECT id FROM articles WHERE slug = 'origins-of-naath-culture'),
  (SELECT id FROM users WHERE username = 'contributor'),
  NULL,
  true
),
(
  'I remember my grandmother telling me similar stories. It''s wonderful to see this documented.',
  (SELECT id FROM articles WHERE slug = 'origins-of-naath-culture'),
  (SELECT id FROM users WHERE username = 'admin'),
  NULL,
  true
),
(
  'Reply to the previous comment: Yes, oral traditions are so important for preserving our history.',
  (SELECT id FROM articles WHERE slug = 'origins-of-naath-culture'),
  (SELECT id FROM users WHERE username = 'contributor'),
  (SELECT id FROM comments WHERE content LIKE 'I remember my grandmother%'),
  true
);

-- Create sample events
INSERT INTO events (title, description, event_date, end_date, location, event_type, image_url, registration_required, max_participants, is_featured) VALUES
(
  'Naath Cultural Festival 2024',
  'Join us for a celebration of Naath culture featuring traditional music, dance, food, and art exhibitions.',
  '2024-03-15 10:00:00+00',
  '2024-03-15 18:00:00+00',
  'Community Center, Juba',
  'celebration',
  'https://example.com/images/festival.jpg',
  true,
  200,
  true
),
(
  'Traditional Craft Workshop',
  'Learn traditional Naath crafts including beading, weaving, and wood carving from master artisans.',
  '2024-04-20 14:00:00+00',
  '2024-04-20 17:00:00+00',
  'Cultural Center, Bentiu',
  'workshop',
  'https://example.com/images/workshop.jpg',
  true,
  25,
  false
);

-- Create sample products for shop
INSERT INTO products (name, description, price, category, image_urls, stock_quantity, is_active, is_featured) VALUES
(
  'Traditional Beaded Bracelet',
  'Handcrafted beaded bracelet featuring traditional Naath patterns and colors.',
  25.00,
  'Jewelry',
  ARRAY['https://example.com/images/bracelet1.jpg'],
  50,
  true,
  true
),
(
  'Naath Culture Book',
  'Comprehensive guide to Naath culture, history, and traditions.',
  35.00,
  'Books',
  ARRAY['https://example.com/images/book1.jpg'],
  100,
  true,
  false
),
(
  'Traditional Textile Wall Hanging',
  'Beautiful hand-woven textile perfect for home decoration.',
  75.00,
  'Home Decor',
  ARRAY['https://example.com/images/wallhanging1.jpg'],
  20,
  true,
  true
);

-- Create sample education resources
INSERT INTO education_resources (title, type, grade_level, subject, description, content, learning_objectives, tags, is_featured) VALUES
(
  'Introduction to Naath Culture',
  'lesson_plan',
  'Elementary',
  'Social Studies',
  'A comprehensive lesson plan introducing students to basic concepts of Naath culture.',
  'This lesson plan includes activities, discussion points, and resources for teaching about Naath culture in elementary classrooms.',
  ARRAY['Understand basic elements of Naath culture', 'Identify cultural practices and traditions', 'Develop cultural awareness and respect'],
  ARRAY['Culture', 'Education', 'Elementary'],
  true
),
(
  'Traditional Naath Music Worksheet',
  'worksheet',
  'Middle School',
  'Music',
  'Interactive worksheet for learning about traditional Naath musical instruments and styles.',
  'Students will identify different instruments, learn about their cultural significance, and explore musical traditions.',
  ARRAY['Identify traditional instruments', 'Understand cultural context', 'Appreciate musical diversity'],
  ARRAY['Music', 'Education', 'Middle School'],
  false
);
