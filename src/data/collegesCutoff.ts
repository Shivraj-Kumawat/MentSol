// College Cutoff Data for 2025 Admissions
// Data sourced from JoSAA 2025, NEET AIQ 2025 official cutoffs

export interface CollegeCutoff {
  id: string;
  name: string;
  location: string;
  type: 'IIT' | 'NIT' | 'IIIT' | 'GFTI' | 'AIIMS' | 'GMC' | 'Private';
  branch: string;
  exam: 'jee-main' | 'jee-advanced' | 'neet' | 'mht-cet' | 'bitsat';
  cutoffs: {
    general: { opening: number; closing: number };
    obc: { opening: number; closing: number };
    sc: { opening: number; closing: number };
    st: { opening: number; closing: number };
    ews: { opening: number; closing: number };
  };
  rating?: number;
  fees?: string;
}

export const collegesCutoffData: CollegeCutoff[] = [
  // ============ IITs - JEE Advanced 2025 ============
  {
    id: 'iit-bombay-cse',
    name: 'IIT Bombay',
    location: 'Mumbai, Maharashtra',
    type: 'IIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-advanced',
    cutoffs: {
      general: { opening: 1, closing: 67 },
      obc: { opening: 1, closing: 29 },
      sc: { opening: 1, closing: 12 },
      st: { opening: 1, closing: 6 },
      ews: { opening: 1, closing: 10 }
    },
    rating: 9.5,
    fees: '₹2.5L/year'
  },
  {
    id: 'iit-delhi-cse',
    name: 'IIT Delhi',
    location: 'New Delhi',
    type: 'IIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-advanced',
    cutoffs: {
      general: { opening: 1, closing: 100 },
      obc: { opening: 1, closing: 45 },
      sc: { opening: 1, closing: 18 },
      st: { opening: 1, closing: 9 },
      ews: { opening: 1, closing: 15 }
    },
    rating: 9.4,
    fees: '₹2.5L/year'
  },
  {
    id: 'iit-madras-cse',
    name: 'IIT Madras',
    location: 'Chennai, Tamil Nadu',
    type: 'IIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-advanced',
    cutoffs: {
      general: { opening: 1, closing: 133 },
      obc: { opening: 1, closing: 58 },
      sc: { opening: 1, closing: 24 },
      st: { opening: 1, closing: 12 },
      ews: { opening: 1, closing: 20 }
    },
    rating: 9.3,
    fees: '₹2.5L/year'
  },
  {
    id: 'iit-kanpur-cse',
    name: 'IIT Kanpur',
    location: 'Kanpur, Uttar Pradesh',
    type: 'IIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-advanced',
    cutoffs: {
      general: { opening: 100, closing: 200 },
      obc: { opening: 45, closing: 90 },
      sc: { opening: 18, closing: 40 },
      st: { opening: 9, closing: 20 },
      ews: { opening: 15, closing: 30 }
    },
    rating: 9.2,
    fees: '₹2.5L/year'
  },
  {
    id: 'iit-kharagpur-cse',
    name: 'IIT Kharagpur',
    location: 'Kharagpur, West Bengal',
    type: 'IIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-advanced',
    cutoffs: {
      general: { opening: 150, closing: 321 },
      obc: { opening: 70, closing: 145 },
      sc: { opening: 30, closing: 70 },
      st: { opening: 15, closing: 35 },
      ews: { opening: 22, closing: 48 }
    },
    rating: 9.1,
    fees: '₹2.5L/year'
  },
  {
    id: 'iit-roorkee-cse',
    name: 'IIT Roorkee',
    location: 'Roorkee, Uttarakhand',
    type: 'IIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-advanced',
    cutoffs: {
      general: { opening: 200, closing: 450 },
      obc: { opening: 90, closing: 200 },
      sc: { opening: 40, closing: 95 },
      st: { opening: 20, closing: 48 },
      ews: { opening: 30, closing: 68 }
    },
    rating: 9.0,
    fees: '₹2.5L/year'
  },
  {
    id: 'iit-guwahati-cse',
    name: 'IIT Guwahati',
    location: 'Guwahati, Assam',
    type: 'IIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-advanced',
    cutoffs: {
      general: { opening: 250, closing: 600 },
      obc: { opening: 110, closing: 270 },
      sc: { opening: 50, closing: 130 },
      st: { opening: 25, closing: 65 },
      ews: { opening: 38, closing: 90 }
    },
    rating: 8.9,
    fees: '₹2.5L/year'
  },
  {
    id: 'iit-hyderabad-cse',
    name: 'IIT Hyderabad',
    location: 'Hyderabad, Telangana',
    type: 'IIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-advanced',
    cutoffs: {
      general: { opening: 400, closing: 900 },
      obc: { opening: 180, closing: 400 },
      sc: { opening: 80, closing: 190 },
      st: { opening: 40, closing: 95 },
      ews: { opening: 60, closing: 135 }
    },
    rating: 8.8,
    fees: '₹2.5L/year'
  },
  {
    id: 'iit-bombay-ece',
    name: 'IIT Bombay',
    location: 'Mumbai, Maharashtra',
    type: 'IIT',
    branch: 'Electronics and Communication Engineering',
    exam: 'jee-advanced',
    cutoffs: {
      general: { opening: 300, closing: 680 },
      obc: { opening: 135, closing: 310 },
      sc: { opening: 60, closing: 150 },
      st: { opening: 30, closing: 75 },
      ews: { opening: 45, closing: 102 }
    },
    rating: 9.3,
    fees: '₹2.5L/year'
  },
  {
    id: 'iit-delhi-ece',
    name: 'IIT Delhi',
    location: 'New Delhi',
    type: 'IIT',
    branch: 'Electronics and Communication Engineering',
    exam: 'jee-advanced',
    cutoffs: {
      general: { opening: 350, closing: 750 },
      obc: { opening: 160, closing: 340 },
      sc: { opening: 70, closing: 165 },
      st: { opening: 35, closing: 83 },
      ews: { opening: 53, closing: 113 }
    },
    rating: 9.2,
    fees: '₹2.5L/year'
  },

  // ============ NITs - JEE Main 2025 ============
  {
    id: 'nit-trichy-cse',
    name: 'NIT Tiruchirappalli',
    location: 'Tiruchirappalli, Tamil Nadu',
    type: 'NIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 1200, closing: 3456 },
      obc: { opening: 800, closing: 1986 },
      sc: { opening: 400, closing: 950 },
      st: { opening: 200, closing: 480 },
      ews: { opening: 180, closing: 520 }
    },
    rating: 8.7,
    fees: '₹1.5L/year'
  },
  {
    id: 'nit-warangal-cse',
    name: 'NIT Warangal',
    location: 'Warangal, Telangana',
    type: 'NIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 1500, closing: 4200 },
      obc: { opening: 1000, closing: 2400 },
      sc: { opening: 500, closing: 1150 },
      st: { opening: 250, closing: 580 },
      ews: { opening: 230, closing: 630 }
    },
    rating: 8.6,
    fees: '₹1.5L/year'
  },
  {
    id: 'nit-surathkal-cse',
    name: 'NIT Karnataka (Surathkal)',
    location: 'Surathkal, Karnataka',
    type: 'NIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 1800, closing: 4680 },
      obc: { opening: 1200, closing: 2670 },
      sc: { opening: 600, closing: 1280 },
      st: { opening: 300, closing: 645 },
      ews: { opening: 270, closing: 705 }
    },
    rating: 8.5,
    fees: '₹1.5L/year'
  },
  {
    id: 'nit-rourkela-cse',
    name: 'NIT Rourkela',
    location: 'Rourkela, Odisha',
    type: 'NIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 2500, closing: 6890 },
      obc: { opening: 1600, closing: 3920 },
      sc: { opening: 800, closing: 1880 },
      st: { opening: 400, closing: 950 },
      ews: { opening: 380, closing: 1040 }
    },
    rating: 8.4,
    fees: '₹1.5L/year'
  },
  {
    id: 'nit-calicut-cse',
    name: 'NIT Calicut',
    location: 'Calicut, Kerala',
    type: 'NIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 3000, closing: 7520 },
      obc: { opening: 1800, closing: 4280 },
      sc: { opening: 900, closing: 2050 },
      st: { opening: 450, closing: 1035 },
      ews: { opening: 450, closing: 1135 }
    },
    rating: 8.3,
    fees: '₹1.5L/year'
  },
  {
    id: 'nit-trichy-ece',
    name: 'NIT Tiruchirappalli',
    location: 'Tiruchirappalli, Tamil Nadu',
    type: 'NIT',
    branch: 'Electronics and Communication Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 5000, closing: 10250 },
      obc: { opening: 2800, closing: 5850 },
      sc: { opening: 1400, closing: 2800 },
      st: { opening: 700, closing: 1410 },
      ews: { opening: 750, closing: 1545 }
    },
    rating: 8.5,
    fees: '₹1.5L/year'
  },
  {
    id: 'nit-warangal-ece',
    name: 'NIT Warangal',
    location: 'Warangal, Telangana',
    type: 'NIT',
    branch: 'Electronics and Communication Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 5500, closing: 11450 },
      obc: { opening: 3100, closing: 6520 },
      sc: { opening: 1550, closing: 3120 },
      st: { opening: 775, closing: 1570 },
      ews: { opening: 830, closing: 1725 }
    },
    rating: 8.4,
    fees: '₹1.5L/year'
  },
  {
    id: 'nit-delhi-cse',
    name: 'NIT Delhi',
    location: 'Delhi',
    type: 'NIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 4200, closing: 9850 },
      obc: { opening: 2400, closing: 5610 },
      sc: { opening: 1200, closing: 2690 },
      st: { opening: 600, closing: 1355 },
      ews: { opening: 630, closing: 1485 }
    },
    rating: 8.2,
    fees: '₹1.5L/year'
  },
  {
    id: 'nit-nagpur-cse',
    name: 'VNIT Nagpur',
    location: 'Nagpur, Maharashtra',
    type: 'NIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 5800, closing: 12300 },
      obc: { opening: 3300, closing: 7010 },
      sc: { opening: 1650, closing: 3360 },
      st: { opening: 825, closing: 1690 },
      ews: { opening: 875, closing: 1855 }
    },
    rating: 8.1,
    fees: '₹1.5L/year'
  },
  {
    id: 'nit-allahabad-cse',
    name: 'MNNIT Allahabad',
    location: 'Allahabad, Uttar Pradesh',
    type: 'NIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 6200, closing: 13450 },
      obc: { opening: 3520, closing: 7660 },
      sc: { opening: 1760, closing: 3670 },
      st: { opening: 880, closing: 1845 },
      ews: { opening: 935, closing: 2030 }
    },
    rating: 8.0,
    fees: '₹1.5L/year'
  },

  // ============ IIITs - JEE Main 2025 ============
  {
    id: 'iiit-hyderabad-cse',
    name: 'IIIT Hyderabad',
    location: 'Hyderabad, Telangana',
    type: 'IIIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 500, closing: 1580 },
      obc: { opening: 400, closing: 900 },
      sc: { opening: 200, closing: 430 },
      st: { opening: 100, closing: 220 },
      ews: { opening: 75, closing: 238 }
    },
    rating: 9.0,
    fees: '₹3L/year'
  },
  {
    id: 'iiit-bangalore-cse',
    name: 'IIIT Bangalore',
    location: 'Bangalore, Karnataka',
    type: 'IIIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 800, closing: 2150 },
      obc: { opening: 600, closing: 1230 },
      sc: { opening: 300, closing: 590 },
      st: { opening: 150, closing: 300 },
      ews: { opening: 120, closing: 325 }
    },
    rating: 8.8,
    fees: '₹3L/year'
  },
  {
    id: 'iiit-delhi-cse',
    name: 'IIIT Delhi',
    location: 'Delhi',
    type: 'IIIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 1000, closing: 2680 },
      obc: { opening: 750, closing: 1530 },
      sc: { opening: 375, closing: 733 },
      st: { opening: 190, closing: 370 },
      ews: { opening: 150, closing: 404 }
    },
    rating: 8.7,
    fees: '₹3L/year'
  },
  {
    id: 'iiit-allahabad-cse',
    name: 'IIIT Allahabad',
    location: 'Allahabad, Uttar Pradesh',
    type: 'IIIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 2200, closing: 5890 },
      obc: { opening: 1400, closing: 3360 },
      sc: { opening: 700, closing: 1610 },
      st: { opening: 350, closing: 810 },
      ews: { opening: 330, closing: 890 }
    },
    rating: 8.5,
    fees: '₹2L/year'
  },
  {
    id: 'iiit-pune-cse',
    name: 'IIIT Pune',
    location: 'Pune, Maharashtra',
    type: 'IIIT',
    branch: 'Computer Science and Engineering',
    exam: 'jee-main',
    cutoffs: {
      general: { opening: 3500, closing: 8240 },
      obc: { opening: 2000, closing: 4690 },
      sc: { opening: 1000, closing: 2250 },
      st: { opening: 500, closing: 1135 },
      ews: { opening: 525, closing: 1245 }
    },
    rating: 8.3,
    fees: '₹2L/year'
  },

  // ============ AIIMS - NEET 2025 ============
  {
    id: 'aiims-delhi-mbbs',
    name: 'AIIMS Delhi',
    location: 'New Delhi',
    type: 'AIIMS',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 1, closing: 47 },
      obc: { opening: 1, closing: 240 },
      sc: { opening: 1, closing: 840 },
      st: { opening: 1, closing: 2000 },
      ews: { opening: 1, closing: 260 }
    },
    rating: 9.8,
    fees: '₹5K/year'
  },
  {
    id: 'aiims-jodhpur-mbbs',
    name: 'AIIMS Jodhpur',
    location: 'Jodhpur, Rajasthan',
    type: 'AIIMS',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 50, closing: 210 },
      obc: { opening: 250, closing: 890 },
      sc: { opening: 850, closing: 2100 },
      st: { opening: 2010, closing: 4200 },
      ews: { opening: 270, closing: 950 }
    },
    rating: 9.2,
    fees: '₹5K/year'
  },
  {
    id: 'aiims-rishikesh-mbbs',
    name: 'AIIMS Rishikesh',
    location: 'Rishikesh, Uttarakhand',
    type: 'AIIMS',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 100, closing: 320 },
      obc: { opening: 310, closing: 1050 },
      sc: { opening: 1000, closing: 2450 },
      st: { opening: 2300, closing: 4850 },
      ews: { opening: 330, closing: 1150 }
    },
    rating: 9.1,
    fees: '₹5K/year'
  },
  {
    id: 'aiims-bhopal-mbbs',
    name: 'AIIMS Bhopal',
    location: 'Bhopal, Madhya Pradesh',
    type: 'AIIMS',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 200, closing: 580 },
      obc: { opening: 600, closing: 1680 },
      sc: { opening: 1500, closing: 3250 },
      st: { opening: 3100, closing: 6200 },
      ews: { opening: 590, closing: 1890 }
    },
    rating: 9.0,
    fees: '₹5K/year'
  },
  {
    id: 'aiims-patna-mbbs',
    name: 'AIIMS Patna',
    location: 'Patna, Bihar',
    type: 'AIIMS',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 250, closing: 685 },
      obc: { opening: 700, closing: 1920 },
      sc: { opening: 1700, closing: 3680 },
      st: { opening: 3500, closing: 7100 },
      ews: { opening: 690, closing: 2180 }
    },
    rating: 8.9,
    fees: '₹5K/year'
  },
  {
    id: 'aiims-bhubaneswar-mbbs',
    name: 'AIIMS Bhubaneswar',
    location: 'Bhubaneswar, Odisha',
    type: 'AIIMS',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 300, closing: 785 },
      obc: { opening: 800, closing: 2150 },
      sc: { opening: 2000, closing: 4100 },
      st: { opening: 3900, closing: 8200 },
      ews: { opening: 790, closing: 2450 }
    },
    rating: 8.8,
    fees: '₹5K/year'
  },
  {
    id: 'aiims-raipur-mbbs',
    name: 'AIIMS Raipur',
    location: 'Raipur, Chhattisgarh',
    type: 'AIIMS',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 400, closing: 1050 },
      obc: { opening: 1080, closing: 2890 },
      sc: { opening: 2700, closing: 5500 },
      st: { opening: 5300, closing: 10500 },
      ews: { opening: 1060, closing: 3280 }
    },
    rating: 8.7,
    fees: '₹5K/year'
  },
  {
    id: 'aiims-nagpur-mbbs',
    name: 'AIIMS Nagpur',
    location: 'Nagpur, Maharashtra',
    type: 'AIIMS',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 500, closing: 1280 },
      obc: { opening: 1300, closing: 3420 },
      sc: { opening: 3200, closing: 6800 },
      st: { opening: 6500, closing: 12800 },
      ews: { opening: 1290, closing: 3990 }
    },
    rating: 8.6,
    fees: '₹5K/year'
  },
  {
    id: 'aiims-madurai-mbbs',
    name: 'AIIMS Madurai',
    location: 'Madurai, Tamil Nadu',
    type: 'AIIMS',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 600, closing: 1590 },
      obc: { opening: 1600, closing: 4200 },
      sc: { opening: 4000, closing: 8500 },
      st: { opening: 8200, closing: 15800 },
      ews: { opening: 1600, closing: 4950 }
    },
    rating: 8.5,
    fees: '₹5K/year'
  },

  // ============ Government Medical Colleges - NEET 2025 ============
  {
    id: 'maulana-azad-mbbs',
    name: 'Maulana Azad Medical College',
    location: 'New Delhi',
    type: 'GMC',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 100, closing: 450 },
      obc: { opening: 460, closing: 1350 },
      sc: { opening: 1200, closing: 2850 },
      st: { opening: 2700, closing: 5600 },
      ews: { opening: 455, closing: 1450 }
    },
    rating: 9.3,
    fees: '₹15K/year'
  },
  {
    id: 'ucms-delhi-mbbs',
    name: 'University College of Medical Sciences',
    location: 'New Delhi',
    type: 'GMC',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 200, closing: 680 },
      obc: { opening: 690, closing: 1890 },
      sc: { opening: 1700, closing: 3800 },
      st: { opening: 3600, closing: 7500 },
      ews: { opening: 685, closing: 2180 }
    },
    rating: 9.1,
    fees: '₹15K/year'
  },
  {
    id: 'kmc-manipal-mbbs',
    name: 'Kasturba Medical College',
    location: 'Manipal, Karnataka',
    type: 'GMC',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 800, closing: 2450 },
      obc: { opening: 2500, closing: 5680 },
      sc: { opening: 5500, closing: 11200 },
      st: { opening: 10800, closing: 21500 },
      ews: { opening: 2460, closing: 7050 }
    },
    rating: 8.9,
    fees: '₹25K/year'
  },
  {
    id: 'gmc-chandigarh-mbbs',
    name: 'Government Medical College',
    location: 'Chandigarh',
    type: 'GMC',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 300, closing: 890 },
      obc: { opening: 900, closing: 2350 },
      sc: { opening: 2200, closing: 4900 },
      st: { opening: 4700, closing: 9800 },
      ews: { opening: 895, closing: 2850 }
    },
    rating: 9.0,
    fees: '₹20K/year'
  },
  {
    id: 'armed-forces-mbbs',
    name: 'Armed Forces Medical College',
    location: 'Pune, Maharashtra',
    type: 'GMC',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 150, closing: 520 },
      obc: { opening: 530, closing: 1480 },
      sc: { opening: 1400, closing: 3150 },
      st: { opening: 3000, closing: 6200 },
      ews: { opening: 525, closing: 1680 }
    },
    rating: 9.4,
    fees: '₹10K/year'
  },
  {
    id: 'gmc-mumbai-mbbs',
    name: 'Grant Medical College',
    location: 'Mumbai, Maharashtra',
    type: 'GMC',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 400, closing: 1150 },
      obc: { opening: 1180, closing: 3200 },
      sc: { opening: 3000, closing: 6500 },
      st: { opening: 6300, closing: 12500 },
      ews: { opening: 1160, closing: 3680 }
    },
    rating: 8.8,
    fees: '₹18K/year'
  },
  {
    id: 'gmc-pune-mbbs',
    name: 'BJ Medical College',
    location: 'Pune, Maharashtra',
    type: 'GMC',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 450, closing: 1280 },
      obc: { opening: 1300, closing: 3560 },
      sc: { opening: 3400, closing: 7200 },
      st: { opening: 7000, closing: 14000 },
      ews: { opening: 1290, closing: 4100 }
    },
    rating: 8.7,
    fees: '₹17K/year'
  },
  {
    id: 'sms-jaipur-mbbs',
    name: 'SMS Medical College',
    location: 'Jaipur, Rajasthan',
    type: 'GMC',
    branch: 'MBBS',
    exam: 'neet',
    cutoffs: {
      general: { opening: 500, closing: 1450 },
      obc: { opening: 1480, closing: 3980 },
      sc: { opening: 3800, closing: 8100 },
      st: { opening: 7900, closing: 15600 },
      ews: { opening: 1460, closing: 4650 }
    },
    rating: 8.6,
    fees: '₹16K/year'
  },
];

export const getCollegesByExam = (exam: string): CollegeCutoff[] => {
  return collegesCutoffData.filter(college => college.exam === exam);
};

export const getCollegesByType = (type: string): CollegeCutoff[] => {
  return collegesCutoffData.filter(college => college.type === type);
};
