'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { QueueItem, QueueStatus, User } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, User as UserIcon, Clock, CheckCircle, XCircle, LogOut, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function BarberDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'results'>('queue');
  const [daysFilter, setDaysFilter] = useState('0'); // 0 = Hoje, 7 = 7 dias, 30 = 30 dias
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch Current User Profile (for real-time status)
  const { data: profile } = useQuery<User>({
    queryKey: ['barberProfile', user?.id],
    queryFn: async () => {
      const res = await api.get(`/users/${user?.id}`);
      return res.data;
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

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
    queryKey: ['barberStats', daysFilter],
    queryFn: async () => {
      try {
        const res = await api.get(`/dashboard/barber?days=${daysFilter}`);
        return res.data;
      } catch (e) {
        console.warn('Failed to fetch stats', e);
        return null;
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
      queryClient.invalidateQueries({ queryKey: ['barberProfile'] });
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

  const isOnline = profile?.isOnline ?? user.isOnline;

  // Recharts Imports (Dynamic to avoid SSR issues if needed, but standard import works in Next 14 client components usually)
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } = require('recharts');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b-2 border-primary p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              <Image 
                src="/logo.jpg" 
                alt="Bozo's Barber Shop" 
                fill
                className="object-contain rounded-full"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Painel do Barbeiro</h1>
              <p className="text-sm text-muted-foreground">Olá, {user.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex flex-col items-center mr-4 relative">
              <Switch 
                checked={!!isOnline}
                onChange={() => toggleOnline.mutate()}
                disabled={toggleOnline.isPending}
              />
              <span className={cn("absolute top-full mt-1 text-[10px] font-medium whitespace-nowrap", isOnline ? "text-green-500" : "text-muted-foreground")}>
                {isOnline ? 'você está online' : 'você está offline'}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="hover:bg-primary/10 hover:text-primary">
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
                        <Clock className="h-3 w-3" /> Serviço ID: {item.serviceId}
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
             <div className="flex justify-between items-center">
               <h2 className="text-lg font-semibold">Desempenho</h2>
               <select 
                 className="bg-card border border-input rounded-md p-2 text-sm"
                 value={daysFilter}
                 onChange={(e) => setDaysFilter(e.target.value)}
               >
                 <option value="0">Hoje</option>
                 <option value="7">Últimos 7 dias</option>
                 <option value="30">Últimos 30 dias</option>
               </select>
             </div>

             {loadingStats ? (
               <Loader2 className="animate-spin mx-auto" />
             ) : (
               <>
                 {/* Summary Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <Card>
                     <CardHeader className="pb-2">
                       <CardTitle className="text-sm font-medium text-muted-foreground">Atendimentos</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="text-2xl font-bold">{stats?.summary?.totalServices || 0}</div>
                     </CardContent>
                   </Card>
                   <Card>
                     <CardHeader className="pb-2">
                       <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="text-2xl font-bold text-primary">R$ {stats?.summary?.totalRevenue?.toFixed(2) || '0.00'}</div>
                     </CardContent>
                   </Card>
                   <Card>
                     <CardHeader className="pb-2">
                       <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="text-2xl font-bold">R$ {stats?.summary?.averageTicket?.toFixed(2) || '0.00'}</div>
                     </CardContent>
                   </Card>
                 </div>

                 {/* Charts */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Daily History Chart */}
                   <Card className="p-4">
                     <h3 className="text-md font-semibold mb-4">Histórico de Receita</h3>
                     <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={stats?.dailyHistory || []}>
                           <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                           <XAxis dataKey="date" fontSize={12} />
                           <YAxis fontSize={12} />
                           <Tooltip 
                             contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                             itemStyle={{ color: 'var(--foreground)' }}
                           />
                           <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Receita (R$)" />
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                   </Card>

                   {/* Service Breakdown Chart */}
                   <Card className="p-4">
                     <h3 className="text-md font-semibold mb-4">Serviços Realizados</h3>
                     <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={stats?.serviceBreakdown || []}
                             cx="50%"
                             cy="50%"
                             innerRadius={60}
                             outerRadius={80}
                             paddingAngle={5}
                             dataKey="count"
                             nameKey="name"
                           >
                             {(stats?.serviceBreakdown || []).map((entry: any, index: number) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                           </Pie>
                           <Tooltip 
                             contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                             itemStyle={{ color: 'var(--foreground)' }}
                           />
                           <Legend />
                         </PieChart>
                       </ResponsiveContainer>
                     </div>
                   </Card>
                 </div>
               </>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
