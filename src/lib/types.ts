export enum Role {
  ADMIN = 'ADMIN',
  BARBER = 'BARBER',
}

export enum QueueStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export interface Service {
  id: number;
  name: string;
  price: number;
  avgDuration: number;
  isActive: boolean;
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: Role;
  isOnline: boolean;
}

export interface QueueItem {
  id: number;
  clientName: string;
  clientPhone: string;
  status: QueueStatus;
  barberId: number;
  serviceId: number;
  peopleAhead?: number;
  Service?: Service; // Opcional, dependendo da resposta do backend
  Barber?: User;     // Opcional
}
