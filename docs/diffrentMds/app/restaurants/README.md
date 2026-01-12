# Restaurant Reservation Landing Page

A world-class restaurant reservation landing page inspired by OpenTable, Resy, and Tock.

## Features

### AI-Generated Images
All images are generated using the Ideogram API (V2 model) with professional prompts:
- **Hero Carousel**: 4 stunning restaurant interior and food images (16:9 aspect ratio)
- **Featured Restaurants**: 6 restaurant interior images (1:1 aspect ratio)
- **Cuisine Categories**: 6 cuisine-specific food images (3:4 aspect ratio)

Total: 16 high-quality AI-generated images stored in `/public/restaurants/`

### Components

1. **HeroCarousel** (`components/HeroCarousel.tsx`)
   - Auto-playing carousel with 5-second intervals
   - Smooth transitions with embla-carousel
   - RTL support
   - Gradient overlay for text readability
   - Dots navigation

2. **SearchBar** (`components/SearchBar.tsx`)
   - Date, time, party size, and location inputs
   - Mobile-first responsive design
   - Touch-friendly 44px minimum height inputs
   - Icon-enhanced form fields

3. **FeaturedRestaurants** (`components/FeaturedRestaurants.tsx`)
   - Grid layout (1/2/3 columns responsive)
   - Restaurant cards with hover effects
   - Rating display with stars
   - Price level indicators
   - Image zoom on hover

4. **CuisineCategories** (`components/CuisineCategories.tsx`)
   - 6-column responsive grid
   - Category cards with cuisine images
   - Hover scale and overlay effects
   - Restaurant count per category

5. **SocialProof** (`components/SocialProof.tsx`)
   - Statistics section (users, bookings, rating, partners)
   - Testimonials with customer photos
   - 5-star ratings display

6. **CallToAction** (`components/CallToAction.tsx`)
   - Gradient background
   - Primary and secondary CTAs
   - Feature highlights
   - Links to restaurant signup

## Design System

### Colors
- Primary: Blue 600 (#2563EB)
- Secondary: Gray tones
- Accents: Green (for success), Red (for errors)

### Typography
- Headings: Bold, large sizes (3xl to 6xl)
- Body: Medium weight, comfortable line height
- Hebrew RTL support throughout

### Layout
- Max-width containers: 7xl (80rem)
- Consistent spacing: py-16/py-20 for sections
- Responsive grid: Mobile-first approach

### Animations
- Smooth transitions: 300ms duration
- Hover effects: scale, shadow, opacity
- Carousel auto-play: 5 seconds
- Image zoom: scale-110 on hover

## Technical Details

### Dependencies
```json
{
  "embla-carousel-react": "^8.x",
  "embla-carousel-autoplay": "^8.x",
  "lucide-react": "^0.x",
  "next": "15.5.3"
}
```

### Image Generation Script
Located at: `/scripts/generate-restaurant-images.ts`

Run with:
```bash
npx tsx scripts/generate-restaurant-images.ts
```

Generates 16 images using Ideogram API with optimized prompts for:
- Restaurant interiors
- Food photography
- Cuisine-specific imagery

### RTL Support
- `dir="rtl"` on main container
- Carousel configured with `direction: 'rtl'`
- Text alignment optimized for Hebrew

### Performance
- Next.js Image optimization
- Priority loading for hero images
- Responsive image sizes
- Quality: 90 for hero images

## Routes

- Main page: `/restaurants`
- Links to signup: `/admin/signup`
- Links to login: `/admin/login`
- Links to new restaurant: `/admin/events/new-restaurant`

## Mobile Optimization

- Touch-friendly: 44px minimum height for all interactive elements
- Responsive images: Different sizes for mobile/tablet/desktop
- Mobile menu: Hidden on mobile, visible on desktop
- Stacked layouts: Single column on mobile, grid on desktop

## SEO

- Metadata configured with title, description, and Open Graph tags
- Semantic HTML structure
- Alt text for all images
- Proper heading hierarchy

## Future Enhancements

- [ ] Real restaurant data integration
- [ ] Search functionality implementation
- [ ] Restaurant detail pages
- [ ] Booking flow
- [ ] User authentication
- [ ] Reviews and ratings system
- [ ] Map integration for location search
- [ ] Mobile app download section
- [ ] Newsletter signup
- [ ] Restaurant owner dashboard link

## Credits

- Design inspired by: OpenTable, Resy, Tock
- Images generated with: Ideogram AI (V2 model)
- Icons: Lucide React
- Carousel: Embla Carousel
