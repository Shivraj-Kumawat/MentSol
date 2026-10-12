import { CollegeCutoff } from '@/data/collegesCutoff';

export type ProbabilityLevel = 'high' | 'medium' | 'low';

export interface PredictedCollege extends CollegeCutoff {
  probability: ProbabilityLevel;
  probabilityText: string;
  safetyMargin?: number;
}

export const predictColleges = (
  exam: string,
  rank: number,
  category: string,
  allColleges: CollegeCutoff[]
): PredictedCollege[] => {
  // Filter colleges by exam
  const relevantColleges = allColleges.filter(college => college.exam === exam);

  const predictedColleges: PredictedCollege[] = [];

  relevantColleges.forEach(college => {
    const categoryKey = category.toLowerCase() as keyof typeof college.cutoffs;
    const cutoff = college.cutoffs[categoryKey];

    if (!cutoff) return;

    const closingRank = cutoff.closing;
    const openingRank = cutoff.opening;

    let probability: ProbabilityLevel;
    let probabilityText: string;
    let safetyMargin: number;

    // Calculate probability based on rank vs closing rank
    if (rank <= closingRank) {
      // Safe zone - within cutoff
      safetyMargin = ((closingRank - rank) / closingRank) * 100;
      
      if (safetyMargin > 20) {
        probability = 'high';
        probabilityText = 'High Chance - Safe';
      } else if (safetyMargin > 5) {
        probability = 'high';
        probabilityText = 'High Chance';
      } else {
        probability = 'medium';
        probabilityText = 'Moderate Chance';
      }
      
      predictedColleges.push({
        ...college,
        probability,
        probabilityText,
        safetyMargin: Math.round(safetyMargin)
      });
    } else if (rank <= closingRank * 1.15) {
      // Medium zone - 15% above cutoff
      probability = 'medium';
      probabilityText = 'Moderate Chance - Apply';
      safetyMargin = -((rank - closingRank) / closingRank) * 100;
      
      predictedColleges.push({
        ...college,
        probability,
        probabilityText,
        safetyMargin: Math.round(safetyMargin)
      });
    } else if (rank <= closingRank * 1.35) {
      // Low zone - 35% above cutoff
      probability = 'low';
      probabilityText = 'Low Chance - Dream College';
      safetyMargin = -((rank - closingRank) / closingRank) * 100;
      
      predictedColleges.push({
        ...college,
        probability,
        probabilityText,
        safetyMargin: Math.round(safetyMargin)
      });
    }
    // If rank is more than 35% above cutoff, don't show it
  });

  // Sort by probability first, then by rating
  return predictedColleges.sort((a, b) => {
    const probabilityOrder = { high: 0, medium: 1, low: 2 };
    const probDiff = probabilityOrder[a.probability] - probabilityOrder[b.probability];
    
    if (probDiff !== 0) return probDiff;
    
    // Within same probability, sort by rating
    return (b.rating || 0) - (a.rating || 0);
  });
};

export const groupCollegesByProbability = (colleges: PredictedCollege[]) => {
  return {
    high: colleges.filter(c => c.probability === 'high'),
    medium: colleges.filter(c => c.probability === 'medium'),
    low: colleges.filter(c => c.probability === 'low')
  };
};

export const getExamName = (examId: string): string => {
  const examNames: Record<string, string> = {
    'jee-main': 'JEE Main',
    'jee-advanced': 'JEE Advanced',
    'neet': 'NEET',
    'mht-cet': 'MHT-CET',
    'bitsat': 'BITSAT'
  };
  return examNames[examId] || examId;
};

export const getCategoryName = (categoryId: string): string => {
  const categoryNames: Record<string, string> = {
    'general': 'General',
    'obc': 'OBC-NCL',
    'sc': 'SC',
    'st': 'ST',
    'ews': 'EWS'
  };
  return categoryNames[categoryId] || categoryId;
};
