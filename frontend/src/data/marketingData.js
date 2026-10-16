import { 
  Zap, 
  Tv, 
  MessageSquare, 
  ShieldCheck 
} from 'lucide-react';

export const PILLARS = [
  {
    icon: Zap,
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950',
    title: 'Fast Reception Check-In',
    desc: 'Find returning patients in a single second and hand over confirmed tokens immediately. So straightforward that your front-desk staff needs zero training.'
  },
  {
    icon: Tv,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950',
    title: 'Waiting Room TV Display',
    desc: 'Put token numbers and gentle chimes on any waiting room TV. Patients can see their position at a glance, keeping your reception calm and uncrowded.'
  },
  {
    icon: MessageSquare,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950',
    title: 'Helpful WhatsApp Updates',
    desc: 'Patients receive their digital appointment pass, live queue status, and a quick heads-up on WhatsApp whenever you are caught up or running late.'
  },
  {
    icon: ShieldCheck,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950',
    title: 'Your Patients, 100% Your Data',
    desc: 'You hold full ownership of every patient phone number and clinical record. We never show your patients competing doctors or take commission cuts.'
  }
];

export const COMPARISONS = [
  {
    feature: 'Per-Booking Commission',
    aggregator: '15% - 30% per consultation',
    healthdock: '0% Commission (Unlimited bookings)'
  },
  {
    feature: 'Patient Ownership',
    aggregator: 'Aggregator owns patient data & markets competitors',
    healthdock: 'Doctor 100% owns patient list & records'
  },
  {
    feature: 'Personal Booking URL',
    aggregator: 'Generic directory link with rival doctor ads',
    healthdock: 'Exclusive /your-name link'
  },
  {
    feature: 'WhatsApp Notification Pass',
    aggregator: 'Expensive add-on or completely absent',
    healthdock: 'Automated WhatsApp Token Pass & Live Queue'
  }
];

export const PRICING_PLANS = [
  {
    tag: 'Solo Doctor',
    title: 'Single Practice',
    desc: 'For individual doctors running their own clinic or OPD chamber.',
    price: '₹1,499',
    period: ' / month',
    popular: false,
    btnText: 'Get Started Free',
    btnClass: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    features: [
      'Personal booking link & clinic QR',
      'Unlimited patient visits & tokens',
      'Instant WhatsApp confirmations',
      'Reception check-in desk'
    ]
  },
  {
    tag: 'Group Practice',
    title: 'Multi-Doctor Clinic',
    desc: 'For clinics with multiple specialists sharing a front desk and waiting room.',
    price: '₹3,499',
    period: ' / month',
    popular: true,
    btnText: 'Get Started Free',
    btnClass: 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg',
    features: [
      'Up to 5 doctor booking links',
      'Shared reception booking dashboard',
      'Waiting room TV token display',
      'Live WhatsApp queue updates'
    ]
  },
  {
    tag: 'Hospital & Network',
    title: 'Custom Setup',
    desc: 'For nursing homes, eye hospitals, or multi-branch clinic networks.',
    price: 'Custom',
    period: ' / year',
    popular: false,
    btnText: 'Talk to Us',
    btnClass: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    features: [
      'Unlimited doctors & staff accounts',
      'Custom website & clinic domain',
      'Connects with your existing software',
      'Dedicated phone & on-site support'
    ]
  }
];
