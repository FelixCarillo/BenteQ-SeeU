/* =========================================================
   BENTA Q, SEE U — LISTINGS DATA
   ---------------------------------------------------------
   This is the single source of truth for every marketplace
   listing. The admin inventory manager can safely add, edit,
   or delete entries here without touching mainpage.js.

   Required fields per listing:
     id          unique number
     name        product title
     category    'Fashion' | 'Electronics' | 'Home' | 'Accessories' | ...
     condition   'Like New' | 'Brand New' | 'Good' | ...
     price       number (PHP)
     badge       short label ('New', 'Best Seller', ...)
     description full text — clamped on the card, shown in full when expanded
     tags        array of searchable keywords
     datePosted  ISO 8601 string (used by Newest / Oldest sort)
     seller      { name, handle, campus, avatar }
                 campus is one of: 'San Bartolome' | 'San Francisco' | 'Batasan'
     images      array of image URLs (4 or more recommended)
     viewCount   starting view counter
     postUrl     link to the original Facebook group post
   ========================================================= */

window.LISTINGS = [
  {
    id: 1,
    name: 'Classic Denim Jacket',
    category: 'Fashion',
    condition: 'Like New',
    price: 1299,
    badge: 'Best Seller',
    description:
      'Lightweight everyday jacket with a clean fit and premium finish. Worn only twice — no stains, fading, or loose threads. The denim is a comfortable mid-weight that holds its shape and pairs with both casual and smart-casual outfits. Stored on a hanger in a smoke-free, pet-free home. All original buttons are intact and the inner label is still attached. Reason for selling: I switched to a darker wash and no longer reach for this one.',
    tags: ['denim', 'jacket', 'outerwear', 'streetwear'],
    datePosted: '2026-10-18T09:30:00+08:00',
    seller: {
      name: 'Mika Reyes',
      handle: 'BSIT 3-A',
      campus: 'San Bartolome',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&h=160&q=80'
    },
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=900&q=80'
    ],
    viewCount: 128,
    postUrl: 'https://www.facebook.com/groups/qcumarketplace/posts/1000000001'
  },
  {
    id: 2,
    name: 'Wireless Earbuds Pro',
    category: 'Electronics',
    condition: 'Brand New',
    price: 2499,
    badge: 'New',
    description:
      'Immersive sound, all-day battery life, and compact portability. Sealed box, complete with official receipt and full one-year warranty card. The charging case is untouched, the silicone tips are still in their sealed bag, and the pairing button has never been pressed. Bought from an authorized store in SM Fairview. Reason for selling: I received a duplicate as a gift and only need one.',
    tags: ['earbuds', 'audio', 'wireless', 'gadget'],
    datePosted: '2026-10-21T14:05:00+08:00',
    seller: {
      name: 'Jomar Dela Cruz',
      handle: 'BSCE 2-B',
      campus: 'San Francisco',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&h=160&q=80'
    },
    images: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=900&q=80'
    ],
    viewCount: 341,
    postUrl: 'https://www.facebook.com/groups/qcumarketplace/posts/1000000002'
  },
  {
    id: 3,
    name: 'Minimal Desk Lamp',
    category: 'Home',
    condition: 'Good',
    price: 899,
    badge: 'Popular',
    description:
      'Warm ambient lighting designed to fit modern workspaces. There is a minor cosmetic scratch at the base (see photos), but the bulb, switch, and tilt mechanism all work perfectly. Three brightness levels, USB-C powered, and the shade swivels a full 180 degrees. Great for late-night reviewers who do not want harsh overhead light. No missing screws, no flickering, no buzzing. Reason for selling: I moved to a shared desk setup and no longer need a personal lamp.',
    tags: ['lamp', 'lighting', 'desk', 'minimal'],
    datePosted: '2026-09-30T11:15:00+08:00',
    seller: {
      name: 'Andrea Lim',
      handle: 'BSED 4-A',
      campus: 'Batasan',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80'
    },
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=900&q=80'
    ],
    viewCount: 76,
    postUrl: 'https://www.facebook.com/groups/qcumarketplace/posts/1000000003'
  },
  {
    id: 4,
    name: 'Leather Travel Backpack',
    category: 'Accessories',
    condition: 'Like New',
    price: 1899,
    badge: 'Limited',
    description:
      'Durable carry-on for work, travel, and everyday essentials. Fits a 15-inch laptop with room to spare, plus a padded sleeve for a tablet. Water-resistant coated canvas with genuine leather trim on the straps and base. All zippers run smoothly, the buckles are intact, and the interior lining has no tears. Used for two domestic trips only, then cleaned and conditioned before listing. Reason for selling: I upgraded to a larger weekender for longer trips.',
    tags: ['backpack', 'leather', 'travel', 'bag'],
    datePosted: '2026-10-08T16:45:00+08:00',
    seller: {
      name: 'Paolo Santos',
      handle: 'BSBA 1-C',
      campus: 'San Bartolome',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&h=160&q=80'
    },
    images: [
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=900&q=80'
    ],
    viewCount: 52,
    postUrl: 'https://www.facebook.com/groups/qcumarketplace/posts/1000000004'
  }
];