'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Service, User, Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, Scissors, User as UserIcon, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<'services' | 'barber' | 'confirm'>('services');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Fetch Services
  const { data: services, isLoading: loadingServices } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await api.get('/services');
      return res.data;
    },
  });

  // Fetch Barbers
  const { data: barbers, isLoading: loadingBarbers } = useQuery<User[]>({
    queryKey: ['barbers'],
    queryFn: async () => {
      const res = await api.get('/users/barbers');
      return res.data;
    },
    enabled: step === 'barber',
  });

  // Mutation to create queue item
  const createQueueItem = useMutation({
    mutationFn: async () => {
      // Note: Backend might expect a single serviceId or multiple. 
      // The prompt says "serviceId: 1" in the body example, implying single service.
      // But the UI description says "lista de serviços". 
      // I will assume for now we send the first selected service or need to adjust backend.
      // For MVP based on prompt "serviceId: 1", I will send the first one.
      // TODO: Handle multiple services if backend supports it.
      if (selectedServices.length === 0 || !selectedBarber) return;
      
      const res = await api.post('/queue', {
        clientName,
        clientPhone,
        barberId: selectedBarber,
        serviceId: selectedServices[0], // Taking the first one for now
      });
      return res.data;
    },
    onSuccess: (data) => {
      router.push(`/queue/${data.id}`);
    },
    onError: (error) => {
      alert('Erro ao entrar na fila. Tente novamente.');
      console.error(error);
    }
  });

  const toggleService = (id: number) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const totalDuration = services
    ?.filter(s => selectedServices.includes(s.id))
    .reduce((acc, curr) => acc + curr.avgDuration, 0) || 0;

  const totalPrice = services
    ?.filter(s => selectedServices.includes(s.id))
    .reduce((acc, curr) => acc + Number(curr.price), 0) || 0;

  return (
    <main className="min-h-screen pb-48 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b-2 border-primary p-4">
        <div className="container mx-auto flex flex-col items-center justify-center gap-4">
          <div className="relative w-32 h-32">
            <Image 
              src="/logo.jpg" 
              alt="Bozo's Barber Shop" 
              fill
              className="object-contain rounded-full"
              priority
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 space-y-6">
        <div className="text-center space-y-2 py-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Em que podemos te ajudar?</h2>
          <p className="text-muted-foreground">escolha um serviço e entre na fila</p>
        </div>

        {/* Step 1: Services */}
        {step === 'services' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingServices ? (
                <p className="text-center col-span-full text-muted-foreground">Carregando serviços...</p>
              ) : (
                services?.map((service) => (
                  <Card 
                    key={service.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/20 border-2 rounded-2xl",
                      selectedServices.includes(service.id) 
                        ? "border-primary bg-primary/10 shadow-md shadow-primary/30" 
                        : "border-primary/40 bg-card"
                    )}
                    onClick={() => toggleService(service.id)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium text-foreground">{service.name}</CardTitle>
                      {selectedServices.includes(service.id) && <Check className="h-6 w-6 text-primary" />}
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {service.avgDuration} min</span>
                        <span className="font-bold text-primary text-base">R$ {Number(service.price).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 pb-24 bg-background border-t-2 border-primary md:static md:bg-transparent md:border-0 md:pb-0">
              <div className="container mx-auto flex items-center justify-between mb-4 md:mb-0">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">R$ {totalPrice.toFixed(2)} <span className="text-xs text-muted-foreground font-normal">/ {totalDuration} min</span></span>
                </div>
                <Button 
                  size="lg" 
                  disabled={selectedServices.length === 0}
                  onClick={() => setStep('barber')}
                  className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full"
                >
                  confirmar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Barbers */}
        {step === 'barber' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <Button variant="ghost" onClick={() => setStep('services')} className="mb-4">← Voltar</Button>
            <h3 className="text-xl font-semibold">Escolha um profissional</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {loadingBarbers ? (
                <p className="text-center col-span-full text-muted-foreground">Carregando barbeiros...</p>
              ) : barbers?.length === 0 ? (
                <p className="text-center col-span-full text-muted-foreground">Não existem barbeiros disponíveis no momento.</p>
              ) : (
                barbers?.map((barber) => (
                  <Card 
                    key={barber.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/20 border-2 rounded-2xl flex flex-col items-center text-center p-6",
                      selectedBarber === barber.id 
                        ? "border-primary bg-primary/10 shadow-md shadow-primary/30" 
                        : "border-primary/40 bg-card"
                    )}
                    onClick={() => setSelectedBarber(barber.id)}
                  >
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4 border-2 border-primary/50">
                      <UserIcon className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-lg text-foreground">{barber.name}</CardTitle>
                    <CardDescription className={cn("text-sm font-medium", barber.isOnline ? "text-green-500" : "text-muted-foreground")}>
                      {barber.isOnline ? "Online" : "Offline"}
                    </CardDescription>
                  </Card>
                ))
              )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 pb-24 bg-background border-t-2 border-primary md:static md:bg-transparent md:border-0 md:pb-0 flex justify-end">
               <div className="container mx-auto flex justify-end">
                <Button 
                  size="lg" 
                  disabled={!selectedBarber}
                  onClick={() => setStep('confirm')}
                  className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full"
                >
                  Confirmar Barbeiro
                </Button>
               </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm & User Info */}
        {step === 'confirm' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-md mx-auto">
            <Button variant="ghost" onClick={() => setStep('barber')} className="mb-4">← Voltar</Button>
            <h3 className="text-xl font-semibold">Seus dados</h3>
            
            <Card className="border-2 border-primary/40 rounded-2xl">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nome Completo</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-lg bg-secondary border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all text-foreground"
                    placeholder="Seu nome"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Telefone</label>
                  <input 
                    type="tel" 
                    className="w-full p-3 rounded-lg bg-secondary border-2 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all text-foreground"
                    placeholder="(11) 99999-9999"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              size="lg" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full"
              disabled={!clientName || !clientPhone || createQueueItem.isPending}
              onClick={() => createQueueItem.mutate()}
            >
              {createQueueItem.isPending ? 'Entrando na fila...' : 'Entrar na Fila'}
            </Button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center bg-card border-2 border-primary rounded-full p-1 shadow-lg shadow-primary/20">
          <Button variant="ghost" size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
            sou cliente
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full text-foreground hover:text-primary hover:bg-primary/10 font-medium" onClick={() => router.push('/login')}>
            sou barbeiro
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full text-foreground hover:text-primary hover:bg-primary/10 font-medium" onClick={() => router.push('/login')}>
            sou admin
          </Button>
        </div>
      </div>
    </main>
  );
}
