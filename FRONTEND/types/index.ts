// User types
export interface User {
    id: number;
    name: string;
    email: string;
    role: 'user' | 'admin';
  }
  
  // Service types
  export interface Service {
    id: number;
    name: string;
    description: string;
    price: number;
    duration?: number;
    requirements?: string;
    imageUrl?: string;
    provider?: Provider;
  }
  
  export interface Provider {
    id: number;
    name: string;
    specialty?: string;
  }
  
  // Appointment types
  export interface Appointment {
    id: number;
    userId: number;
    serviceId: number;
    date: string;
    time: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    service: Service;
  }