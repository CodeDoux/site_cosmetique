// ─── User ─────────────────────────────────────────────────────

export type TypeRole= 'ADMIN'|'CLIENT'|'LIVREUR';
export interface User {
  id: number;
  nomComplet: string;
  email: string;
  tel?: string;
  role: TypeRole;
  dateInscription?: string;
  created_at: string;
}
 
export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}
 
export interface LoginPayload {
  email: string;
  password: string;
}
 
export interface RegisterPayload {
  nomComplet: string;
  email: string;
  password: string;
  password_confirmation: string;
  telephone?: string;
}

export interface Livreur {
  id:       number;
  nomComplet:      string;
  email:    string;
  tel?:     string;
  role:     string;
}