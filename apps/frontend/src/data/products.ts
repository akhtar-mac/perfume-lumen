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
}

export const PRODUCTS: Product[] = [
  { id: 1, title: 'Aventus', price: 999, originalPrice: 1999, images: ['/lumen_product_3.png', '/lumen_product_3.png', '', ''], description: 'The legendary scent of success. Bold, fresh, and masculine.', notes: ['Pineapple', 'Birch', 'Musk'] },
  { id: 2, title: 'Crimson Rouge 540', price: 1299, originalPrice: 2499, images: ['/product-1.png', '/product-1.png', '', ''], description: 'An amber floral and woody breeze. Addictive and luminous.', notes: ['Saffron', 'Amberwood', 'Fir Resin'] },
  { id: 3, title: 'Bleu de Lumen', price: 899, originalPrice: 1799, images: ['/lumen_product_5.png', '/lumen_product_5.png', '', ''], description: 'A tribute to masculine freedom in an aromatic-woody trail.', notes: ['Grapefruit', 'Incense', 'Ginger'] },
  { id: 4, title: 'Savage', price: 849, originalPrice: 1699, images: ['/lumen_product_5.png', '/lumen_product_5.png', '', ''], description: 'Radically fresh, raw and noble. A wild manifesto.', notes: ['Bergamot', 'Pepper', 'Ambroxan'] },
  { id: 5, title: 'Midnight Man', price: 949, originalPrice: 1899, images: ['/lumen_product_3.png', '/lumen_product_3.png', '', ''], description: 'The fragrance of a seducer. Spicy and woody.', notes: ['Cardamom', 'Lavender', 'Cedar'] },
  { id: 6, title: 'Dark Orchid', price: 1099, originalPrice: 2199, images: ['/lumen_product_3.png', '/lumen_product_3.png', '', ''], description: 'Luxurious and sensual with rich, dark accords.', notes: ['Truffle', 'Orchid', 'Patchouli'] },
  { id: 7, title: 'Sandalwood 33', price: 1199, originalPrice: 2299, images: ['/lumen_product_4.png', '/lumen_product_4.png', '', ''], description: 'An intoxicating, universally loved woody scent.', notes: ['Sandalwood', 'Papyrus', 'Leather'] },
  { id: 8, title: 'God of Love', price: 799, originalPrice: 1599, images: ['/lumen_product_5.png', '/lumen_product_5.png', '', ''], description: 'A luminous aura with an intense, vibrant, and glowing freshness.', notes: ['Mint', 'Green Apple', 'Tonka Bean'] },
  { id: 9, title: 'Aqua Geo', price: 899, originalPrice: 1799, images: ['/lumen_product_4.png', '/lumen_product_4.png', '', ''], description: 'A resolute dive into the deep blue sea.', notes: ['Sea Notes', 'Lime', 'Bergamot'] },
  { id: 10, title: 'One Billion', price: 999, originalPrice: 1999, images: ['/product-2.png', '/product-2.png', '', ''], description: 'The scent of success and power. Intoxicating and powerful.', notes: ['Blood Mandarin', 'Cinnamon', 'Amber'] },
  { id: 11, title: 'Oud Wood Intense', price: 1499, originalPrice: 2999, images: ['/lumen_product_3.png', '/lumen_product_3.png', '', ''], description: 'Rare, exotic, and distinctive. A precious blend.', notes: ['Oud', 'Rosewood', 'Cardamom'] },
  { id: 12, title: 'Velvet Rose & Oud', price: 1199, originalPrice: 2399, images: ['/product-1.png', '/product-1.png', '', ''], description: 'Darkest damask rose wrapped in smoky oud.', notes: ['Clove', 'Damask Rose', 'Oud'] },
  { id: 13, title: 'Tobacco Vanilla', price: 1299, originalPrice: 2599, images: ['/product-2.png', '/product-2.png', '', ''], description: 'Opulent, warm, and iconic. A modern classic.', notes: ['Tobacco Leaf', 'Vanilla', 'Cocoa'] },
  { id: 14, title: 'Light Blue Escape', price: 749, originalPrice: 1499, images: ['/lumen_product_4.png', '/lumen_product_4.png', '', ''], description: 'The joy of living, the essence of a sunny summer day.', notes: ['Sicilian Lemon', 'Apple', 'Cedar'] },
  { id: 15, title: 'Flower Bomb', price: 1049, originalPrice: 2099, images: ['/product-1.png', '/product-1.png', '', ''], description: 'An explosive floral bouquet that makes everything more positive.', notes: ['Tea', 'Orchid', 'Patchouli'] },
  { id: 16, title: 'Black Opium Night', price: 1149, originalPrice: 2299, images: ['/lumen_product_3.png', '/lumen_product_3.png', '', ''], description: 'Highly addictive and seductive women’s fragrance.', notes: ['Coffee', 'Jasmine', 'Vanilla'] },
  { id: 17, title: 'Good Girl Karma', price: 999, originalPrice: 1999, images: ['/product-1.png', '/product-1.png', '', ''], description: 'A weapon of seduction. Sweet and alluring.', notes: ['Almond', 'Tuberose', 'Tonka Bean'] },
  { id: 18, title: 'Alien Aura', price: 1099, originalPrice: 2199, images: ['/product-1.png', '/product-1.png', '', ''], description: 'Mysterious and fascinating, a solar floral scent.', notes: ['Jasmine', 'Woody Notes', 'Amber'] },
  { id: 19, title: 'Spice Bomb', price: 949, originalPrice: 1899, images: ['/product-2.png', '/product-2.png', '', ''], description: 'An explosive encounter of spices and woods.', notes: ['Pink Pepper', 'Cinnamon', 'Tobacco'] },
  { id: 20, title: 'Terre de Lumen', price: 1049, originalPrice: 2099, images: ['/product-2.png', '/product-2.png', '', ''], description: 'A symbolic narrative revolving around a raw material and its metamorphosis.', notes: ['Orange', 'Pepper', 'Vetiver'] },
  { id: 21, title: 'Fahrenheit Fire', price: 899, originalPrice: 1799, images: ['/product-2.png', '/product-2.png', '', ''], description: 'A revolutionary, unique signature full of contrasts.', notes: ['Nutmeg', 'Violet', 'Leather'] },
  { id: 22, title: 'Nomad', price: 949, originalPrice: 1899, images: ['/lumen_product_4.png', '/lumen_product_4.png', '', ''], description: 'A fragrance that captures the spirit of effortless elegance.', notes: ['Mirabelle', 'Freesia', 'Oakmoss'] },
  { id: 23, title: 'Lost Cherry', price: 1399, originalPrice: 2799, images: ['/product-1.png', '/product-1.png', '', ''], description: 'A luscious, tempting, and insatiable scent.', notes: ['Black Cherry', 'Almond', 'Tonka Bean'] },
  { id: 24, title: 'Silver Mountain Water', price: 1099, originalPrice: 2199, images: ['/lumen_product_4.png', '/lumen_product_4.png', '', ''], description: 'Evokes the sparkling streams coursing through the snow-capped Alps.', notes: ['Bergamot', 'Green Tea', 'Musk'] },
  { id: 25, title: 'Green Irish Tweed', price: 1199, originalPrice: 2399, images: ['/lumen_product_5.png', '/lumen_product_5.png', '', ''], description: 'A classic fougère fragrance, fresh and woody.', notes: ['Lemon Verbena', 'Violet Leaf', 'Sandalwood'] },
  { id: 26, title: 'Lost In Translation', price: 899, originalPrice: 1799, images: ['/lumen_product_4.png', '/lumen_product_4.png', '', ''], description: 'A subtle, clean, and minimalist scent.', notes: ['Aldehydes', 'White Musk', 'Iris'] },
  { id: 27, title: 'By The Fireplace', price: 1049, originalPrice: 2099, images: ['/product-2.png', '/product-2.png', '', ''], description: 'Warm and comforting, like a crackling fire.', notes: ['Chestnut', 'Vanilla', 'Guaiac Wood'] },
  { id: 28, title: 'Jazz Club', price: 1099, originalPrice: 2199, images: ['/product-2.png', '/product-2.png', '', ''], description: 'A smooth cocktail of warm and spicy notes.', notes: ['Rum', 'Tobacco', 'Vanilla'] },
  { id: 29, title: 'Libre Freedom', price: 1149, originalPrice: 2299, images: ['/lumen_product_4.png', '/lumen_product_4.png', '', ''], description: 'The fragrance of freedom, a statement scent.', notes: ['Lavender', 'Orange Blossom', 'Vanilla'] },
  { id: 30, title: 'Baccarat Legend', price: 1299, originalPrice: 2599, images: ['/product-1.png', '/product-1.png', '', ''], description: 'A legendary amber floral signature.', notes: ['Saffron', 'Cedar', 'Ambergris'] }
];
