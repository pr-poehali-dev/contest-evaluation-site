import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Expert {
  id: number;
  name: string;
  access_code: string;
  role: string;
  created_at: string;
}

interface Submission {
  id: number;
  participant: string;
  team: string;
  category: string;
  type: string;
  title: string;
  content: string;
  videoUrl: string;
  status: string;
  createdAt: string;
  avgScore: number;
}

const API_URLS = {
  experts: 'https://functions.poehali.dev/dde380bc-c0f0-4f29-a1cc-652025fc17c6',
  submissions: 'https://functions.poehali.dev/9ae0fab6-fcf6-4c8b-a319-098cbb2199ce'
};

export default function Admin() {
  const navigate = useNavigate();
  const adminCode = localStorage.getItem('expertCode');
  const adminRole = localStorage.getItem('expertRole');

  const [experts, setExperts] = useState<Expert[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  const [newExpertName, setNewExpertName] = useState('');
  const [submissionForm, setSubmissionForm] = useState({
    participant_name: '',
    team_name: '',
    category: '',
    submission_type: 'video',
    title: '',
    content: '',
    video_url: ''
  });

  useEffect(() => {
    if (adminRole !== 'admin') {
      navigate('/');
      return;
    }
    loadExperts();
    loadSubmissions();
  }, [adminRole, navigate]);

  const loadExperts = async () => {
    try {
      const response = await fetch(API_URLS.experts, {
        headers: { 'X-Admin-Code': adminCode || '' }
      });
      if (response.ok) {
        const data = await response.json();
        setExperts(data);
      }
    } catch (error) {
      console.error('Failed to load experts:', error);
    }
  };

  const loadSubmissions = async () => {
    try {
      const response = await fetch(API_URLS.submissions);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  const handleCreateExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpertName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(API_URLS.experts, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Code': adminCode || ''
        },
        body: JSON.stringify({ name: newExpertName })
      });

      if (response.ok) {
        const newExpert = await response.json();
        setExperts([newExpert, ...experts]);
        setNewExpertName('');
        toast.success('Эксперт создан!', {
          description: `Код доступа: ${newExpert.access_code}`
        });
      } else {
        toast.error('Ошибка создания эксперта');
      }
    } catch (error) {
      toast.error('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const response = await fetch(API_URLS.submissions, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Code': adminCode || ''
        },
        body: JSON.stringify(submissionForm)
      });

      if (response.ok) {
        const newSubmission = await response.json();
        setSubmissions([newSubmission, ...submissions]);
        setSubmissionForm({
          participant_name: '',
          team_name: '',
          category: '',
          submission_type: 'video',
          title: '',
          content: '',
          video_url: ''
        });
        toast.success('Задание добавлено!');
      } else {
        toast.error('Ошибка добавления задания');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-[hsl(225,30%,12%)] text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="Shield" size={32} className="text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Административная панель</h1>
                <p className="text-sm text-slate-300">Управление системой</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Button 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => navigate('/')}
              >
                <Icon name="LayoutDashboard" size={18} className="mr-2" />
                К оценке работ
              </Button>
              <Button 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10" 
                onClick={handleLogout}
              >
                <Icon name="LogOut" size={18} className="mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="experts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="experts" className="gap-2">
              <Icon name="Users" size={18} />
              Эксперты ({experts.length})
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-2">
              <Icon name="FileStack" size={18} />
              Задания ({submissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="experts" className="space-y-6 animate-fade-in">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Создать эксперта</CardTitle>
                  <CardDescription>Добавьте нового эксперта в систему</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateExpert} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="expertName">Имя эксперта</Label>
                      <Input
                        id="expertName"
                        value={newExpertName}
                        onChange={(e) => setNewExpertName(e.target.value)}
                        placeholder="Иван Петров"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      <Icon name="UserPlus" size={18} className="mr-2" />
                      Создать эксперта
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Список экспертов</CardTitle>
                  <CardDescription>Все зарегистрированные эксперты</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {experts.map(expert => (
                      <div
                        key={expert.id}
                        className="p-4 rounded-lg border bg-white"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{expert.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {expert.id}
                            </p>
                          </div>
                          <Badge variant={expert.role === 'admin' ? 'default' : 'secondary'}>
                            {expert.role === 'admin' ? 'Администратор' : 'Эксперт'}
                          </Badge>
                        </div>
                        <div className="bg-slate-50 p-2 rounded text-sm font-mono">
                          Код: <span className="font-bold text-primary">{expert.access_code}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6 animate-fade-in">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Добавить задание</CardTitle>
                  <CardDescription>Создайте новое конкурсное задание</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateSubmission} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="participantName">Участник</Label>
                      <Input
                        id="participantName"
                        value={submissionForm.participant_name}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, participant_name: e.target.value })}
                        placeholder="ФИО участника"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teamName">Команда</Label>
                      <Input
                        id="teamName"
                        value={submissionForm.team_name}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, team_name: e.target.value })}
                        placeholder="Название команды"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Категория участия</Label>
                      <Input
                        id="category"
                        value={submissionForm.category}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, category: e.target.value })}
                        placeholder="Например: Студенты"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Тип задания</Label>
                      <Select
                        value={submissionForm.submission_type}
                        onValueChange={(value) => setSubmissionForm({ ...submissionForm, submission_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Видеовизитка</SelectItem>
                          <SelectItem value="essay">Эссе</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Название работы</Label>
                      <Input
                        id="title"
                        value={submissionForm.title}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, title: e.target.value })}
                        placeholder="Заголовок"
                        required
                      />
                    </div>

                    {submissionForm.submission_type === 'video' && (
                      <div className="space-y-2">
                        <Label htmlFor="videoUrl">Ссылка на видео</Label>
                        <Input
                          id="videoUrl"
                          value={submissionForm.video_url}
                          onChange={(e) => setSubmissionForm({ ...submissionForm, video_url: e.target.value })}
                          placeholder="https://youtube.com/..."
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="content">
                        {submissionForm.submission_type === 'video' ? 'Описание' : 'Текст эссе'}
                      </Label>
                      <Textarea
                        id="content"
                        value={submissionForm.content}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, content: e.target.value })}
                        placeholder={submissionForm.submission_type === 'video' ? 'Краткое описание' : 'Полный текст эссе'}
                        rows={6}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      <Icon name="Plus" size={18} className="mr-2" />
                      Добавить задание
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Список заданий</CardTitle>
                  <CardDescription>Все конкурсные работы</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {submissions.map(submission => (
                      <div
                        key={submission.id}
                        className="p-4 rounded-lg border bg-white"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{submission.participant}</p>
                            <p className="text-sm text-muted-foreground">{submission.title}</p>
                            {submission.team && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Команда: {submission.team}
                              </p>
                            )}
                            {submission.category && (
                              <p className="text-xs text-muted-foreground">
                                Категория: {submission.category}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={submission.type === 'video' ? 'secondary' : 'outline'}>
                              {submission.type === 'video' ? 'Видео' : 'Эссе'}
                            </Badge>
                            {submission.avgScore > 0 && (
                              <span className="text-sm font-semibold text-primary">
                                {submission.avgScore.toFixed(1)} баллов
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
