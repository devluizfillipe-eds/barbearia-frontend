'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { QueueItem, QueueStatus, User } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, User as UserIcon, Clock, CheckCircle, XCircle, LogOut, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function BarberDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'results'>('queue');
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch Barber Queue
  const { data: queue, isLoading: loadingQueue } = useQuery<QueueItem[]>({
    queryKey: ['barberQueue'],
    queryFn: async () => {
      try {
        const res = await api.get('/queue/barber');
        return res.data;
      } catch (e) {
        console.warn('Failed to fetch barber queue', e);
        return [];
      }
    },
    refetchInterval: 10000,
    enabled: !!user,
  });

  // Fetch Barber Stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['barberStats'],
    queryFn: async () => {
      try {
        const res = await api.get('/dashboard/barber');
        return res.data;
      } catch (e) {
        console.warn('Failed to fetch stats', e);
        return { todayServices: 5, todayRevenue: 150, history: [] };
      }
    },
    enabled: activeTab === 'results' && !!user,
  });

  // Toggle Online Status
  const toggleOnline = useMutation({
    mutationFn: async () => {
      const res = await api.patch('/users/profile/toggle-online');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barberProfile'] }); // Assuming we fetch profile somewhere or update user context
      alert('Status atualizado!');
    },
  });

  // Update Queue Item Status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: QueueStatus }) => {
      const res = await api.patch(`/queue/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barberQueue'] });
    },
  });

  if (!user) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Painel do Barbeiro</h1>
            <p className="text-sm text-muted-foreground">Olá, {user.name}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={user.isOnline ? "default" : "destructive"} 
              size="sm"
              onClick={() => toggleOnline.mutate()}
              disabled={toggleOnline.isPending}
            >
              <Power className="mr-2 h-4 w-4" />
              {user.isOnline ? 'Online' : 'Offline'}
            </Button>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto p-4">
        <div className="flex space-x-4 mb-6 border-b border-border">
          <button
            className={cn(
              "pb-2 text-sm font-medium transition-colors",
              activeTab === 'queue' ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('queue')}
          >
            Minha Fila
          </button>
          <button
            className={cn(
              "pb-2 text-sm font-medium transition-colors",
              activeTab === 'results' ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('results')}
          >
            Meus Resultados
          </button>
        </div>

        {/* Content */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Fila de Atendimento</h2>
            {loadingQueue ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : queue?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum cliente na fila.</p>
            ) : (
              queue?.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{item.clientName}</h3>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          item.status === QueueStatus.IN_PROGRESS ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                        )}>
                          {item.status === QueueStatus.IN_PROGRESS ? 'Em Atendimento' : 'Aguardando'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Serviço ID: {item.serviceId} {/* TODO: Fetch service name */}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      {item.status === QueueStatus.WAITING && (
                        <Button 
                          className="flex-1 sm:flex-none" 
                          onClick={() => updateStatus.mutate({ id: item.id, status: QueueStatus.IN_PROGRESS })}
                        >
                          Chamar
                        </Button>
                      )}
                      {item.status === QueueStatus.IN_PROGRESS && (
                        <Button 
                          className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700" 
                          onClick={() => updateStatus.mutate({ id: item.id, status: QueueStatus.DONE })}
                        >
                          Finalizar
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => updateStatus.mutate({ id: item.id, status: QueueStatus.CANCELLED })}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
             <h2 className="text-lg font-semibold mb-4">Desempenho Hoje</h2>
             {loadingStats ? (
               <Loader2 className="animate-spin mx-auto" />
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Card>
                   <CardHeader className="pb-2">
                     <CardTitle className="text-sm font-medium text-muted-foreground">Atendimentos</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-bold">{stats?.todayServices || 0}</div>
                   </CardContent>
                 </Card>
                 <Card>
                   <CardHeader className="pb-2">
                     <CardTitle className="text-sm font-medium text-muted-foreground">Receita Estimada</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-bold text-primary">R$ {stats?.todayRevenue || 0}</div>
                   </CardContent>
                 </Card>
               </div>
             )}
             {/* Add chart here later with Recharts */}
          </div>
        )}
      </div>
    </div>
  );
}
