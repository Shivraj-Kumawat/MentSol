import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookCheck } from 'lucide-react';
import { getExamById, getIconComponent } from '@/data/exams';

const boardOptions = [
  {
    id: 'cbse',
    name: 'CBSE',
    description: 'Central Board of Secondary Education',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'icse',
    name: 'ICSE/ISC',
    description: 'Indian Certificate of Secondary Education',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'state',
    name: 'State Board',
    description: 'SSC, HSC & other State Boards',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'igcse',
    name: 'IGCSE',
    description: 'International General Certificate',
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'ib',
    name: 'IB',
    description: 'International Baccalaureate',
    color: 'from-pink-500 to-pink-600'
  }
];

export default function BoardSelection() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  
  const exam = examId ? getExamById(examId) : undefined;
  
  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Exam not found</h2>
          <Button onClick={() => navigate('/exams')}>Back to Exams</Button>
        </div>
      </div>
    );
  }

  const IconComponent = getIconComponent(exam.icon);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/exams')}
            className="rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${exam.color} flex items-center justify-center shadow-glow`}>
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{exam.name} - Select Your Board</h1>
              <p className="text-xs text-muted-foreground">Choose your education board</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 pb-24">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Which board do you study in?</h2>
          <p className="text-muted-foreground">Select your board to find the right mentors</p>
        </div>

        {/* Board Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boardOptions.map((board) => (
            <Card
              key={board.id}
              className="glass cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95"
              onClick={() => navigate(`/exams/${examId}/board/${board.id}`)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${board.color} flex items-center justify-center mb-3 shadow-glow`}>
                  <BookCheck className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{board.name}</CardTitle>
                <CardDescription>
                  {board.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-primary font-medium">
                  Select Board →
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
