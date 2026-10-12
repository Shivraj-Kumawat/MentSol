import { LucideIcon } from 'lucide-react';
import { GraduationCap, Heart, Award, BookOpen, Briefcase, Calculator, TrendingUp, Users, Building } from 'lucide-react';

export interface MentorType {
  id: string;
  label: string;
  description: string;
}

export interface Exam {
  id: string;
  name: string;
  description: string;
  mentorTypes: MentorType[];
  icon: string;
  color: string;
}

export const exams: Exam[] = [
  {
    id: 'jee',
    name: 'JEE',
    description: 'Get mentorship from IITians and NITians who have cracked JEE',
    mentorTypes: [
      { id: 'iitian', label: 'IITian', description: 'Mentors from IIT colleges' },
      { id: 'nitian', label: 'NITian', description: 'Mentors from NIT colleges' },
      { id: 'expert', label: 'Expert', description: 'Experienced JEE coaches' }
    ],
    icon: 'GraduationCap',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'neet',
    name: 'NEET',
    description: 'Connect with AIIMS and GMC mentors for NEET preparation',
    mentorTypes: [
      { id: 'aiims', label: 'AIIMS Mentor', description: 'Mentors from AIIMS' },
      { id: 'gmc', label: 'GMC Mentor', description: 'Mentors from Government Medical Colleges' },
      { id: 'expert', label: 'Expert', description: 'Experienced NEET coaches' }
    ],
    icon: 'Heart',
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'cuet',
    name: 'CUET',
    description: 'Central Universities Entrance Test preparation with DU/JNU mentors',
    mentorTypes: [
      { id: 'du_student', label: 'DU Student', description: 'From Delhi University' },
      { id: 'jnu_student', label: 'JNU Student', description: 'From JNU' },
      { id: 'central_university', label: 'Central University Student', description: 'From other central universities' },
      { id: 'expert', label: 'Expert', description: 'CUET coaching specialists' }
    ],
    icon: 'GraduationCap',
    color: 'from-violet-500 to-purple-600'
  },
  {
    id: 'mhtcet',
    name: 'MHT-CET',
    description: 'Maharashtra state entrance exam mentorship',
    mentorTypes: [
      { id: 'top_percentile', label: '99+ Percentile', description: 'Top scorers' },
      { id: 'expert', label: 'Expert', description: 'MHT-CET specialists' }
    ],
    icon: 'Award',
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'boards_10',
    name: '10th Board',
    description: 'CBSE, ICSE, SSC board exam guidance',
    mentorTypes: [
      { id: 'high_scorer', label: '95%+ Scorer', description: 'Top performers in 10th boards' },
      { id: 'expert', label: 'Expert', description: '10th board exam specialists' }
    ],
    icon: 'BookOpen',
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'boards_12',
    name: '12th Board',
    description: 'CBSE, HSC, ICSE board exam guidance',
    mentorTypes: [
      { id: 'high_scorer', label: '90%+ Scorer', description: 'Top performers in 12th boards' },
      { id: 'expert', label: 'Expert', description: '12th board exam specialists' }
    ],
    icon: 'BookOpen',
    color: 'from-indigo-500 to-purple-600'
  },
  {
    id: 'ssc_cgl',
    name: 'SSC / CGL',
    description: 'Staff Selection Commission exam preparation',
    mentorTypes: [
      { id: 'selected_candidate', label: 'Selected Candidate', description: 'Cleared SSC exams' },
      { id: 'expert', label: 'Expert', description: 'SSC coaching specialists' }
    ],
    icon: 'Briefcase',
    color: 'from-teal-500 to-cyan-600'
  },
  {
    id: 'jam',
    name: 'JAM',
    description: 'IIT Joint Admission Test for MSc preparation',
    mentorTypes: [
      { id: 'iit_msc', label: 'IIT MSc Student', description: 'Currently in IIT MSc programs' },
      { id: 'expert', label: 'Expert', description: 'JAM preparation experts' }
    ],
    icon: 'GraduationCap',
    color: 'from-blue-600 to-indigo-700'
  },
  {
    id: 'ca',
    name: 'CA',
    description: 'Chartered Accountancy exam mentorship',
    mentorTypes: [
      { id: 'qualified_ca', label: 'Qualified CA', description: 'Practicing Chartered Accountants' },
      { id: 'ca_finalist', label: 'CA Finalist', description: 'Cleared CA Final' },
      { id: 'expert', label: 'Expert', description: 'CA coaching professionals' }
    ],
    icon: 'Calculator',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'cat',
    name: 'CAT',
    description: 'MBA entrance exam preparation with IIM mentors',
    mentorTypes: [
      { id: 'iim_alumni', label: 'IIM Alumni', description: 'Graduated from IIM colleges' },
      { id: '99_percentile', label: '99+ Percentile', description: 'Top CAT scorers' },
      { id: 'expert', label: 'Expert', description: 'CAT coaching experts' }
    ],
    icon: 'TrendingUp',
    color: 'from-red-500 to-pink-600'
  },
  {
    id: 'upsc',
    name: 'UPSC',
    description: 'Civil services exam (IAS/IPS/IFS) preparation',
    mentorTypes: [
      { id: 'ias_ips', label: 'IAS / IPS Officer', description: 'Selected civil servants' },
      { id: 'final_cleared', label: 'Mains Cleared', description: 'Cleared UPSC Mains' },
      { id: 'interview_cleared', label: 'Interview Cleared', description: 'Cleared UPSC Interview' },
      { id: 'expert', label: 'Expert', description: 'UPSC coaching professionals' }
    ],
    icon: 'Building',
    color: 'from-slate-600 to-gray-700'
  },
  {
    id: 'state-pcs',
    name: 'State PCS',
    description: 'State level civil services exam preparation',
    mentorTypes: [
      { id: 'pcs_officer', label: 'PCS Officer', description: 'Selected state civil servants' },
      { id: 'mains_cleared', label: 'Mains Cleared', description: 'Cleared State PCS Mains' },
      { id: 'expert', label: 'Expert', description: 'State PCS coaching specialists' }
    ],
    icon: 'Building',
    color: 'from-emerald-600 to-teal-700'
  }
];

export const getExamById = (id: string): Exam | undefined => {
  return exams.find(exam => exam.id === id);
};

export const getIconComponent = (iconName: string): LucideIcon => {
  const icons: Record<string, LucideIcon> = {
    GraduationCap,
    Heart,
    Award,
    BookOpen,
    Briefcase,
    Calculator,
    TrendingUp,
    Users,
    Building
  };
  return icons[iconName] || GraduationCap;
};