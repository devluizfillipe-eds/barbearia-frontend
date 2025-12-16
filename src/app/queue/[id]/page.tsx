'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { QueueItem, QueueStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Clock, XCircle, User, Scissors } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function QueueStatusPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: queueItem, isLoading, error } = useQuery<QueueItem>({
    queryKey: ['queue', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/queue/status/${id}`);
        return res.data;
      } catch (e) {
        console.warn('Failed to fetch queue status, using mock', e);
        // Mock for dev
        return {
          id: Number(id),
          clientName: 'Cliente Teste',
          clientPhone: '11999999999',
          status: QueueStatus.WAITING,
          barberId: 1,
          serviceId: 1,
          peopleAhead: 3,
        };
      }
    },
    refetchInterval: 5000, // Poll every 5 seconds
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !queueItem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center space-y-4">
        <XCircle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Erro ao carregar status</h1>
        <p className="text-muted-foreground">Não foi possível encontrar seu agendamento.</p>
        <Button onClick={() => router.push('/')}>Voltar ao Início</Button>
      </div>
    );
  }

  const getStatusColor = (status: QueueStatus) => {
    switch (status) {
      case QueueStatus.WAITING: return "text-yellow-500";
      case QueueStatus.IN_PROGRESS: return "text-green-500";
      case QueueStatus.DONE: return "text-muted-foreground";
      case QueueStatus.CANCELLED: return "text-destructive";
      default: return "text-foreground";
    }
  };

  const getStatusText = (status: QueueStatus) => {
    switch (status) {
      case QueueStatus.WAITING: return "Aguardando";
      case QueueStatus.IN_PROGRESS: return "Em Atendimento";
      case QueueStatus.DONE: return "Finalizado";
      case QueueStatus.CANCELLED: return "Cancelado";
      default: return status;
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/30 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <Card className="w-full max-w-md border-primary/20 shadow-2xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">Status da Fila</CardTitle>
          <CardDescription>Acompanhe sua posição em tempo real</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-8 pt-6">
          
          {/* Status Icon */}
          <div className="relative">
            <div className={cn("h-32 w-32 rounded-full border-4 flex items-center justify-center", 
              queueItem.status === QueueStatus.WAITING ? "border-yellow-500/50 bg-yellow-500/10" :
              queueItem.status === QueueStatus.IN_PROGRESS ? "border-green-500/50 bg-green-500/10" :
              "border-muted bg-muted/10"
            )}>
              {queueItem.status === QueueStatus.WAITING && <Clock className="h-16 w-16 text-yellow-500 animate-pulse" />}
              {queueItem.status === QueueStatus.IN_PROGRESS && <Scissors className="h-16 w-16 text-green-500 animate-bounce" />}
              {queueItem.status === QueueStatus.DONE && <CheckCircle className="h-16 w-16 text-muted-foreground" />}
              {queueItem.status === QueueStatus.CANCELLED && <XCircle className="h-16 w-16 text-destructive" />}
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center space-y-1">
            <h2 className={cn("text-3xl font-bold", getStatusColor(queueItem.status))}>
              {getStatusText(queueItem.status)}
            </h2>
            {queueItem.status === QueueStatus.WAITING && (
              <p className="text-muted-foreground">
                {queueItem.peopleAhead === 0 
                  ? "Você é o próximo!" 
                  : `${queueItem.peopleAhead} pessoa${queueItem.peopleAhead !== 1 ? 's' : ''} na sua frente`}
              </p>
            )}
          </div>

          {/* Details */}
          <div className="w-full space-y-3 bg-secondary/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> Cliente</span>
              <span className="font-medium">{queueItem.clientName}</span>
            </div>
            {/* We could show Barber name here if we fetched it or if it was in the QueueItem response */}
          </div>

          <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
            Voltar ao Início
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
