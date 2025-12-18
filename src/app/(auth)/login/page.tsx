'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { username, password });
      const { access_token, user } = res.data;
      login(access_token, user);
    } catch (err) {
      console.error(err);
      setError('Credenciais inválidas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8">
        <div className="relative w-40 h-40">
          <Image 
            src="/logo.jpg" 
            alt="Bozo's Barber Shop" 
            fill
            className="object-contain rounded-full"
            priority
          />
        </div>
      </div>
      <Card className="w-full max-w-sm border-2 border-primary/40 shadow-2xl shadow-primary/10 rounded-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-foreground">Acesso Restrito</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais de barbeiro ou administrador
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center border border-destructive/20">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">Usuário</Label>
              <Input 
                id="username" 
                placeholder="" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-2 border-primary/30 focus:border-primary bg-secondary text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-2 border-primary/30 focus:border-primary bg-secondary text-foreground"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
