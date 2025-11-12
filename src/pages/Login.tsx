import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

export default function Login() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !code) {
      toast.error('Заполните все поля');
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/38c82045-aea9-48e9-85ed-0cb8905d1e14', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, access_code: code })
      });

      if (response.ok) {
        const data = await response.json();
        
        localStorage.setItem('expertId', data.id.toString());
        localStorage.setItem('expertName', data.name);
        localStorage.setItem('expertCode', data.access_code);
        localStorage.setItem('expertRole', data.role);
        
        toast.success('Вход выполнен!', {
          description: `Добро пожаловать, ${data.name}`
        });
        
        if (data.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        const error = await response.json();
        toast.error('Ошибка входа', {
          description: error.error || 'Неверный код доступа'
        });
      }
    } catch (error) {
      toast.error('Ошибка подключения', {
        description: 'Проверьте интернет-соединение'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md animate-scale-in shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon name="Award" size={32} className="text-primary" />
          </div>
          <CardTitle className="text-2xl">Вход для экспертов</CardTitle>
          <CardDescription>
            Введите ваши данные для доступа к системе оценивания
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя эксперта</Label>
              <Input
                id="name"
                type="text"
                placeholder="Иван Петров"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Код доступа</Label>
              <Input
                id="code"
                type="password"
                placeholder="Введите код"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base" size="lg">
              <Icon name="LogIn" size={20} className="mr-2" />
              Войти в систему
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>Система оценки конкурсных работ</p>
            <p className="mt-1">Для получения доступа обратитесь к администратору</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}