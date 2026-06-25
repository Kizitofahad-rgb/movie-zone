export const pricingPlans = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    price: 0,
    priceLabel: 'Free',
    duration: 7,
    durationLabel: '/ 7 days',
    features: ['Full access for 7 days', 'No commitment', 'Cancel anytime'],
    highlight: false,
  },
  {
    id: 'daily',
    name: 'Daily Pass',
    price: 1000,
    priceLabel: 'UGX 1,000',
    duration: 1,
    durationLabel: '/ day',
    features: ['24 hours full access', 'Perfect for one movie night'],
    highlight: false,
  },
  {
    id: 'weekly',
    name: 'Weekly Pass',
    price: 3500,
    priceLabel: 'UGX 3,500',
    duration: 7,
    durationLabel: '/ week',
    features: ['7 days full access', 'Binge-watch your favorites'],
    highlight: false,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 9900,
    priceLabel: 'UGX 9,900',
    duration: 30,
    durationLabel: '/ month',
    features: ['30 days full access', 'Best value for regular viewers'],
    highlight: true, // "Most Popular"
  },
  {
    id: 'student',
    name: 'Student Plan',
    price: 5000,
    priceLabel: 'UGX 5,000',
    duration: 30,
    durationLabel: '/ month',
    features: ['30 days full access', 'For Uganda university students', 'Valid student ID required'],
    highlight: false,
  },
];

export default pricingPlans;