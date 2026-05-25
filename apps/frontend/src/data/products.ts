export interface Product {
  id: number;
  title: string;
  price: number;
  originalPrice: number;
  images: string[];
  videoUrl?: string;
  description: string;
  notes: string[];
  inStock?: boolean; // true = In Stock, false = Out of Stock, undefined = assume in stock
  rating?: number;
  reviewsCount?: number;
  badge?: 'new' | 'trending' | 'bestseller' | 'sold-out';
  category?: string;
}

export const PRODUCTS: Product[] = [
  { id: 1, title: 'Aventus', price: 999, originalPrice: 1999, images: ['/lumen_product_3.png', '/lumen_product_3.png', '', ''], description: 'The legendary scent of success. Bold, fresh, and masculine.', notes: ['Pineapple', 'Birch', 'Musk'], rating: 4.7, reviewsCount: 234, badge: 'bestseller', category: 'men' },
  { id: 2, title: 'Crimson Rouge 540', price: 1299, originalPrice: 2499, images: ['/product-1.png', '/product-1.png', '', ''], description: 'An amber floral and woody breeze. Addictive and luminous.', notes: ['Saffron', 'Amberwood', 'Fir Resin'], rating: 4.9, reviewsCount: 412, badge: 'trending', category: 'unisex' },
  { id: 3, title: 'Bleu de Lumen', price: 899, originalPrice: 1799, images: ['/lumen_product_5.png', '/lumen_product_5.png', '', ''], description: 'A tribute to masculine freedom in an aromatic-woody trail.', notes: ['Grapefruit', 'Incense', 'Ginger'], rating: 4.5, reviewsCount: 189, category: 'men' },
  { id: 4, title: 'Savage', price: 849, originalPrice: 1699, images: ['/lumen_product_5.png', '/lumen_product_5.png', '', ''], description: 'Radically fresh, raw and noble. A wild manifesto.', notes: ['Bergamot', 'Pepper', 'Ambroxan'], rating: 4.6, reviewsCount: 156, category: 'men' },
  { id: 5, title: 'Midnight Man', price: 949, originalPrice: 1899, images: ['/lumen_product_3.png', '/lumen_product_3.png', '', ''], description: 'The fragrance of a seducer. Spicy and woody.', notes: ['Cardamom', 'Lavender', 'Cedar'], rating: 4.4, reviewsCount: 98, category: 'men' },
  { id: 6, title: 'Dark Orchid', price: 1099, originalPrice: 2199, images: ['/lumen_product_3.png', '/lumen_product_3.png', '', ''], description: 'Luxurious and sensual with rich, dark accords.', notes: ['Truffle', 'Orchid', 'Patchouli'], rating: 4.8, reviewsCount: 267, badge: 'bestseller', category: 'women' },
  { id: 7, title: 'Sandalwood 33', price: 1199, originalPrice: 2299, images: ['/lumen_product_4.png', '/lumen_product_4.png', '', ''], description: 'An intoxicating, universally loved woody scent.', notes: ['Sandalwood', 'Papyrus', 'Leather'], rating: 4.3, reviewsCount: 87, category: 'men' },
  { id: 8, title: 'God of Love', price: 799, originalPrice: 1599, images: ['/lumen_product_5.png', '/lumen_product_5.png', '', ''], description: 'A luminous aura with an intense, vibrant, and glowing freshness.', notes: ['Mint', 'Green Apple', 'Tonka Bean'], rating: 4.5, reviewsCount: 143, category: 'men' },
  { id: 9, title: 'Aqua Geo', price: 899, originalPrice: 1799, images: ['/lumen_product_4.png', '/lumen_product_4.png', '', ''], description: 'A resolute dive into the deep blue sea.', notes: ['Sea Notes', 'Lime', 'Bergamot'], rating: 4.6, reviewsCount: 178, category: 'men' },
  { id: 10, title: 'One Billion', price: 999, originalPrice: 1999, images: ['/product-2.png', '/product-2.png', '', ''], description: 'The scent of success and power. Intoxicating and powerful.', notes: ['Blood Mandarin', 'Cinnamon', 'Amber'], rating: 4.7, reviewsCount: 321, badge: 'trending', category: 'men' },
  { id: 11, title: 'Oud Wood Intense', price: 1499, originalPrice: 2999, images: ['/lumen_product_3.png', '/lumen_product_3.png', '', ''], description: 'Rare, exotic, and distinctive. A precious blend.', notes: ['Oud', 'Rosewood', 'Cardamom'], rating: 4.8, reviewsCount: 198, badge: 'bestseller', category: 'men' },
  { id: 12, title: 'Velvet Rose & Oud', price: 1199, originalPrice: 2399, images: ['/product-1.png', '/product-1.png', '', ''], description: 'Darkest damask rose wrapped in smoky oud.', notes: ['Clove', 'Damask Rose', 'Oud'], rating: 4.9, reviewsCount: 276, badge: 'new', category: 'women' },
  { id: 13, title: 'Tobacco Vanilla', price: 1299, originalPrice: 2599, images: ['/product-2.png', '/product-2.png', '', ''], description: 'Opulent, warm, and iconic. A modern classic.', notes: ['Tobacco Leaf', 'Vanilla', 'Cocoa'], rating: 4.4, reviewsCount: 134, category: 'men' },
  { id: 14, title: 'Light Blue Escape', price: 749, originalPrice: 1499, images: ['/lumen_product_4.png', '/lumen_product_4.png', '', ''], description: 'The joy of living, the essence of a sunny summer day.', notes: ['Sicilian Lemon', 'Apple', 'Cedar'], rating: 4.5, reviewsCount: 167, category: 'women' },
  { id: 15, title: 'Flower Bomb', price: 1049, originalPrice: 2099, images: ['/product-1.png', '/product-1.png', '', ''], description: 'An explosive floral bouquet that makes everything more positive.', notes: ['Tea', 'Orchid', 'Patchouli'], rating: 4.7, reviewsCount: 245, badge: 'bestseller', category: 'women' },
  { id: 16, title: 'Black Opium Night', price: 1149, originalPrice: 2299, images: ['/lumen_product_3.png', '/lumen_product_3.png', '', ''], description: 'Highly addictive and seductive women\'s fragrance.', notes: ['Coffee', 'Jasmine', 'Vanilla'], rating: 4.6, reviewsCount: 189, category: 'women' },
  { id: 17, title: 'Good Girl Karma', price: 999, originalPrice: 1999, images: ['/product-1.png', '/product-1.png', '', ''], description: 'A weapon of seduction. Sweet and alluring.', notes: ['Almond', 'Tuberose', 'Tonka Bean'], rating: 4.8, reviewsCount: 312, badge: 'trending', category: 'women' },
  { id: 18, title: 'Alien Aura', price: 1099, originalPrice: 2199, images: ['/product-1.png', '/product-1.png', '', ''], description: 'Mysterious and fascinating, a solar floral scent.', notes: ['Jasmine', 'Woody Notes', 'Amber'], rating: 4.3, reviewsCount: 98, category: 'women' },
  { id: 19, title: 'Spice Bomb', price: 949, originalPrice: 1899, images: ['/product-2.png', '/product-2.png', '', ''], description: 'An explosive encounter of spices and woods.', notes: ['Pink Pepper', 'Cinnamon', 'Tobacco'], rating: 4.5, reviewsCount: 156, category: 'men' },
  { id: 20, title: 'Terre de Lumen', price: 1049, originalPrice: 2099, images: ['/product-2.png', '/product-2.png', '', ''], description: 'A symbolic narrative revolving around a raw material and its metamorphosis.', notes: ['Orange', 'Pepper', 'Vetiver'], rating: 4.7, reviewsCount: 223, category: 'men' },
  { id: 21, title: 'Fahrenheit Fire', price: 899, originalPrice: 1799, images: ['/product-2.png', '/product-2.png', '', ''], description: 'A revolutionary, unique signature full of contrasts.', notes: ['Nutmeg', 'Violet', 'Leather'], rating: 4.4, reviewsCount: 112, category: 'men' },
  { id: 22, title: 'Nomad', price: 949, originalPrice: 1899, images: ['/lumen_product_4.png', '/lumen_product_4.png', '', ''], description: 'A fragrance that captures the spirit of effortless elegance.', notes: ['Mirabelle', 'Freesia', 'Oakmoss'], rating: 4.6, reviewsCount: 178, badge: 'new', category: 'women' },
  { id: 23, title: 'Lost Cherry', price: 1399, originalPrice: 2799, images: ['/product-1.png', '/product-1.png', '', ''], description: 'A luscious, tempting, and insatiable scent.', notes: ['Black Cherry', 'Almond', 'Tonka Bean'], rating: 4.9, reviewsCount: 356, badge: 'trending', category: 'women' },
  { id: 24, title: 'Silver Mountain Water', price: 1099, originalPrice: 2199, images: ['/lumen_product_4.png', '/lumen_product_4.png', '', ''], description: 'Evokes the sparkling streams coursing through the snow-capped Alps.', notes: ['Bergamot', 'Green Tea', 'Musk'], rating: 4.5, reviewsCount: 145, category: 'men' },
  { id: 25, title: 'Green Irish Tweed', price: 1199, originalPrice: 2399, images: ['/lumen_product_5.png', '/lumen_product_5.png', '', ''], description: 'A classic fougère fragrance, fresh and woody.', notes: ['Lemon Verbena', 'Violet Leaf', 'Sandalwood'], rating: 4.3, reviewsCount: 89, category: 'men' },
  { id: 26, title: 'Lost In Translation', price: 899, originalPrice: 1799, images: ['/lumen_product_4.png', '/lumen_product_4.png', '', ''], description: 'A subtle, clean, and minimalist scent.', notes: ['Aldehydes', 'White Musk', 'Iris'], rating: 4.6, reviewsCount: 167, badge: 'new', category: 'unisex' },
  { id: 27, title: 'By The Fireplace', price: 1049, originalPrice: 2099, images: ['/product-2.png', '/product-2.png', '', ''], description: 'Warm and comforting, like a crackling fire.', notes: ['Chestnut', 'Vanilla', 'Guaiac Wood'], rating: 4.8, reviewsCount: 289, badge: 'bestseller', category: 'unisex' },
  { id: 28, title: 'Jazz Club', price: 1099, originalPrice: 2199, images: ['/product-2.png', '/product-2.png', '', ''], description: 'A smooth cocktail of warm and spicy notes.', notes: ['Rum', 'Tobacco', 'Vanilla'], rating: 4.4, reviewsCount: 134, category: 'men' },
  { id: 29, title: 'Libre Freedom', price: 1149, originalPrice: 2299, images: ['/lumen_product_4.png', '/lumen_product_4.png', '', ''], description: 'The fragrance of freedom, a statement scent.', notes: ['Lavender', 'Orange Blossom', 'Vanilla'], rating: 4.7, reviewsCount: 256, category: 'women' },
  { id: 30, title: 'Baccarat Legend', price: 1299, originalPrice: 2599, images: ['/product-1.png', '/product-1.png', '', ''], description: 'A legendary amber floral signature.', notes: ['Saffron', 'Cedar', 'Ambergris'], rating: 4.8, reviewsCount: 198, badge: 'new', category: 'unisex' },
];
