export interface ChampionAchievement {
  year: string;
  title: string;
  category: 'state' | 'national' | 'classic' | 'university';
  description: string;
  badge: string;
  highlight?: boolean;
}

export const ACHIEVEMENTS: ChampionAchievement[] = [
  {
    year: '2026',
    title: 'Mr Telangana Shafi Sami Classic',
    category: 'state',
    badge: 'State Championship',
    description: 'Gold medal victor in the prestigious Shafi Sami Classic state championship.',
    highlight: true,
  },
  {
    year: '2024',
    title: 'Naresh Surya Classic',
    category: 'classic',
    badge: 'Classic Title',
    description: 'Gold honor showcasing unmatched muscle conditioning and symmetry.',
    highlight: false,
  },
  {
    year: '2019',
    title: 'Mr South India 2019',
    category: 'national',
    badge: 'Zonal Pinnacle',
    description: 'Champion of South India — beating elite competitors across 5 southern states.',
    highlight: true,
  },
  {
    year: '2019',
    title: 'Naresh Surya Classic',
    category: 'classic',
    badge: 'Classic Title',
    description: 'Open classic champion with peak conditioning and stage dominance.',
    highlight: false,
  },
  {
    year: '2009 – 2011',
    title: 'Best Physique — Kakatiya University',
    category: 'university',
    badge: '3x Undefeated',
    description: 'Historic 3 consecutive years crowned Best Physique in Kakatiya University.',
    highlight: true,
  },
  {
    year: '2010',
    title: 'Mr Telangana 2010',
    category: 'state',
    badge: 'State Champion',
    description: 'Back-to-back state triumph defending the gold with overwhelming superiority.',
    highlight: false,
  },
  {
    year: '2009',
    title: 'Mr Telangana 2009',
    category: 'state',
    badge: 'State Champion',
    description: 'Crowned Mr Telangana, establishing statewide authority in bodybuilding.',
    highlight: false,
  },
  {
    year: '2008',
    title: 'Mr Warangal 2008',
    category: 'state',
    badge: 'District Origin',
    description: 'Where the legacy took flight — crowned the undisputed champion of Warangal.',
    highlight: false,
  },
];

export interface GymPlan {
  id: string;
  name: string;
  duration: string;
  price: string;
  originalPrice?: string;
  tag?: string;
  isPopular?: boolean;
  features: string[];
}

export const GYM_PLANS: GymPlan[] = [
  {
    id: 'starter',
    name: '1 Month Kickstart',
    duration: '1 Month',
    price: '₹1,200',
    originalPrice: '₹1,500',
    tag: 'Flexible',
    features: [
      'Full floor & free-weights access',
      'Biometric rapid scan check-in',
      'Locker & hydration facility',
      'Initial physique assessment & posture check',
      'Morning & evening slots access',
      'Flexible month-to-month renewal',
    ],
  },
  {
    id: 'transform',
    name: '3 Month Transformation',
    duration: '3 Months',
    price: '₹3,000',
    originalPrice: '₹4,500',
    tag: 'Most Popular',
    isPopular: true,
    features: [
      'Everything in Kickstart pass',
      'Custom workout split designed by Coach',
      'Bi-weekly weight & body-fat tracking',
      'Nutrition guidelines & meal timing advice',
      'Access to Iron Gym Leaderboard & Streak Perks',
      'Save ₹1,500 vs monthly renewal',
    ],
  },
  {
    id: 'elite',
    name: 'Annual Iron Elite',
    duration: '12 Months',
    price: '₹9,999',
    originalPrice: '₹14,400',
    tag: 'Best Value',
    features: [
      'Full 365-day all-access membership',
      'Direct championship form correction & mentoring',
      'Comprehensive custom diet macro targets',
      'Official Iron Gym Athlete Tank / Shaker',
      'Freeze membership up to 30 days for travel',
      'Exclusive invite to seasonal gym challenges',
    ],
  },
];

export const GYM_DETAILS = {
  name: 'IRON GYM',
  ownerName: 'Waheed Khan',
  ownerTitle: 'Mr. South India · Multi-Time Mr. Telangana',
  tagline: 'Built by Champions. Forged in Iron.',
  address: 'Max, Pochamma Maidan, Venu Rao Colony, Sherpura, Warangal, Telangana 506002',
  phone: '+919876543210',
  phoneDisplay: '+91 98765 43210',
  whatsappMessage: 'Hi Iron Gym team, I would like to enquire about membership and book a 1-day free trial session!',
  whatsappCoachMessage: 'Hi Coach Waheed Khan, I would like to consult with you regarding training and transformation at Iron Gym.',
  hours: {
    weekdays: 'Monday – Saturday: 5:30 AM – 10:30 AM & 4:30 PM – 10:00 PM',
    sunday: 'Sunday: Closed',
  },
  googleMapsUrl: 'https://maps.app.goo.gl/ervaohcQUPgwDWiN8',
};
