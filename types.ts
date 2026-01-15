export enum AssessmentStatus {
  NAO_ATINGIU = 'nao_atingiu',
  EM_DESENVOLVIMENTO = 'em_desenvolvimento',
  SUPEROU = 'superou'
}

export interface Skill {
  id: string;
  code: string; // e.g., EF01LP01
  description: string;
  subject: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  grade: string;
  year: number;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  avatarUrl?: string;
}

export interface Assessment {
  id: string;
  studentId: string;
  skillId: string;
  date: string;
  status: AssessmentStatus;
  notes?: string;
}

export type UserRole = 'admin' | 'coordenador' | 'professor';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional because we might not fetch it or show it
  role: UserRole;
}

export type Page = 'dashboard' | 'classes' | 'skills' | 'remediation' | 'student-detail' | 'users';