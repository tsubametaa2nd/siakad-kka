import type { Component } from 'svelte';
import { Home, School, FileText, Zap, BookOpen, BarChart3, Users, Settings } from 'lucide-svelte';

export interface MenuItem {
  title: string;
  href: string;
  icon: Component<any> | any;
}

export const teacherMenus: MenuItem[] = [
  { title: 'Beranda', href: '/guru', icon: Home },
  { title: 'Kelas', href: '/guru/kelas', icon: School },
  { title: 'Tugas', href: '/guru/tugas', icon: FileText },
  { title: 'Quiz', href: '/guru/quiz', icon: Zap },
  { title: 'Materi', href: '/guru/materi', icon: BookOpen },
  { title: 'Penilaian', href: '/guru/nilai', icon: BarChart3 },
  { title: 'Pengaturan', href: '/guru/pengaturan', icon: Settings },
];

export const studentMenus: MenuItem[] = [
  { title: 'Beranda', href: '/siswa', icon: Home },
  { title: 'Kelas Saya', href: '/siswa/kelas', icon: School },
  { title: 'Tugas', href: '/siswa/tugas', icon: FileText },
  { title: 'Quiz', href: '/siswa/quiz', icon: Zap },
  { title: 'Materi', href: '/siswa/materi', icon: BookOpen },
  { title: 'Kelompok', href: '/siswa/kelompok', icon: Users },
  { title: 'Nilai', href: '/siswa/nilai', icon: BarChart3 },
  { title: 'Pengaturan', href: '/siswa/pengaturan', icon: Settings },
];

export const getMenusForRole = (role: 'teacher' | 'student' | undefined): MenuItem[] => {
  if (role === 'teacher') return teacherMenus;
  if (role === 'student') return studentMenus;
  return [];
};
