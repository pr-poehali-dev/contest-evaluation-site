import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Criteria {
  name: string;
  score: number;
  maxScore: number;
}

interface Submission {
  id: number;
  participant: string;
  type: 'video' | 'essay';
  title: string;
  content: string;
  videoUrl?: string;
  rating?: number;
  criteria?: Criteria[];
  comment?: string;
  status: 'pending' | 'reviewed';
}

const videoCriteria = [
  { name: 'Информативность', score: 0, maxScore: 7 },
  { name: 'Уникальность', score: 0, maxScore: 7 },
  { name: 'Соответствие заданной теме', score: 0, maxScore: 5 },
  { name: 'Соответствие регламента (времени)', score: 0, maxScore: 5 }
];

const essayCriteria = [
  { name: 'Информативность', score: 0, maxScore: 7 },
  { name: 'Уникальность', score: 0, maxScore: 7 },
  { name: 'Соответствие заданной теме', score: 0, maxScore: 5 },
  { name: 'Соответствие регламента (времени)', score: 0, maxScore: 5 }
];

const API_URLS = {
  submissions: 'https://functions.poehali.dev/9ae0fab6-fcf6-4c8b-a319-098cbb2199ce',
  ratings: 'https://functions.poehali.dev/bbdd29cb-50e8-4787-ba4c-6ecc844513f0'
};

export default function Index() {
  const navigate = useNavigate();
  const expertName = localStorage.getItem('expertName');
  const expertId = localStorage.getItem('expertId');
  const expertRole = localStorage.getItem('expertRole');
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const response = await fetch(API_URLS.submissions);
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((s: any) => ({
          id: s.id,
          participant: s.participant,
          type: s.type as 'video' | 'essay',
          title: s.title,
          content: s.content,
          videoUrl: s.videoUrl,
          status: s.status as 'pending' | 'reviewed',
          rating: s.avgScore > 0 ? s.avgScore : undefined
        }));
        setSubmissions(mapped);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    const defaultCriteria = submission.type === 'video' ? videoCriteria : essayCriteria;
    setCriteria(submission.criteria || JSON.parse(JSON.stringify(defaultCriteria)));
  };

  const videoSubmissions = submissions.filter(s => s.type === 'video');
  const essaySubmissions = submissions.filter(s => s.type === 'essay');
  const reviewedCount = submissions.filter(s => s.status === 'reviewed').length;
  const totalCount = submissions.length;
  const progress = (reviewedCount / totalCount) * 100;

  const handleSubmitRating = async () => {
    if (!selectedSubmission || !expertId) return;
    
    const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);
    
    setLoading(true);
    try {
      const response = await fetch(API_URLS.ratings, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Expert-Id': expertId
        },
        body: JSON.stringify({
          submission_id: selectedSubmission.id,
          informativeness: criteria[0].score,
          uniqueness: criteria[1].score,
          theme_compliance: criteria[2].score,
          regulation_compliance: criteria[3].score,
          comment: comment
        })
      });

      if (response.ok) {
        toast.success('Оценка сохранена!', {
          description: `${selectedSubmission.participant} - ${totalScore} баллов`
        });
        setComment('');
        await loadSubmissions();
      } else {
        toast.error('Ошибка сохранения оценки');
      }
    } catch (error) {
      toast.error('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const updateCriteriaScore = (index: number, value: number) => {
    const newCriteria = [...criteria];
    newCriteria[index].score = value;
    setCriteria(newCriteria);
  };

  const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);
  const maxTotalScore = criteria.reduce((sum, c) => sum + c.maxScore, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-[hsl(225,30%,12%)] text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="Award" size={32} className="text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Конкурсная платформа</h1>
                <p className="text-sm text-slate-300">Система оценки работ</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-slate-400">Эксперт</p>
                <p className="text-sm font-medium">{expertName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Проверено</p>
                <p className="text-lg font-semibold">{reviewedCount} / {totalCount}</p>
              </div>
              {expertRole === 'admin' && (
                <Button 
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => navigate('/admin')}
                >
                  <Icon name="Shield" size={18} className="mr-2" />
                  Админка
                </Button>
              )}
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={handleLogout}>
                <Icon name="LogOut" size={18} className="mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <Icon name="LayoutDashboard" size={18} />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Icon name="Video" size={18} />
              Видео ({videoSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="essays" className="gap-2">
              <Icon name="FileText" size={18} />
              Эссе ({essaySubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <Icon name="BarChart3" size={18} />
              Результаты
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Всего работ</CardTitle>
                  <Icon name="FileStack" size={20} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {videoSubmissions.length} видео, {essaySubmissions.length} эссе
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Проверено</CardTitle>
                  <Icon name="CheckCircle2" size={20} className="text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{reviewedCount}</div>
                  <Progress value={progress} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(progress)}% завершено
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Ожидают</CardTitle>
                  <Icon name="Clock" size={20} className="text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalCount - reviewedCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    работ в очереди
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Последние работы на проверке</CardTitle>
                <CardDescription>Недавно добавленные конкурсные задания</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissions.slice(0, 3).map(submission => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        handleSelectSubmission(submission);
                        setActiveTab(submission.type === 'video' ? 'videos' : 'essays');
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          submission.type === 'video' 
                            ? 'bg-purple-100 text-purple-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          <Icon name={submission.type === 'video' ? 'Video' : 'FileText'} size={20} />
                        </div>
                        <div>
                          <p className="font-medium">{submission.participant}</p>
                          <p className="text-sm text-muted-foreground">{submission.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={submission.status === 'reviewed' ? 'default' : 'secondary'}>
                          {submission.status === 'reviewed' ? 'Проверено' : 'Ожидает'}
                        </Badge>
                        {submission.rating && (
                          <span className="text-lg font-semibold text-primary">
                            {submission.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6 animate-fade-in">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Видеовизитки</CardTitle>
                  <CardDescription>Выберите работу для просмотра и оценки</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {videoSubmissions.map(submission => (
                    <div
                      key={submission.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedSubmission?.id === submission.id
                          ? 'border-primary bg-accent shadow-md'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => handleSelectSubmission(submission)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{submission.participant}</p>
                          <p className="text-sm text-muted-foreground">{submission.title}</p>
                        </div>
                        <Badge variant={submission.status === 'reviewed' ? 'default' : 'outline'}>
                          {submission.status === 'reviewed' ? 'Проверено' : 'Новое'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {selectedSubmission && selectedSubmission.type === 'video' && (
                <Card className="animate-scale-in">
                  <CardHeader>
                    <CardTitle>{selectedSubmission.participant}</CardTitle>
                    <CardDescription>{selectedSubmission.title}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden">
                      <iframe
                        className="w-full h-full"
                        src={selectedSubmission.videoUrl}
                        title={selectedSubmission.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t">
                      <div className="bg-slate-50 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold">Общая оценка:</span>
                          <span className="text-3xl font-bold text-primary">{totalScore} / {maxTotalScore}</span>
                        </div>
                      </div>

                      {criteria.map((criterion, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">{criterion.name}</label>
                            <span className="text-lg font-semibold text-primary">
                              {criterion.score} / {criterion.maxScore}
                            </span>
                          </div>
                          <Slider
                            value={[criterion.score]}
                            onValueChange={(value) => updateCriteriaScore(index, value[0])}
                            max={criterion.maxScore}
                            step={1}
                            className="mb-1"
                          />
                        </div>
                      ))}

                      <div>
                        <label className="text-sm font-medium mb-2 block">Комментарий</label>
                        <Textarea
                          placeholder="Ваша оценка работы..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <Button onClick={handleSubmitRating} className="w-full" size="lg">
                        <Icon name="Save" size={18} className="mr-2" />
                        Сохранить оценку
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="essays" className="space-y-6 animate-fade-in">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Эссе</CardTitle>
                  <CardDescription>Выберите работу для чтения и оценки</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {essaySubmissions.map(submission => (
                    <div
                      key={submission.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedSubmission?.id === submission.id
                          ? 'border-primary bg-accent shadow-md'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => handleSelectSubmission(submission)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{submission.participant}</p>
                          <p className="text-sm text-muted-foreground">{submission.title}</p>
                        </div>
                        <Badge variant={submission.status === 'reviewed' ? 'default' : 'outline'}>
                          {submission.status === 'reviewed' ? 'Проверено' : 'Новое'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {selectedSubmission && selectedSubmission.type === 'essay' && (
                <Card className="animate-scale-in">
                  <CardHeader>
                    <CardTitle>{selectedSubmission.participant}</CardTitle>
                    <CardDescription>{selectedSubmission.title}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="prose prose-slate max-w-none">
                      <div className="bg-slate-50 p-6 rounded-lg border">
                        {selectedSubmission.content.split('\n\n').map((paragraph, index) => (
                          <p key={index} className="mb-4 last:mb-0 text-slate-700 leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>

                    {selectedSubmission.status === 'reviewed' ? (
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-green-900">Оценка:</span>
                          <span className="text-2xl font-bold text-green-700">
                            {selectedSubmission.rating}
                          </span>
                        </div>
                        <p className="text-sm text-green-800">{selectedSubmission.comment}</p>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-4 border-t">
                        <div className="bg-slate-50 p-4 rounded-lg mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold">Общая оценка:</span>
                            <span className="text-3xl font-bold text-primary">{totalScore} / {maxTotalScore}</span>
                          </div>
                        </div>

                        {criteria.map((criterion, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">{criterion.name}</label>
                              <span className="text-lg font-semibold text-primary">
                                {criterion.score} / {criterion.maxScore}
                              </span>
                            </div>
                            <Slider
                              value={[criterion.score]}
                              onValueChange={(value) => updateCriteriaScore(index, value[0])}
                              max={criterion.maxScore}
                              step={1}
                              className="mb-1"
                            />
                          </div>
                        ))}

                        <div>
                          <label className="text-sm font-medium mb-2 block">Комментарий</label>
                          <Textarea
                            placeholder="Ваша оценка работы..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <Button onClick={handleSubmitRating} className="w-full" size="lg">
                          <Icon name="Save" size={18} className="mr-2" />
                          Сохранить оценку
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Результаты конкурса</CardTitle>
                <CardDescription>Сводная таблица оценок участников</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissions
                    .filter(s => s.status === 'reviewed')
                    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                    .map((submission, index) => (
                      <div
                        key={submission.id}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow"
                      >
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-slate-100 text-slate-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-50 text-slate-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{submission.participant}</p>
                          <p className="text-sm text-muted-foreground">{submission.title}</p>
                        </div>
                        <Badge variant={submission.type === 'video' ? 'secondary' : 'outline'}>
                          {submission.type === 'video' ? 'Видео' : 'Эссе'}
                        </Badge>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{submission.rating}</div>
                          <div className="text-xs text-muted-foreground">баллов</div>
                        </div>
                      </div>
                    ))}
                </div>

                {submissions.filter(s => s.status === 'reviewed').length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Icon name="BarChart3" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Пока нет оцененных работ</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}