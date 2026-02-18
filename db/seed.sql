INSERT OR REPLACE INTO products
(id, slug, title, short, description, price_cents, compare_at_cents, badge, currency, is_active)
VALUES
('prod_portra400','kodak-portra-400','Kodak Portra 400',
'Natural skin tones, fine grain, big dynamic range. 35mm colour negative film.',
'Portra 400 is a flexible, forgiving film with soft contrast and beautiful colour reproduction.',
2500, 3000, 'SALE', 'USD', 1);

INSERT OR REPLACE INTO product_images
(id, product_id, url, sort_order, alt)
VALUES
('img_portra_1','prod_portra400',
'https://images.unsplash.com/photo-1520975693411-b7a115d5a60b?auto=format&fit=crop&w=1400&q=80',
0,'Kodak Portra 400');
