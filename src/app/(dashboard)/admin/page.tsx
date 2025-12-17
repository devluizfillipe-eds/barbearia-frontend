'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Service, User, Role } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, Plus, LogOut, DollarSign, Users, Scissors, Filter, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'users'>('dashboard');
  const queryClient = useQueryClient();
  const router = useRouter();

  // --- Filters State ---
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  // --- Services State ---
  const [newService, setNewService] = useState({ name: '', price: '', avgDuration: '' });
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // --- Users State ---
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: Role.BARBER });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // --- Queries ---
  const { data: services, isLoading: loadingServices } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await api.get('/services');
      return res.data;
    },
    enabled: !!user,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['adminStats', startDate, endDate, selectedServiceId],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (selectedServiceId) params.append('serviceId', selectedServiceId);
        
        const res = await api.get(`/dashboard/admin?${params.toString()}`);
        return res.data;
      } catch (e) {
        console.warn('Failed to fetch admin stats', e);
        return null;
      }
    },
    enabled: activeTab === 'dashboard' && !!user,
  });

  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
    enabled: activeTab === 'users' && !!user,
  });

  // --- Mutations ---
  const createService = useMutation({
    mutationFn: async () => {
      await api.post('/services', {
        name: newService.name,
        price: Number(newService.price),
        avgDuration: Number(newService.avgDuration),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setNewService({ name: '', price: '', avgDuration: '' });
      alert('Serviço criado!');
    },
    onError: (error) => {
      alert('Erro ao criar serviço');
      console.error(error);
    }
  });

  const updateService = useMutation({
    mutationFn: async (service: Service) => {
      await api.patch(`/services/${service.id}`, {
        name: service.name,
        price: Number(service.price),
        avgDuration: Number(service.avgDuration),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setEditingService(null);
      alert('Serviço atualizado!');
    },
    onError: (error) => {
      alert('Erro ao atualizar serviço');
      console.error(error);
    }
  });

  const deleteService = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      alert('Serviço removido!');
    },
    onError: (error) => {
      alert('Erro ao remover serviço. Verifique se existem agendamentos vinculados.');
      console.error(error);
    }
  });

  const createUser = useMutation({
    mutationFn: async () => {
      await api.post('/users', newUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNewUser({ name: '', username: '', password: '', role: Role.BARBER });
      alert('Usuário criado!');
    },
    onError: (error) => {
      alert('Erro ao criar usuário');
      console.error(error);
    }
  });

  const updateUser = useMutation({
    mutationFn: async (user: User) => {
      // Don't send password if empty
      const payload: any = {
        name: user.name,
        username: user.username,
        role: user.role,
      };
      // Only update password if provided (logic needs backend support or separate endpoint, 
      // but standard update usually ignores empty password or handles it. 
      // Assuming backend updates password if sent. For security, usually separate, 
      // but for this MVP we might just send it if we want to change it.
      // However, the User type usually doesn't have the raw password. 
      // We'll assume editing doesn't change password for now unless we add a field.)
      
      await api.patch(`/users/${user.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      alert('Usuário atualizado!');
    },
    onError: (error) => {
      alert('Erro ao atualizar usuário');
      console.error(error);
    }
  });

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      alert('Usuário removido!');
    },
    onError: (error) => {
      alert('Erro ao remover usuário.');
      console.error(error);
    }
  });

  if (!user) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

  // Recharts Imports
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } = require('recharts');
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Gestão Completa</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="flex space-x-4 mb-6 border-b border-border overflow-x-auto">
          {['dashboard', 'services', 'users'].map((tab) => (
            <button
              key={tab}
              className={cn(
                "pb-2 text-sm font-medium transition-colors capitalize whitespace-nowrap",
                activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab === 'dashboard' ? 'Visão Geral' : tab === 'services' ? 'Serviços' : 'Funcionários'}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filtros Avançados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Serviço</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {services?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => { setStartDate(''); setEndDate(''); setSelectedServiceId(''); }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {loadingStats ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">R$ {stats?.summary?.totalRevenue?.toFixed(2) || '0.00'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
                      <Scissors className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.summary?.totalServices || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">R$ {stats?.summary?.averageTicket?.toFixed(2) || '0.00'}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue History */}
                  <Card className="p-4 col-span-1 lg:col-span-2">
                    <h3 className="text-md font-semibold mb-4">Histórico de Receita</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={Array.isArray(stats?.dailyHistory) ? stats.dailyHistory : []}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="date" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                            itemStyle={{ color: 'var(--foreground)' }}
                          />
                          <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} name="Receita (R$)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Service Breakdown */}
                  <Card className="p-4">
                    <h3 className="text-md font-semibold mb-4">Por Serviço</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Array.isArray(stats?.byService) ? stats.byService : []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="name"
                          >
                            {(Array.isArray(stats?.byService) ? stats.byService : []).map((entry: any, index: number) => (
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

                  {/* Barber Performance */}
                  <Card className="p-4">
                    <h3 className="text-md font-semibold mb-4">Por Barbeiro (Receita)</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Array.isArray(stats?.byBarber) ? stats.byBarber : []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis type="number" fontSize={12} />
                          <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                            itemStyle={{ color: 'var(--foreground)' }}
                          />
                          <Bar dataKey="revenue" fill="#8884d8" radius={[0, 4, 4, 0]} name="Receita (R$)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço (R$)</Label>
                    <Input type="number" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Duração (min)</Label>
                    <Input type="number" value={newService.avgDuration} onChange={e => setNewService({...newService, avgDuration: e.target.value})} />
                  </div>
                  <Button onClick={() => createService.mutate()} disabled={createService.isPending}>
                    <Plus className="mr-2 h-4 w-4" /> Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {services?.map(service => (
                <Card key={service.id} className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-bold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">R$ {Number(service.price).toFixed(2)} • {service.avgDuration} min</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setEditingService(service)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este serviço?')) {
                        deleteService.mutate(service.id);
                      }
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Edit Service Dialog */}
            <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Serviço</DialogTitle>
                  <DialogDescription>Faça alterações no serviço aqui.</DialogDescription>
                </DialogHeader>
                {editingService && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Nome</Label>
                      <Input 
                        value={editingService.name} 
                        onChange={(e) => setEditingService({...editingService, name: e.target.value})} 
                        className="col-span-3" 
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Preço</Label>
                      <Input 
                        type="number" 
                        value={editingService.price} 
                        onChange={(e) => setEditingService({...editingService, price: Number(e.target.value)})} 
                        className="col-span-3" 
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Duração</Label>
                      <Input 
                        type="number" 
                        value={editingService.avgDuration} 
                        onChange={(e) => setEditingService({...editingService, avgDuration: Number(e.target.value)})} 
                        className="col-span-3" 
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={() => editingService && updateService.mutate(editingService)} disabled={updateService.isPending}>
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Funcionário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Usuário</Label>
                    <Input value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                    >
                      <option value={Role.BARBER}>Barbeiro</option>
                      <option value={Role.ADMIN}>Admin</option>
                    </select>
                  </div>
                  <Button onClick={() => createUser.mutate()} disabled={createUser.isPending}>
                    <Plus className="mr-2 h-4 w-4" /> Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {users?.map(u => (
                <Card key={u.id} className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-bold">{u.name}</h3>
                    <p className="text-sm text-muted-foreground">@{u.username} • {u.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setEditingUser(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este usuário?')) {
                        deleteUser.mutate(u.id);
                      }
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Edit User Dialog */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Funcionário</DialogTitle>
                  <DialogDescription>Faça alterações no funcionário aqui.</DialogDescription>
                </DialogHeader>
                {editingUser && (
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Nome</Label>
                      <Input 
                        value={editingUser.name} 
                        onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} 
                        className="col-span-3" 
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Usuário</Label>
                      <Input 
                        value={editingUser.username} 
                        onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} 
                        className="col-span-3" 
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Cargo</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm col-span-3"
                        value={editingUser.role}
                        onChange={e => setEditingUser({...editingUser, role: e.target.value as Role})}
                      >
                        <option value={Role.BARBER}>Barbeiro</option>
                        <option value={Role.ADMIN}>Admin</option>
                      </select>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={() => editingUser && updateUser.mutate(editingUser)} disabled={updateUser.isPending}>
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
