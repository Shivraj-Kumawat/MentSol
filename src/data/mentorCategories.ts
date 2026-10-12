export interface MentorType {
  label: string;
  description?: string;
}

export interface Subcategory {
  icon: string;
  types: MentorType[];
}

export interface MainCategory {
  description: string;
  icon: string;
  subcategories: Record<string, Subcategory>;
}

export const mentorCategoryStructure: Record<string, MainCategory> = {
  'Exam Preparation': {
    description: 'Help students prepare for competitive exams',
    icon: 'GraduationCap',
    subcategories: {
      'JEE': {
        icon: 'Award',
        types: [
          { label: 'IITian', description: 'From IIT colleges' },
          { label: 'NITian', description: 'From NIT colleges' },
          { label: 'Expert (99+ Percentile)', description: 'Scored 99+ percentile' },
          { label: 'JEE Coach', description: 'Professional coaching experience' },
          { label: 'Top 1000 Ranker', description: 'AIR under 1000' },
        ]
      },
      'NEET': {
        icon: 'Heart',
        types: [
          { label: 'AIIMS Graduate', description: 'From AIIMS institutes' },
          { label: 'Government Medical College', description: 'From GMC' },
          { label: 'Expert (650+ Score)', description: 'Scored 650+ in NEET' },
          { label: 'NEET Coach', description: 'Professional coaching experience' },
          { label: 'Top 1000 Ranker', description: 'AIR under 1000' },
        ]
      },
      'JEE Advanced': {
        icon: 'Trophy',
        types: [
          { label: 'IIT Student', description: 'Currently studying in IIT' },
          { label: 'IIT Graduate', description: 'Graduated from IIT' },
          { label: 'Advanced Coach', description: 'Specialized in Advanced' },
        ]
      },
      'MHT-CET': {
        icon: 'Award',
        types: [
          { label: 'Top Percentile Scorer', description: '99+ percentile' },
          { label: 'Engineering College Student', description: 'From top colleges' },
          { label: 'MHT-CET Expert', description: 'Specialized coaching' },
        ]
      },
      '10th Board': {
        icon: 'BookOpen',
        types: [
          { label: '95%+ Scorer', description: 'Scored 95%+ in boards' },
          { label: 'CBSE Expert', description: 'CBSE board specialist' },
          { label: 'ICSE Expert', description: 'ICSE board specialist' },
          { label: 'State Board Expert', description: 'State board specialist' },
        ]
      },
      '12th Board': {
        icon: 'Book',
        types: [
          { label: '90%+ Scorer', description: 'Scored 90%+ in boards' },
          { label: 'Science Stream Expert', description: 'PCM/PCB specialist' },
          { label: 'Commerce Stream Expert', description: 'Commerce specialist' },
          { label: 'Arts Stream Expert', description: 'Arts specialist' },
        ]
      },
    }
  },

  'College Counselling': {
    description: 'Guide students through college admissions',
    icon: 'School',
    subcategories: {
      'Engineering': {
        icon: 'Cog',
        types: [
          { label: 'IIT Counsellor', description: 'IIT admissions expert' },
          { label: 'NIT Counsellor', description: 'NIT admissions expert' },
          { label: 'Private Engineering Counsellor', description: 'BITS, VIT, etc.' },
          { label: 'Branch Selection Expert', description: 'Help choose branches' },
        ]
      },
      'Medical': {
        icon: 'Stethoscope',
        types: [
          { label: 'MBBS Counsellor', description: 'Medical college admissions' },
          { label: 'AIIMS Counsellor', description: 'AIIMS admissions' },
          { label: 'Paramedical Counsellor', description: 'Allied health sciences' },
        ]
      },
      'MBA': {
        icon: 'Briefcase',
        types: [
          { label: 'IIM Counsellor', description: 'IIM admissions' },
          { label: 'MBA Expert', description: 'General MBA guidance' },
          { label: 'Executive MBA Counsellor', description: 'EMBA programs' },
        ]
      },
      'Study Abroad': {
        icon: 'Plane',
        types: [
          { label: 'US Universities', description: 'USA admissions' },
          { label: 'UK Universities', description: 'UK admissions' },
          { label: 'Canada Universities', description: 'Canada admissions' },
          { label: 'Europe Universities', description: 'Europe admissions' },
          { label: 'Australia Universities', description: 'Australia admissions' },
        ]
      },
    }
  },

  'Content Creation': {
    description: 'Guide aspiring content creators',
    icon: 'Video',
    subcategories: {
      'YouTube': {
        icon: 'Youtube',
        types: [
          { label: '100K+ Subscribers', description: '100K+ subscriber channel' },
          { label: '10K-100K Subscribers', description: '10K-100K subscribers' },
          { label: 'Video Editing Expert', description: 'Professional editing' },
          { label: 'Monetization Expert', description: 'AdSense & sponsorships' },
          { label: 'Content Strategy', description: 'Growth & strategy' },
        ]
      },
      'Instagram': {
        icon: 'Instagram',
        types: [
          { label: '50K+ Followers', description: '50K+ follower account' },
          { label: 'Reels Creator', description: 'Viral reels specialist' },
          { label: 'Brand Collaborations', description: 'Sponsorship expert' },
          { label: 'Photography Expert', description: 'Professional photography' },
        ]
      },
      'LinkedIn': {
        icon: 'Linkedin',
        types: [
          { label: 'Thought Leader', description: 'Personal branding' },
          { label: 'Content Writer', description: 'Professional writing' },
          { label: 'Profile Optimization', description: 'Profile building' },
        ]
      },
      'Blogging': {
        icon: 'FileText',
        types: [
          { label: 'SEO Expert', description: 'Search optimization' },
          { label: 'WordPress Expert', description: 'WordPress specialist' },
          { label: 'Monetization Expert', description: 'Blog revenue' },
        ]
      },
    }
  },

  'Sports Mentorship': {
    description: 'Train athletes and sports enthusiasts',
    icon: 'Trophy',
    subcategories: {
      'Cricket': {
        icon: 'Trophy',
        types: [
          { label: 'Ranji Player', description: 'Ranji trophy player' },
          { label: 'District Level Player', description: 'District level' },
          { label: 'State Level Player', description: 'State level' },
          { label: 'Cricket Coach', description: 'Certified coach' },
        ]
      },
      'Football': {
        icon: 'Trophy',
        types: [
          { label: 'ISL Player', description: 'Indian Super League' },
          { label: 'State League Player', description: 'State league' },
          { label: 'Football Coach', description: 'Certified coach' },
        ]
      },
      'Badminton': {
        icon: 'Trophy',
        types: [
          { label: 'State Champion', description: 'State level champion' },
          { label: 'National Player', description: 'National level' },
          { label: 'Badminton Coach', description: 'Certified coach' },
        ]
      },
      'Basketball': {
        icon: 'Trophy',
        types: [
          { label: 'State Player', description: 'State level' },
          { label: 'Basketball Coach', description: 'Certified coach' },
        ]
      },
      'Tennis': {
        icon: 'Trophy',
        types: [
          { label: 'State Champion', description: 'State level champion' },
          { label: 'Tennis Coach', description: 'Certified coach' },
        ]
      },
    }
  },

  'Mental Health': {
    description: 'Provide mental health support',
    icon: 'Heart',
    subcategories: {
      'Counseling': {
        icon: 'MessageCircle',
        types: [
          { label: 'Licensed Psychologist', description: 'PhD/PsyD' },
          { label: 'Counselor', description: 'Certified counselor' },
          { label: 'Therapist', description: 'Licensed therapist' },
          { label: 'Life Coach', description: 'Certified life coach' },
        ]
      },
      'Addiction Recovery': {
        icon: 'Shield',
        types: [
          { label: 'Addiction Counselor', description: 'Certified counselor' },
          { label: 'Recovery Coach', description: 'Recovery specialist' },
          { label: 'Support Group Leader', description: 'Group support' },
        ]
      },
      'Stress Management': {
        icon: 'Zap',
        types: [
          { label: 'Stress Coach', description: 'Stress management expert' },
          { label: 'Meditation Instructor', description: 'Certified instructor' },
          { label: 'Yoga Instructor', description: 'Certified yoga teacher' },
        ]
      },
    }
  },

  'Financial Planning': {
    description: 'Help with financial decisions',
    icon: 'DollarSign',
    subcategories: {
      'Education Loans': {
        icon: 'GraduationCap',
        types: [
          { label: 'Loan Advisor', description: 'Education loan expert' },
          { label: 'Scholarship Expert', description: 'Scholarship guidance' },
        ]
      },
      'Investment': {
        icon: 'TrendingUp',
        types: [
          { label: 'Financial Advisor', description: 'Certified advisor' },
          { label: 'Stock Market Expert', description: 'Trading expert' },
          { label: 'Mutual Fund Advisor', description: 'MF specialist' },
        ]
      },
      'Tax Planning': {
        icon: 'Calculator',
        types: [
          { label: 'Tax Consultant', description: 'Tax planning expert' },
          { label: 'CA Professional', description: 'Chartered accountant' },
        ]
      },
    }
  },

  'Electronic Accessories': {
    description: 'Tech product recommendations',
    icon: 'Smartphone',
    subcategories: {
      'Laptops & Computers': {
        icon: 'Laptop',
        types: [
          { label: 'Gaming PC Expert', description: 'Gaming builds' },
          { label: 'Professional Workstation', description: 'Work/creative builds' },
          { label: 'Laptop Specialist', description: 'Laptop recommendations' },
        ]
      },
      'Smartphones': {
        icon: 'Smartphone',
        types: [
          { label: 'Android Expert', description: 'Android phones' },
          { label: 'iOS Expert', description: 'iPhones' },
          { label: 'Budget Phone Expert', description: 'Budget options' },
        ]
      },
      'Audio Equipment': {
        icon: 'Headphones',
        types: [
          { label: 'Headphone Expert', description: 'Headphone recommendations' },
          { label: 'Speaker Expert', description: 'Speaker systems' },
        ]
      },
    }
  },

  'Astrology': {
    description: 'Astrological guidance',
    icon: 'Star',
    subcategories: {
      'Vedic Astrology': {
        icon: 'Star',
        types: [
          { label: 'Vedic Astrologer', description: 'Traditional astrology' },
          { label: 'Horoscope Expert', description: 'Birth chart analysis' },
          { label: 'Numerologist', description: 'Numerology expert' },
        ]
      },
    }
  },

  'Stream Selection': {
    description: 'Guide 9th-10th students to choose the right stream',
    icon: 'Route',
    subcategories: {
      'Science Stream': {
        icon: 'Microscope',
        types: [
          { label: 'PCM (Physics, Chemistry, Maths)', description: 'Engineering & technical careers' },
          { label: 'PCB (Physics, Chemistry, Biology)', description: 'Medical & life sciences' },
          { label: 'PCMB (All 4 subjects)', description: 'Keep options open' },
        ]
      },
      'Commerce Stream': {
        icon: 'Calculator',
        types: [
          { label: 'With Maths', description: 'CA, economics, finance' },
          { label: 'Without Maths', description: 'Business, management' },
        ]
      },
      'Arts/Humanities Stream': {
        icon: 'BookOpen',
        types: [
          { label: 'With Psychology', description: 'Counseling, social work' },
          { label: 'With Economics', description: 'Civil services, research' },
          { label: 'With Fine Arts', description: 'Creative fields' },
          { label: 'With Political Science', description: 'Law, administration' },
        ]
      },
      'Career Counseling': {
        icon: 'Target',
        types: [
          { label: 'Aptitude Test Expert', description: 'Identify your strengths' },
          { label: 'Career Path Advisor', description: 'Long-term career planning' },
          { label: 'Subject Selection Guide', description: 'Choose right subjects' },
        ]
      },
    }
  },

  'Family & Relationships': {
    description: 'Professional counseling for family and relationship matters',
    icon: 'Users',
    subcategories: {
      'Love & Romantic Relationships': {
        icon: 'Heart',
        types: [
          { label: 'RCI Registered Relationship Counselor', description: 'Govt. registered counselor' },
          { label: 'Licensed Marriage Counselor', description: 'NIMHANS/RCI certified' },
          { label: 'Pre-marital Counselor', description: 'Certified professional' },
          { label: 'Dating & Compatibility Coach', description: 'Certified relationship coach' },
        ]
      },
      'Family Relationships': {
        icon: 'Users',
        types: [
          { label: 'Licensed Family Therapist (LMFT)', description: 'Govt. licensed therapist' },
          { label: 'Parenting Coach', description: 'Certified parenting expert' },
          { label: 'RCI Registered Child Psychologist', description: 'Child psychology expert' },
          { label: 'Certified Family Mediator', description: 'Intergenerational conflict expert' },
        ]
      },
      'Marital Issues': {
        icon: 'Heart',
        types: [
          { label: 'Licensed Marriage & Family Therapist', description: 'LMFT certified' },
          { label: 'Divorce/Separation Counselor', description: 'Certified professional' },
          { label: 'Certified Conflict Resolution Expert', description: 'Professional mediator' },
          { label: 'RCI Registered Couples Counselor', description: 'Govt. registered expert' },
        ]
      },
      'Parenting & Child': {
        icon: 'Baby',
        types: [
          { label: 'RCI Registered Child Psychologist', description: 'Govt. registered expert' },
          { label: 'Certified Adolescent Counselor', description: 'Teen psychology expert' },
          { label: 'Special Needs Parenting Expert', description: 'Specialized training' },
          { label: 'Certified Positive Parenting Coach', description: 'Professional coach' },
        ]
      },
      'Elder Care & Relationships': {
        icon: 'Users',
        types: [
          { label: 'Certified Geriatric Counselor', description: 'Elder care specialist' },
          { label: 'Elder Care Specialist', description: 'Professional expert' },
          { label: 'Trained Caregiver Support Expert', description: 'Family support professional' },
          { label: 'Senior Relationship Counselor', description: 'Certified professional' },
        ]
      },
    }
  },
};

// Helper function to get all possible selections as flat array
export const getAllMentorTypeOptions = (): string[] => {
  const options: string[] = [];
  
  Object.entries(mentorCategoryStructure).forEach(([mainCategory, mainData]) => {
    Object.entries(mainData.subcategories).forEach(([subcategory, subData]) => {
      subData.types.forEach((type) => {
        options.push(`${mainCategory} > ${subcategory} > ${type.label}`);
      });
    });
  });
  
  return options;
};

// Helper to parse hierarchical path
export const parseMentorType = (path: string) => {
  const parts = path.split(' > ');
  return {
    mainCategory: parts[0] || '',
    subcategory: parts[1] || '',
    type: parts[2] || '',
  };
};
