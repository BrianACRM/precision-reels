INSERT INTO listings (stock_number, year, model, price, note, status, sort_order) VALUES
('JM-017', '2017', 'Jacobsen PGM22 Walk Reel', '$4,850', '22 inch walk-behind reel mower example. Pickup or freight quote confirmed with seller.', 'Available', 10),
('JM-020', '2020', 'Jacobsen Eclipse 2', '$3,950', 'Battery walk mower example with room for condition notes and accessories.', 'Available', 20),
('JM-019', '2019', 'Jacobsen PGM22 Walk Reel', '$3,650', 'Walk-behind reel mower example with room for blade count and accessories.', 'Pending', 30);

INSERT INTO listing_images (listing_id, file_path, alt_text, sort_order)
SELECT id, 'assets/pgm22.png', model, 0 FROM listings WHERE stock_number = 'JM-017';

INSERT INTO listing_images (listing_id, file_path, alt_text, sort_order)
SELECT id, 'assets/eclipse-2.png', model, 0 FROM listings WHERE stock_number = 'JM-020';

INSERT INTO listing_images (listing_id, file_path, alt_text, sort_order)
SELECT id, 'assets/pgm22.png', model, 0 FROM listings WHERE stock_number = 'JM-019';
