// Demo data used until the backend is connected.
// Every collection here maps 1:1 to a future database table / API resource.

const DAY = 86400000;
const iso = (offsetDays, hour = 9) => {
  const d = new Date(Date.now() + offsetDays * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};



// Real photos of each model from Wikimedia Commons (free licences, credited on the site).
// Replace with JP's own fleet photos from Admin → Vehicles at any time.
export const commons = (file, w = 1280) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${w}`;
export const commonsPage = (file) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;
// Real photos of each place (Wikimedia Commons, free licences). Listed on /credits.
export const PLACE_PHOTOS = {
  kandy: { file: 'View point of Kandy.jpg', title: 'Kandy Lake and the Temple of the Tooth from Arthur’s Seat' },
  temple: { file: 'Kandy Sri Lanka Temple of the tooth.jpg', title: 'Temple of the Tooth, Kandy', by: 'Thimuth' },
  sigiriya: { file: 'Sigiriya Rock Fortress View from Pidurangala Rock.jpg', title: 'Sigiriya Rock from Pidurangala' },
  ella: { file: 'Nine Arches Bridge in Ella.jpg', title: 'Nine Arches Bridge, Ella', by: 'Knthabrew' },
  nuwara: { file: 'Tea Estate Nuwara Eliya.jpg', title: 'Tea estate near Nanu Oya, Nuwara Eliya', by: 'Keshani Kaveesha' },
  tea: { file: 'Sri Lanka, Tea plantations, Nuwara Eliya.jpg', title: 'Tea plantations, Nuwara Eliya' },
  galle: { file: 'Lighthouse Galle, Sri Lanka.jpg', title: 'Galle Fort lighthouse' },
  mirissa: { file: 'Mirissa Strand Sri Lanka (29779088050).jpg', title: 'Mirissa beach', by: 'dronepicr' },
  airport: { file: 'Bandaranaike International Airport.JPG', title: 'Bandaranaike International Airport', by: 'Saqib Qayyum' },
};
export const place = (key, w = 1600) => commons(PLACE_PHOTOS[key].file, w);

export const PHOTOS = {
  'veh-wagonr': { by: 'Tokumeigakarinoaoshima', files: ['Suzuki WAGON R HYBRID FZ (DAA-MH55S) front.jpg', 'Suzuki WAGON R HYBRID FZ (DAA-MH55S) rear.jpg', 'Suzuki WAGON R HYBRID FZ (DAA-MH55S) interior.jpg'] },
  'veh-aqua': { by: 'Tokumeigakarinoaoshima', files: ['Toyota AQUA S (DAA-NHP10) front.jpg', 'Toyota AQUA S (DAA-NHP10) rear.jpg', 'Toyota AQUA S (DAA-NHP10) interior.jpg'] },
  'veh-axio': { by: 'Tokumeigakarinoaoshima', files: ['Toyota COROLLA Axio HYBRID G (DAA-NKE165-AEXEB) front.JPG', 'Toyota COROLLA Axio HYBRID G (DAA-NKE165-AEXEB) rear.JPG'] },
  'veh-prius': { by: 'Tokumeigakarinoaoshima', files: ['Toyota PRIUS S (DAA-ZVW50-AHXEB) front.JPG', 'Toyota PRIUS S (DAA-ZVW50-AHXEB) rear.JPG', 'Toyota PRIUS S (DAA-ZVW50-AHXEB) interior.JPG'] },
  'veh-premio': { by: 'Tokumeigakarinoaoshima', files: ['Toyota PREMIO 1.5F EX Package (DBA-NZT260-AEXEK) front.jpg', 'Toyota PREMIO 1.5F EX Package (DBA-NZT260-AEXEK) rear.jpg', 'Toyota PREMIO F L Package (DBA-NZT260-AEXEK) interior.jpg'] },
  'veh-vezel': { by: 'Tokumeigakarinoaoshima', files: ['Honda VEZEL HYBRID RS Honda SENSING (DAA-RU3) front.jpg', 'Honda VEZEL HYBRID RS Honda SENSING (DAA-RU3) rear.jpg', 'Honda VEZEL HYBRID RS Honda SENSING (DAA-RU3) interior.jpg'] },
  'veh-xtrail': { by: 'Tokumeigakarinoaoshima', files: ['Nissan X-TRAIL 20X HYBRID (DAA-HNT32) front.jpg', 'Nissan X-TRAIL 20X HYBRID (DAA-HNT32) rear.jpg', 'Nissan X-TRAIL 20X HYBRID (DAA-HNT32) interior.jpg'] },
  'veh-kdh': { by: 'EurovisionNim', files: ['2011-2013 Toyota HiAce (KDH201R) LWB van (2018-09-17) 01.jpg', '2011-2013 Toyota HiAce (KDH201R) LWB van (2018-09-17) 02.jpg'] },
  'veh-montero': { by: 'Captainmorlypogi1959', files: ['Mitsubishi Montero Sport 4x4 GLS 2016 Manual.jpg', 'Mitsubishi Montero Sport 4x4 GLS 2016.jpg'] },
};

const vehicleFeatures = {
  base: ['Air conditioning', 'Bluetooth audio', 'USB charging', 'Power steering'],
};

export function buildSeed() {
  return {
    version: 1,
    settings: {
      businessName: 'JP Rent A Car Kandy',
      tagline: 'Car rental rooted in the heart of Kandy',
      phone: '+94 77 762 3101',
      whatsapp: '94777623101',
      email: '', // no public email yet — add one in Admin → Settings and it appears on the site
      address: '451 William Gopalawa Road, Kandy 20000, Sri Lanka',
      shopPhoto: '',
      deliveryNote: 'Convenient delivery available across Kandy city & stations',
      mapQuery: '451 William Gopallawa Mawatha, Kandy 20000, Sri Lanka',
      hours: 'Monday – Sunday: 7:00 AM – 9:00 PM (Handover & Returns)',
      whatsappHours: 'WhatsApp Inquiry Line: 24/7 Active',
      whatsappNote: 'available 24/7 for instant trip requests',
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      tripadvisor: '',
      currency: 'LKR',
      usdRate: 300,
      eurRate: 330,
      lateFeePerHour: 1000,
      fuelChargePerQuarter: 3500,
      cleaningFee: 5000,
      showUsd: true,
      taxPercent: 0,
      minDriverAge: 21,
      bookingMode: 'instant', // instant | request
      bankDetails: 'Bank: Commercial Bank – Kandy\nAccount name: JP Rent A Car\nAccount no: 0000 0000 0000\nUse your booking number as the reference.',
      logo: '',
      googleRating: 4.9,
      googleReviewCount: 120,
    },

    content: {
      hero: {
        title: 'Explore Sri Lanka, your way.',
        subtitle: 'Dependable cars, friendly local guidance, and the freedom to take the misty hill-country roads at your own pace. Pick up in Kandy or have the car brought to your hotel.',
        image: place('kandy', 1920),
      },
      heroSlides: [
        { id: 'hs-1', image: place('kandy', 1920), caption: 'Kandy, our home town' },
        { id: 'hs-2', image: place('ella', 1920), caption: 'Nine Arches Bridge, Ella' },
        { id: 'hs-3', image: place('sigiriya', 1920), caption: 'Sigiriya Rock' },
        { id: 'hs-4', image: place('nuwara', 1920), caption: 'Tea country, Nuwara Eliya' },
        { id: 'hs-5', image: place('mirissa', 1920), caption: 'Mirissa, south coast' },
      ],
      trustPoints: [
        'Book online or on WhatsApp',
        'Hotel & railway station delivery',
        'Cleaned and checked before every rental',
        '24/7 local road assistance',
      ],
      ctaBanner: {
        title: 'Not sure which car fits your trip?',
        text: 'Tell us your group size and route. We’ll suggest the right vehicle and send a quote within minutes.',
      },
    },

    categories: [
      { id: 'cat-compact', name: 'Compact', description: 'Easy to park in Kandy town, light on fuel.' },
      { id: 'cat-sedan', name: 'Sedan', description: 'Comfortable for long drives and airport runs.' },
      { id: 'cat-suv', name: 'SUV', description: 'Higher seating for hill-country roads.' },
      { id: 'cat-van', name: 'Van', description: 'For families and groups up to 14.' },
      { id: 'cat-4x4', name: '4x4', description: 'For estates, back roads and rough terrain.' },
    ],

    vehicles: [
      v('veh-wagonr', 'Suzuki Wagon R', 'Suzuki', 'Wagon R FZ', 2019, 'cat-compact', 'hatch', '#C9D3D9', 4, 'Automatic', 'Hybrid', 2, 7500, 48000, 175000, 3500, 25000, 'CAA-4521', true,
        'A small, frugal hybrid that slips through Kandy traffic and parks anywhere. Ideal for couples and solo travellers sticking to towns and main roads.'),
      v('veh-aqua', 'Toyota Aqua', 'Toyota', 'Aqua S', 2017, 'cat-compact', 'hatch', '#7FA7C9', 5, 'Automatic', 'Hybrid', 2, 9500, 60000, 220000, 3500, 30000, 'CAB-1187', true,
        'Comfortable for two to four people, with excellent fuel economy on long island loops.'),
      v('veh-axio', 'Toyota Axio', 'Toyota', 'Axio Hybrid G', 2017, 'cat-sedan', 'sedan', '#E8E8E4', 5, 'Automatic', 'Hybrid', 3, 11000, 70000, 260000, 4000, 35000, 'CAD-7730', true,
        'Sri Lanka’s favourite family sedan. A smooth, quiet ride with a proper boot for luggage.'),
      v('veh-prius', 'Toyota Prius', 'Toyota', 'Prius S', 2016, 'cat-sedan', 'sedan', '#2E3B44', 5, 'Automatic', 'Hybrid', 3, 13500, 85000, 310000, 4000, 40000, 'CAF-3092', true,
        'Spacious, very economical hybrid that is comfortable on the expressway and the hill roads alike.'),
      v('veh-premio', 'Toyota Premio', 'Toyota', 'Premio 1.5 F EX', 2019, 'cat-sedan', 'sedan', '#8B8F92', 5, 'Automatic', 'Petrol', 3, 15000, 95000, 345000, 4500, 45000, 'CBA-6610', true,
        'A refined executive sedan for business travel, weddings and airport transfers.'),
      v('veh-vezel', 'Honda Vezel', 'Honda', 'Vezel Hybrid Z', 2018, 'cat-suv', 'suv', '#7A1F2B', 5, 'Automatic', 'Hybrid', 3, 16500, 105000, 380000, 4500, 50000, 'CBC-2245', true,
        'A compact SUV with extra ground clearance for Ella, Nuwara Eliya and the tea-country roads.'),
      v('veh-xtrail', 'Nissan X-Trail', 'Nissan', 'X-Trail Hybrid', 2017, 'cat-suv', 'suv', '#3C4A3F', 5, 'Automatic', 'Hybrid', 4, 18500, 118000, 420000, 5000, 60000, 'CBE-9054', false,
        'Roomy SUV with a large boot. A good choice for families with luggage.'),
      v('veh-kdh', 'Toyota HiAce KDH', 'Toyota', 'HiAce KDH 201 LWB', 2015, 'cat-van', 'van', '#F0F0EC', 14, 'Manual', 'Diesel', 10, 22000, 140000, 500000, 5500, 60000, 'PD-4471', true,
        'The classic Sri Lankan tour van. Up to fourteen seats, plenty of luggage room and strong air conditioning. Usually booked with one of our drivers.'),
      v('veh-montero', 'Mitsubishi Montero Sport', 'Mitsubishi', 'Montero Sport GLS', 2016, 'cat-4x4', 'suv4x4', '#1F2A24', 7, 'Automatic', 'Diesel', 5, 27000, 170000, 620000, 6000, 80000, 'KR-0391', true,
        'A proper 4x4 for estate roads, Knuckles range trips and anywhere the tarmac runs out.'),
    ],

    drivers: [
      { id: 'drv-1', name: 'Janith Perera', phone: '+94 77 762 3101', languages: 'English, Sinhala', experience: 12, licenseNo: 'B1234567', photo: '', status: 'available', rating: 5, bio: 'Founder and lead driver. Knows every bend between Kandy and Ella.' },
      { id: 'drv-2', name: 'Ruwan Bandara', phone: '+94 71 000 1122', languages: 'English, Sinhala, Tamil', experience: 9, licenseNo: 'B2234511', photo: '', status: 'available', rating: 4.9, bio: 'Calm, careful driver and a keen wildlife spotter for Minneriya and Yala trips.' },
      { id: 'drv-3', name: 'Nuwan Jayasinghe', phone: '+94 76 000 4455', languages: 'English, Sinhala, German (basic)', experience: 7, licenseNo: 'B3234599', photo: '', status: 'on-trip', rating: 4.8, bio: 'Long-distance specialist for south-coast and cultural-triangle tours.' },
      { id: 'drv-4', name: 'Sampath Herath', phone: '+94 75 000 7788', languages: 'English, Sinhala', experience: 15, licenseNo: 'B4234520', photo: '', status: 'off', rating: 4.9, bio: 'Van and group-tour driver with fifteen years on Sri Lankan roads.' },
    ],

    extras: [
      { id: 'ext-insurance', name: 'Full cover (reduced excess)', description: 'Reduces your damage excess to zero for peace of mind.', price: 1500, per: 'day', active: true },
      { id: 'ext-childseat', name: 'Child seat', description: 'Suitable for ages 1–4. Fitted before handover.', price: 500, per: 'day', active: true },
      { id: 'ext-router', name: '4G Wi-Fi router', description: 'Unlimited data for up to 5 devices.', price: 600, per: 'day', active: true },
      { id: 'ext-gps', name: 'GPS navigator', description: 'Offline maps of the whole island.', price: 300, per: 'day', active: true },
      { id: 'ext-adddriver', name: 'Additional driver', description: 'Add a second named driver to the agreement.', price: 1000, per: 'trip', active: true },
      { id: 'ext-coolbox', name: 'Cool box', description: 'Keeps water and fruit cold on long drives.', price: 1500, per: 'trip', active: true },
    ],

    locations: [
      { id: 'loc-office', name: 'JP Rent A Car office, Kandy', type: 'office', fee: 0, active: true },
      { id: 'loc-hotel', name: 'Hotel delivery – Kandy city', type: 'hotel', fee: 1500, active: true },
      { id: 'loc-station', name: 'Kandy railway station', type: 'station', fee: 1000, active: true },
      { id: 'loc-peradeniya', name: 'Peradeniya / Botanical Gardens', type: 'area', fee: 1500, active: true },
      { id: 'loc-airport', name: 'Bandaranaike Airport (CMB)', type: 'airport', fee: 12000, active: true },
      { id: 'loc-colombo', name: 'Colombo city', type: 'city', fee: 10000, active: true },
      { id: 'loc-nuwara', name: 'Nuwara Eliya', type: 'city', fee: 8000, active: true },
      { id: 'loc-ella', name: 'Ella', type: 'city', fee: 12000, active: true },
      { id: 'loc-sigiriya', name: 'Sigiriya / Dambulla', type: 'city', fee: 8000, active: true },
      { id: 'loc-galle', name: 'Galle / Mirissa', type: 'city', fee: 15000, active: true },
    ],

    tours: [
      tour('tour-nuwara', 'Kandy to Nuwara Eliya', 'Nuwara Eliya', 77, '2 h 45 min', 16000, place('nuwara', 1280),
        'Climb through tea estates past Ramboda Falls to “Little England”. Stops at a tea factory and Ramboda viewpoint are included.', ['Tea factory visit', 'Ramboda Falls', 'Gregory Lake']),
      tour('tour-ella', 'Kandy to Ella', 'Ella', 138, '4 h 30 min', 26000, place('ella', 1280),
        'The classic hill-country drive via Nuwara Eliya, with time for photos at the tea terraces along the way.', ['Nine Arch Bridge', 'Little Adam’s Peak', 'Tea terraces']),
      tour('tour-sigiriya', 'Kandy to Sigiriya & Dambulla', 'Sigiriya', 90, '2 h 30 min', 17000, place('sigiriya', 1280),
        'Head north to the Cultural Triangle. Your driver waits while you climb Sigiriya and visit the Dambulla cave temples.', ['Sigiriya Rock', 'Dambulla Cave Temple', 'Matale spice garden']),
      tour('tour-galle', 'Kandy to Galle & Mirissa', 'Galle', 235, '5 h 30 min', 38000, place('galle', 1280),
        'A long day down to the south coast using the expressway, finishing in Galle Fort or on the beach at Mirissa.', ['Galle Fort', 'Southern Expressway', 'Mirissa beach']),
      tour('tour-airport', 'Kandy to Bandaranaike Airport', 'Katunayake', 110, '3 h', 18500, place('airport', 1280),
        'Reliable airport transfers timed to your flight, day or night. We track delays for arrivals.', ['Flight tracking', 'Meet & greet', 'Luggage help']),
    ],

    promos: [
      { id: 'promo-1', code: 'WELCOME10', type: 'percent', value: 10, minDays: 1, expires: iso(90).slice(0, 10), active: true, uses: 4, description: '10% off your first booking' },
      { id: 'promo-2', code: 'LONGSTAY15', type: 'percent', value: 15, minDays: 14, expires: iso(180).slice(0, 10), active: true, uses: 2, description: '15% off rentals of 14 days or more' },
      { id: 'promo-3', code: 'KANDY5000', type: 'fixed', value: 5000, minDays: 5, expires: iso(-5).slice(0, 10), active: false, uses: 11, description: 'LKR 5,000 off (expired)' },
    ],

    users: [
      { id: 'usr-admin', role: 'admin', name: 'JP Admin', email: 'admin@jprentacar.lk', password: 'admin123', phone: '+94 77 762 3101', country: 'Sri Lanka', status: 'active', createdAt: iso(-400), avatar: '', documents: [], favorites: [] },
      { id: 'usr-staff', role: 'staff', name: 'Front Desk', email: 'staff@jprentacar.lk', password: 'staff123', phone: '+94 81 000 0000', country: 'Sri Lanka', status: 'active', createdAt: iso(-200), avatar: '', documents: [], favorites: [] },
      { id: 'usr-demo', role: 'customer', name: 'Emma Clarke', email: 'user@demo.com', password: 'user123', phone: '+44 7700 900123', country: 'United Kingdom', status: 'active', createdAt: iso(-60), avatar: '', licenseNo: 'CLARK901234EM9AB', passportNo: '533380006', documents: [{ id: 'doc-1', type: 'Driving licence', name: 'uk-licence.jpg', url: '', status: 'verified', uploadedAt: iso(-20) }], favorites: ['veh-vezel', 'veh-prius'] },
      { id: 'usr-2', role: 'customer', name: 'Lukas Weber', email: 'lukas@example.com', password: 'demo123', phone: '+49 151 0000000', country: 'Germany', status: 'active', createdAt: iso(-45), avatar: '', documents: [], favorites: [] },
      { id: 'usr-3', role: 'customer', name: 'Dilini Wickramasinghe', email: 'dilini@example.com', password: 'demo123', phone: '+94 71 555 0101', country: 'Sri Lanka', status: 'active', createdAt: iso(-120), avatar: '', documents: [], favorites: [] },
      { id: 'usr-4', role: 'customer', name: 'Arjun Mehta', email: 'arjun@example.com', password: 'demo123', phone: '+91 98200 00000', country: 'India', status: 'blocked', createdAt: iso(-300), avatar: '', documents: [], favorites: [] },
    ],

    bookings: [
      bk('bk-1', 'JP-261001', 'usr-demo', 'veh-vezel', -40, -26, 'loc-airport', 'loc-airport', 'self', 'completed', 'paid', 'card', ['ext-insurance', 'ext-router']),
      bk('bk-2', 'JP-261002', 'usr-demo', 'veh-prius', 6, 13, 'loc-hotel', 'loc-office', 'self', 'confirmed', 'partial', 'bank', ['ext-insurance']),
      bk('bk-3', 'JP-261003', 'usr-2', 'veh-kdh', -2, 5, 'loc-airport', 'loc-galle', 'driver', 'active', 'paid', 'card', [], 'drv-3'),
      bk('bk-4', 'JP-261004', 'usr-3', 'veh-axio', 1, 3, 'loc-office', 'loc-office', 'self', 'pending', 'unpaid', 'pickup', []),
      bk('bk-5', 'JP-261005', null, 'veh-montero', 3, 8, 'loc-station', 'loc-ella', 'driver', 'pending', 'unpaid', 'pickup', ['ext-coolbox'], null, { name: 'Sophie Martin', email: 'sophie.m@example.com', phone: '+33 6 00 00 00 00', country: 'France' }),
      bk('bk-6', 'JP-261006', 'usr-3', 'veh-wagonr', -15, -12, 'loc-office', 'loc-office', 'self', 'completed', 'paid', 'pickup', []),
      bk('bk-7', 'JP-261007', 'usr-2', 'veh-aqua', -70, -60, 'loc-colombo', 'loc-office', 'self', 'completed', 'paid', 'card', ['ext-gps']),
      bk('bk-8', 'JP-261008', 'usr-4', 'veh-premio', -9, -7, 'loc-office', 'loc-office', 'self', 'cancelled', 'refunded', 'card', []),
      bk('bk-9', 'JP-261009', null, 'veh-axio', -100, -90, 'loc-airport', 'loc-airport', 'self', 'completed', 'paid', 'bank', ['ext-insurance'], null, { name: 'Tom Hughes', email: 'tom.h@example.com', phone: '+61 400 000 000', country: 'Australia' }),
      bk('bk-10', 'JP-261010', 'usr-demo', 'veh-axio', -130, -125, 'loc-office', 'loc-office', 'self', 'completed', 'paid', 'pickup', []),
    ],

    reviews: [
      rv('rev-g1', 'Kosher Lina', '2-week Sri Lanka tour', 5, 'Vehicles are well maintained and comfortable. I was doing a two weeks tour around Sri Lanka and it was worth the price. Service of the company is next level. Special thanks to the staff who made our tour extra special.', 'google', -200),
      rv('rev-g2', 'Ceylonic Wanders', '10-day island rental', 5, 'I have taken a vehicle for 10 days from this company and their service is reliable and efficient. Very friendly staff and helpful. Vehicle is up to expectations and worth the price. Highly recommended.', 'google', -150),
      rv('rev-g3', 'Natural Best Quality', 'Repeat customer', 5, 'Highly recommended — one of the best rent-a-car services in the Central Area. I’ve used their service many times, always very comfortable vehicles at reasonable prices, with great customer care.', 'google', -120),
      rv('rev-g4', 'Google reviewer', 'Guided tour with driver', 5, 'Driver is amazing — managed to drive fast on a tight schedule while showing us amazing places. Would recommend.', 'google', -90),
      rv('rev-g5', 'B Menik', 'Kandy rental', 5, 'Thank you JP Rent a Car! JP Rent a Car truly stands out as a dependable choice for your car rental needs.', 'google', -80),
      rv('rev-g6', 'C B', 'Breakdown support', 5, 'Janith’s customer service is excellent. Our car broke down and he responded promptly even on a public holiday and swapped out our car. I would highly recommend JP Rent a Car.', 'google', -60),
      { ...rv('rev-s1', 'Emma Clarke', 'Honda Vezel, 14 days', 5, 'Picked up at the airport at 2am without any fuss. The Vezel handled the Ella roads easily and Janith checked in on WhatsApp a couple of times. Would book again.', 'site', -24), userId: 'usr-demo', vehicleId: 'veh-vezel', bookingId: 'bk-1' },
      { ...rv('rev-s2', 'Dilini Wickramasinghe', 'Suzuki Wagon R, 3 days', 4, 'Clean car and a quick handover at the office. Fuel economy was excellent.', 'site', -10), userId: 'usr-3', vehicleId: 'veh-wagonr', bookingId: 'bk-6' },
      { ...rv('rev-s3', 'Lukas Weber', 'Toyota Aqua, 10 days', 5, 'Fair price and honest advice about which roads to avoid in the rain.', 'site', -58), userId: 'usr-2', vehicleId: 'veh-aqua', bookingId: 'bk-7', status: 'pending' },
    ],

    messages: [
      { id: 'msg-1', name: 'Hannah Becker', email: 'hannah@example.com', phone: '+49 160 0000000', subject: 'Van for 9 people in December', message: 'Hi! We are a group of 9 arriving on 20 December for 12 days. Could you quote for a van with a driver, starting at the airport and ending in Colombo?', status: 'new', createdAt: iso(-1, 14), replies: [] },
      { id: 'msg-2', name: 'Rahul Nair', email: 'rahul@example.com', phone: '', subject: 'International driving permit', message: 'Is an Indian licence plus IDP enough to self-drive, or do I need the local endorsement too?', status: 'replied', createdAt: iso(-3, 10), replies: [{ by: 'JP Admin', text: 'Hi Rahul, you need the IDP plus a temporary recognition permit, which we can arrange for you at the AA office in Colombo or online before pickup.', at: iso(-3, 12) }] },
      { id: 'msg-3', name: 'Claire Dubois', email: 'claire@example.com', phone: '+33 6 11 22 33 44', subject: 'Child seat', message: 'Do you have two child seats available for the Prius in March?', status: 'read', createdAt: iso(-6, 18), replies: [] },
    ],

    maintenance: [
      { id: 'mnt-1', vehicleId: 'veh-xtrail', type: 'Service', description: 'Full service, brake pads, new tyres (front)', date: iso(-1).slice(0, 10), cost: 68000, mileage: 84200, status: 'in-progress', nextDue: iso(150).slice(0, 10), endDate: iso(2).slice(0, 10), blocks: true },
      { id: 'mnt-2', vehicleId: 'veh-prius', type: 'Oil change', description: 'Engine oil and filter', date: iso(-20).slice(0, 10), cost: 14500, mileage: 121300, status: 'done', nextDue: iso(70).slice(0, 10) },
      { id: 'mnt-3', vehicleId: 'veh-kdh', type: 'Revenue licence', description: 'Annual revenue licence and emission test', date: iso(12).slice(0, 10), cost: 9000, mileage: 0, status: 'scheduled', nextDue: iso(377).slice(0, 10), endDate: iso(12).slice(0, 10), blocks: true },
      { id: 'mnt-4', vehicleId: 'veh-montero', type: 'Insurance renewal', description: 'Comprehensive insurance renewal', date: iso(25).slice(0, 10), cost: 145000, mileage: 0, status: 'scheduled', nextDue: iso(390).slice(0, 10) },
    ],

    services: [
      { id: 'svc-self', icon: 'Key', title: 'Self-drive rental', text: 'Take the wheel yourself. Daily, weekly and monthly rates with 150 km a day included.', priceFrom: 7500, unit: 'per day', active: true },
      { id: 'svc-driver', icon: 'Users', title: 'Car with driver', text: 'An experienced, English-speaking driver who knows the island. Driver meals and lodging are included.', priceFrom: 3500, unit: 'per day on top of the car', active: true },
      { id: 'svc-airport', icon: 'Plane', title: 'Airport transfers', text: 'Meet-and-greet pickups at Bandaranaike Airport, timed to your flight, day or night.', priceFrom: 18500, unit: 'Kandy ↔ airport', active: true },
      { id: 'svc-tours', icon: 'Map', title: 'Island tours', text: 'Multi-day round trips through the hill country, the Cultural Triangle and the coast, planned with you.', priceFrom: 16000, unit: 'per day, all-in', active: true },
      { id: 'svc-wedding', icon: 'Sparkles', title: 'Weddings & events', text: 'Clean, decorated sedans and vans for the couple, family and guests.', priceFrom: 15000, unit: 'per event', active: true },
      { id: 'svc-long', icon: 'Calendar', title: 'Long-term rental', text: 'Monthly rentals for expats, volunteers and businesses, with servicing included.', priceFrom: 175000, unit: 'per month', active: true },
    ],

    seasons: [
      { id: 'sea-peak', name: 'Peak season', start: `${new Date().getFullYear()}-12-15`, end: `${new Date().getFullYear() + 1}-03-31`, percent: 20, active: true, note: 'December to March, the busiest months for visitors.' },
      { id: 'sea-perahera', name: 'Kandy Esala Perahera', start: `${new Date().getFullYear() + 1}-07-25`, end: `${new Date().getFullYear() + 1}-08-10`, percent: 25, active: true, note: 'Festival weeks in Kandy. Update the dates each year.' },
      { id: 'sea-low', name: 'Monsoon offer', start: `${new Date().getFullYear() + 1}-05-01`, end: `${new Date().getFullYear() + 1}-06-30`, percent: -10, active: true, note: 'Quieter months on the south-west coast.' },
    ],

    whyUs: [
      { id: 'why-1', icon: 'ShieldCheck', title: 'Checked before every rental', text: 'Brakes, tyres and air conditioning are checked and the interior is deep-cleaned before each handover.' },
      { id: 'why-2', icon: 'Mountain', title: 'Local Kandy knowledge', text: 'We know the bends, viewpoints and road conditions from Kandy to Nuwara Eliya, Sigiriya and Ella, and we’re happy to share them.' },
      { id: 'why-3', icon: 'MapPin', title: 'Pick up where it suits you', text: 'Collect from our office, or we’ll bring the car to your hotel, the railway station or the airport.' },
      { id: 'why-4', icon: 'MessageCircle', title: 'A real person on WhatsApp', text: 'No call queues or chatbots. You get a direct line to our team at any hour during your trip.' },
    ],

    steps: [
      { id: 'step-1', title: 'Choose a car and dates', text: 'Search the fleet, compare prices and book online in a few minutes, or send us your trip details on WhatsApp.' },
      { id: 'step-2', title: 'We confirm your booking', text: 'We check the vehicle, confirm by email and WhatsApp, and answer any questions about your route.' },
      { id: 'step-3', title: 'Collect the keys and go', text: 'Meet us in Kandy or receive the car at your hotel, station or the airport, and start your trip.' },
    ],

    destinations: [
      { id: 'dst-1', title: 'Kandy', text: 'The lake, the Temple of the Tooth and the old royal city', image: place('kandy', 1600) },
      { id: 'dst-2', title: 'Ella', text: 'Nine Arches Bridge and Little Adam’s Peak', image: place('ella', 1280) },
      { id: 'dst-3', title: 'Sigiriya', text: 'The 5th-century rock fortress', image: place('sigiriya', 1280) },
      { id: 'dst-4', title: 'Nuwara Eliya', text: 'Cool air and endless tea estates', image: place('nuwara', 1280) },
      { id: 'dst-5', title: 'Galle Fort', text: 'Dutch ramparts and the lighthouse', image: place('galle', 1280) },
      { id: 'dst-6', title: 'Mirissa', text: 'Palm-lined south-coast beaches', image: place('mirissa', 1280) },
    ],

    faqs: [
      { id: 'faq-1', category: 'Licences', question: 'Can I drive in Sri Lanka with my foreign licence?', answer: 'You need an International Driving Permit (IDP) together with your national licence, plus a temporary recognition permit issued in Sri Lanka. We can help you arrange the recognition permit before pickup.' },
      { id: 'faq-2', category: 'Booking', question: 'Do I need to pay when I book?', answer: 'No. You can choose to pay on pickup. Bank transfer and card payments are also available if you prefer to settle in advance.' },
      { id: 'faq-3', category: 'Booking', question: 'What is the minimum age to rent?', answer: 'Drivers must be at least 21 years old and have held a full licence for at least one year.' },
      { id: 'faq-4', category: 'On the road', question: 'Is there a mileage limit?', answer: 'Self-drive rentals include 150 km per day, averaged over the whole rental. Extra kilometres are charged at the rate shown on each vehicle.' },
      { id: 'faq-5', category: 'On the road', question: 'What happens if the car breaks down?', answer: 'Message or call us at any time. We’ll arrange roadside help and, where needed, bring a replacement vehicle to you.' },
      { id: 'faq-6', category: 'Payments', question: 'Is there a security deposit?', answer: 'Yes. A refundable deposit is collected at pickup and returned when the car comes back in the same condition. The amount is shown on each vehicle.' },
      { id: 'faq-7', category: 'Booking', question: 'Can I cancel or change my booking?', answer: 'Free cancellation up to 48 hours before pickup. You can request changes from your account or on WhatsApp.' },
      { id: 'faq-8', category: 'Drivers', question: 'Can I hire a car with a driver?', answer: 'Yes. All of our cars and vans are available with an experienced, English-speaking driver. The driver’s food and lodging are included in the daily driver fee.' },
    ],

    pages: [
      { id: 'about', title: 'About us', body: 'JP Rent A Car is an independent, family-run car rental based in Kandy. We started with one car and a simple idea: give travellers a clean, reliable vehicle and treat them the way we would treat a guest at home.\n\nToday we look after a fleet of compact cars, sedans, SUVs, vans and 4x4s, and a small team of experienced drivers who grew up on these roads. Many of our customers come back year after year, and most of our bookings still start with a WhatsApp message.\n\nWhether you need a Wagon R for three days around Kandy or a van and driver for a two-week island tour, we’ll help you plan the trip and stay a message away until you hand the keys back.' },
      { id: 'terms', title: 'Rental terms', body: 'Drivers must be 21 or older and hold a valid licence for at least one year. Foreign drivers need an International Driving Permit and a Sri Lankan recognition permit.\n\nA refundable security deposit is collected at pickup. The vehicle must be returned with the same fuel level and in the same condition.\n\nSelf-drive rentals include 150 km per day. Additional kilometres are charged at the per-km rate for the vehicle.\n\nSmoking is not allowed in any vehicle. A cleaning fee applies if this rule is broken.\n\nThe renter is responsible for traffic fines and parking charges during the rental period.' },
      { id: 'privacy', title: 'Privacy policy', body: 'We collect only the information needed to manage your booking: your name, contact details, licence and passport details, and trip information.\n\nWe use this information to confirm and manage your rental, to contact you about your booking, and to meet legal requirements. We do not sell your data.\n\nYou can ask us to update or delete your information at any time by contacting us.' },
      { id: 'cancellation', title: 'Cancellation policy', body: 'Cancel free of charge up to 48 hours before your pickup time.\n\nCancellations within 48 hours of pickup are charged one rental day.\n\nNo-shows are charged one rental day. Any advance payment above this amount is refunded within 7 working days.' },
    ],

    notifications: [
      { id: 'ntf-1', userId: 'usr-demo', title: 'Booking confirmed', text: 'Your Toyota Prius booking JP-261002 is confirmed.', read: false, createdAt: iso(-2, 11), link: '/account/bookings' },
      { id: 'ntf-2', userId: 'usr-demo', title: 'Licence verified', text: 'Your driving licence has been verified. You’re all set for pickup.', read: true, createdAt: iso(-19, 9), link: '/account/documents' },
      { id: 'ntf-3', userId: 'admin', title: 'New booking request', text: 'Sophie Martin requested the Montero Sport with driver.', read: false, createdAt: iso(-0.3), link: '/admin/bookings' },
      { id: 'ntf-4', userId: 'admin', title: 'New message', text: 'Hannah Becker asked about a van for 9 people.', read: false, createdAt: iso(-1, 14), link: '/admin/messages' },
    ],
  };

  function v(id, name, make, model, year, categoryId, bodyType, color, seats, transmission, fuel, bags, dailyRate, weeklyRate, monthlyRate, driverRate, deposit, plate, featured, description) {
    const extras = bodyType === 'van' ? ['Rear AC vents', 'Sliding side door', 'Reclining seats'] : bodyType.startsWith('suv') ? ['Reverse camera', 'Cruise control', 'High ground clearance'] : ['Reverse camera', 'Keyless start'];
    if (bodyType === 'suv4x4') extras.push('4WD with low range');
    return {
      id, name, make, model, year, categoryId, seats, transmission, fuel, bags, doors: bodyType === 'van' ? 4 : 5,
      dailyRate, weeklyRate, monthlyRate, driverRate, deposit, extraKmRate: Math.max(30, Math.round(dailyRate / 400 / 5) * 5), kmPerDay: 150,
      plate, featured, status: id === 'veh-xtrail' ? 'maintenance' : 'available', selfDrive: bodyType !== 'van', withDriver: true,
      images: (PHOTOS[id]?.files || []).map((f) => commons(f)),
      photoCredit: PHOTOS[id] ? `Sample photos of this model: ${PHOTOS[id].by}, Wikimedia Commons` : '',
      photoCreditUrl: PHOTOS[id] ? commonsPage(PHOTOS[id].files[0]) : '',
      features: [...vehicleFeatures.base, ...extras], description, mileage: 60000 + Math.round(Math.random() * 60000),
      createdAt: iso(-300),
    };
  }

  function tour(id, title, destination, distanceKm, duration, price, image, description, highlights) {
    return { id, title, from: 'Kandy', destination, distanceKm, duration, price, image, description, highlights, active: true };
  }

  function bk(id, ref, userId, vehicleId, startOff, endOff, pickupId, dropoffId, mode, status, paymentStatus, paymentMethod, extras, driverId = null, guest = null) {
    return {
      id, ref, userId, vehicleId, pickupAt: iso(startOff, 9), dropoffAt: iso(endOff, 9), pickupLocationId: pickupId, dropoffLocationId: dropoffId,
      mode, driverId: driverId || (mode === 'driver' ? 'drv-2' : null), status, paymentStatus, paymentMethod, extras, promoCode: '',
      guest, notes: '', flightNo: '', createdAt: iso(startOff - 12, 15), amountPaid: null, total: null, history: [{ at: iso(startOff - 12, 15), text: 'Booking created' }],
    };
  }

  function rv(id, name, trip, rating, text, source, off) {
    return { id, name, trip, rating, text, source, status: 'approved', createdAt: iso(off), userId: null, vehicleId: null, bookingId: null };
  }
}