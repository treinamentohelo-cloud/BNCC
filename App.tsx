import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  School, 
  BookOpen, 
  AlertTriangle, 
  LogOut, 
  LayoutDashboard, 
  Menu, 
  X, 
  Loader2, 
  WifiOff, 
  Users, 
  GraduationCap, 
  ClipboardCheck,
  Zap
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { Dashboard } from './components/Dashboard';
import { ClassList } from './components/ClassList';
import { StudentManager } from './components/StudentManager';
import { AssessmentManager } from './components/AssessmentManager';
import { RemediationList } from './components/RemediationList';
import { Login } from './components/Login';
import { SkillManager } from './components/SkillManager';
import { StudentDetail } from './components/StudentDetail';
import { UserManager } from './components/UserManager';
import { 
  ClassGroup, 
  Student, 
  Skill, 
  Assessment, 
  AssessmentStatus, 
  Page, 
  User,
  ClassDailyLog
} from './types';

// --- Helper Functions for Data Mapping (snake_case DB <-> camelCase App) ---

const mapClassFromDB = (c: any): ClassGroup => ({
  id: c.id,
  name: c.name,
  grade: c.grade,
  year: c.year,
  shift: c.shift,
  status: c.status,
  teacherId: c.teacher_id,        // DB uses snake_case
  isRemediation: c.is_remediation, // DB uses snake_case
  focusSkills: c.focus_skills || [] // DB uses snake_case JSONB
});

const mapClassToDB = (c: Partial<ClassGroup>) => ({
  id: c.id,
  name: c.name,
  grade: c.grade,
  year: c.year,
  shift: c.shift,
  status: c.status,
  teacher_id: c.teacherId || null,          // Convert to snake_case
  is_remediation: c.isRemediation ?? false, // Convert to snake_case
  focus_skills: c.focusSkills || []         // Convert to snake_case
});

const mapStudentFromDB = (s: any): Student => ({
  id: s.id,
  name: s.name,
  classId: s.class_id,            // DB uses snake_case
  avatarUrl: s.avatar_url,        // DB uses snake_case
  registrationNumber: s.registration_number, // DB uses snake_case
  birthDate: s.birth_date,        // DB uses snake_case
  parentName: s.parent_name,      // DB uses snake_case
  phone: s.phone,
  status: s.status,
  remediationEntryDate: s.remediation_entry_date, // Novo campo
  remediationExitDate: s.remediation_exit_date    // Novo campo
});

const mapStudentToDB = (s: Partial<Student>) => ({
  id: s.id,
  name: s.name,
  class_id: s.classId || null,               // Convert to snake_case
  avatar_url: s.avatarUrl || null,           // Convert to snake_case
  registration_number: s.registrationNumber || null, // Convert to snake_case
  birth_date: s.birthDate || null,           // Convert to snake_case
  parent_name: s.parentName || null,         // Convert to snake_case
  phone: s.phone || null,
  status: s.status || 'active',
  remediation_entry_date: s.remediationEntryDate || null,
  remediation_exit_date: s.remediationExitDate || null
});

const mapAssessmentFromDB = (a: any): Assessment => ({
  id: a.id,
  studentId: a.student_id,        // DB uses snake_case
  skillId: a.skill_id,            // DB uses snake_case
  date: a.date,
  status: a.status,
  notes: a.notes
});

const mapAssessmentToDB = (a: Assessment) => ({
  id: a.id,
  student_id: a.studentId,        // Convert to snake_case
  skill_id: a.skillId,            // Convert to snake_case
  date: a.date,
  status: a.status,
  notes: a.notes
});

const mapLogFromDB = (l: any): ClassDailyLog => ({
  id: l.id,
  classId: l.class_id,
  date: l.date,
  content: l.content,
  attendance: l.attendance || {}
});

const mapLogToDB = (l: ClassDailyLog) => ({
  id: l.id,
  class_id: l.classId,
  date: l.date,
  content: l.content,
  attendance: l.attendance
});


export default function App() {
  // --- Global State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data State
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ClassDailyLog[]>([]);

  // --- Initialize Data & Realtime ---
  useEffect(() => {
    // 1. Check for persisted session
    const storedUser = localStorage.getItem('school_app_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Erro ao restaurar sessão:", e);
        localStorage.removeItem('school_app_user');
      }
    }

    // 2. Fetch Data
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setConnectionError(null);
        
        // Fetch initial data
        const [
          { data: classesData, error: classesError },
          { data: studentsData, error: studentsError },
          { data: skillsData, error: skillsError },
          { data: assessmentsData, error: assessmentsError },
          { data: usersData, error: usersError },
          { data: logsData, error: logsError }
        ] = await Promise.all([
          supabase.from('classes').select('*'),
          supabase.from('students').select('*'),
          supabase.from('skills').select('*'),
          supabase.from('assessments').select('*'),
          supabase.from('users').select('*'),
          supabase.from('class_daily_logs').select('*')
        ]);

        if (classesError) throw classesError;
        if (studentsError) throw studentsError;
        if (skillsError) throw skillsError;
        if (assessmentsError) throw assessmentsError;

        if (classesData) setClasses(classesData.map(mapClassFromDB));
        if (studentsData) setStudents(studentsData.map(mapStudentFromDB));
        if (skillsData) setSkills(skillsData);
        if (assessmentsData) setAssessments(assessmentsData.map(mapAssessmentFromDB));
        if (usersData) setUsers(usersData);
        if (logsData) setLogs(logsData.map(mapLogFromDB));

      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        // Não bloqueia se o erro for apenas da tabela nova que pode não existir ainda
        if (err.message?.includes('class_daily_logs') || err.message?.includes('users')) {
             console.warn('Tabelas opcionais não encontradas ou erro de conexão parcial.');
        } else {
             setConnectionError(err.message || 'Falha ao conectar ao banco de dados');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Setup Realtime Subscription
    const subscription = supabase
      .channel('public:db_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
         // Optimistic updates are handled locally
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // --- Handlers ---

  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPass = pass.trim();

    const user = users.find(u => {
        const uEmail = (u.email || '').trim().toLowerCase();
        const uPass = (u.password || '').trim();
        return uEmail === sanitizedEmail && uPass === sanitizedPass;
    });
    
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('school_app_user', JSON.stringify(user)); // PERSIST SESSION
      return true;
    }

    if (sanitizedEmail === 'admin@escola.com' && sanitizedPass === '123456') {
        const adminUser = {
            id: 'admin-fallback',
            name: 'Administrador (Sistema)',
            email: 'admin@escola.com',
            role: 'admin' as const
        };
        setCurrentUser(adminUser);
        setIsAuthenticated(true);
        localStorage.setItem('school_app_user', JSON.stringify(adminUser)); // PERSIST SESSION
        return true;
    }

    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('school_app_user'); // CLEAR SESSION
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setSelectedClassId(null);
    setSelectedStudentId(null);
    setIsMobileMenuOpen(false);
  };

  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    setCurrentPage('classes');
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentPage('student-detail');
  };

  // --- CRUD Handlers ---

  const handleAddAssessment = async (newAssessment: Assessment) => {
    setAssessments(prev => [...prev, newAssessment]);
    try {
      const payload = mapAssessmentToDB(newAssessment);
      const { error } = await supabase.from('assessments').insert([payload]);
      if (error) {
        console.error("Erro insert assessment:", JSON.stringify(error));
        setAssessments(prev => prev.filter(a => a.id !== newAssessment.id));
        alert(`Erro ao salvar avaliação: ${error.message}`);
      }
    } catch (e: any) { console.error(e); alert(e.message); }
  };
  
  const handleDeleteAssessment = async (id: string) => {
    const prevData = [...assessments];
    setAssessments(prev => prev.filter(a => a.id !== id));
    try {
       const { error } = await supabase.from('assessments').delete().eq('id', id);
       if(error) { 
           setAssessments(prevData); 
           alert(`Erro ao excluir: ${error.message}`); 
       }
    } catch(e) { setAssessments(prevData); }
  };

  const handleAddSkill = async (newSkill: Skill) => {
    setSkills(prev => [...prev, newSkill]);
    try {
      const { error } = await supabase.from('skills').insert([newSkill]);
      if (error) {
        setSkills(prev => prev.filter(s => s.id !== newSkill.id));
        alert(`Erro ao salvar habilidade: ${error.message}`);
      }
    } catch (e: any) { console.error(e); }
  };
  
  const handleUpdateSkill = async (updatedSkill: Skill) => {
    setSkills(prev => prev.map(s => s.id === updatedSkill.id ? updatedSkill : s));
    try {
       const { error } = await supabase.from('skills').update(updatedSkill).eq('id', updatedSkill.id);
       if(error) alert(`Erro ao atualizar: ${error.message}`);
    } catch(e) { console.error(e); }
  };
  
  const handleDeleteSkill = async (id: string) => {
    const prevData = [...skills];
    setSkills(prev => prev.filter(s => s.id !== id));
    try {
       const { error } = await supabase.from('skills').delete().eq('id', id);
       if(error) { 
           setSkills(prevData); 
           alert(`Erro ao excluir: ${error.message}`); 
       }
    } catch(e) { setSkills(prevData); }
  };

  // --- Class Handling ---
  const handleAddClass = async (newClass: ClassGroup) => {
    setClasses(prev => [...prev, newClass]);
    try {
      let safeTeacherId: string | null = null;
      if (newClass.teacherId && newClass.teacherId.trim() !== '') {
          const teacherExists = users.some(u => u.id === newClass.teacherId);
          if (teacherExists) safeTeacherId = newClass.teacherId;
      }
      
      const payload = mapClassToDB({
          ...newClass,
          teacherId: safeTeacherId || undefined
      });
      
      console.log("Enviando turma para Supabase:", payload);

      const { error } = await supabase.from('classes').insert([payload]);
      if (error) {
        console.error("Supabase Error Classes:", JSON.stringify(error, null, 2));
        setClasses(prev => prev.filter(c => c.id !== newClass.id));
        alert(`Erro ao salvar turma: ${error.message}.`);
      }
    } catch (e: any) { 
        console.error("Exception:", e);
        setClasses(prev => prev.filter(c => c.id !== newClass.id));
        alert(`Erro inesperado: ${e.message}`);
    }
  };

  const handleUpdateClass = async (updatedClass: ClassGroup) => {
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
    try {
       let safeTeacherId: string | null = null;
       if (updatedClass.teacherId && updatedClass.teacherId.trim() !== '') {
            const teacherExists = users.some(u => u.id === updatedClass.teacherId);
            if (teacherExists) safeTeacherId = updatedClass.teacherId;
       }

       const payload = mapClassToDB({ ...updatedClass, teacherId: safeTeacherId || undefined });
       const { error } = await supabase.from('classes').update(payload).eq('id', updatedClass.id);
       if(error) {
           alert(`Erro ao atualizar: ${error.message}`);
       }
    } catch(e) { console.error(e); }
  };

  const handleDeleteClass = async (id: string) => {
    const prevData = [...classes];
    // Optimistic update
    setClasses(prev => prev.filter(c => c.id !== id));

    try {
       // Primeiro, desvincular alunos para evitar erro de Foreign Key
       // (Caso o DB não esteja configurado com ON DELETE SET NULL nos alunos)
       const { error: studentError } = await supabase
          .from('students')
          .update({ class_id: null })
          .eq('class_id', id);
          
       if (studentError) {
           console.error("Erro ao desvincular alunos:", studentError);
           throw studentError;
       }

       // Agora excluir a turma
       const { error } = await supabase.from('classes').delete().eq('id', id);
       
       if(error) { 
           throw error;
       }
    } catch(e: any) { 
        console.error(e);
        setClasses(prevData); 
        alert(`Erro ao excluir a turma: ${e.message || 'Erro desconhecido'}`); 
    }
  };

  // --- Student Handling ---
  const handleAddStudent = async (newStudent: Student) => {
    setStudents(prev => [...prev, newStudent]);
    try {
      const payload = mapStudentToDB(newStudent);
      console.log("Enviando aluno para Supabase:", payload);
      
      const { error } = await supabase.from('students').insert([payload]);
      if (error) {
        console.error("Erro insert student:", JSON.stringify(error));
        setStudents(prev => prev.filter(s => s.id !== newStudent.id));
        alert(`Erro ao salvar aluno: ${error.message}`);
      }
    } catch (e: any) { console.error(e); }
  };
  
  const handleUpdateStudent = async (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    try {
       const payload = mapStudentToDB(updatedStudent);
       const { error } = await supabase.from('students').update(payload).eq('id', updatedStudent.id);
       if(error) {
           alert(`Erro ao atualizar: ${error.message}`);
       }
    } catch(e: any) { console.error(e); alert(e.message); }
  };
  
  const handleDeleteStudent = async (id: string) => {
    const prevData = [...students];
    setStudents(prev => prev.filter(s => s.id !== id));
    try {
       const { error } = await supabase.from('students').delete().eq('id', id);
       if(error) { 
           setStudents(prevData); 
           alert(`Erro ao excluir: ${error.message}`); 
       }
    } catch(e) { setStudents(prevData); }
  };

  // --- Log/Chamada Handling ---
  const handleAddLog = async (newLog: ClassDailyLog) => {
      setLogs(prev => [...prev, newLog]);
      try {
          const payload = mapLogToDB(newLog);
          const { error } = await supabase.from('class_daily_logs').insert([payload]);
          if (error) {
             setLogs(prev => prev.filter(l => l.id !== newLog.id));
             alert(`Erro ao salvar diário: ${error.message}`);
          }
      } catch (e: any) { console.error(e); }
  };

  const handleDeleteLog = async (id: string) => {
      const prevLogs = [...logs];
      setLogs(prev => prev.filter(l => l.id !== id));
      try {
          const { error } = await supabase.from('class_daily_logs').delete().eq('id', id);
          if (error) {
             setLogs(prevLogs);
             alert(`Erro ao excluir diário: ${error.message}`);
          }
      } catch (e) { console.error(e); }
  };

  // --- User Handling ---
  const handleAddUser = async (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    try {
      const { error } = await supabase.from('users').insert([newUser]);
      if (error) {
        setUsers(prev => prev.filter(u => u.id !== newUser.id));
        alert(`Erro ao criar usuário: ${error.message}`);
      }
    } catch (e) { console.error(e); }
  };
  
  const handleUpdateUser = async (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    try {
      const { error } = await supabase.from('users').update(updatedUser).eq('id', updatedUser.id);
      if (error) {
          alert(`Erro ao atualizar usuário: ${error.message}`);
      }
    } catch (e) { console.error(e); }
  };
  
  const handleDeleteUser = async (id: string) => {
    const oldUsers = [...users];
    setUsers(prev => prev.filter(u => u.id !== id));
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) { 
          setUsers(oldUsers); 
          alert(`Erro ao excluir usuário: ${error.message}`); 
      }
    } catch (e) { console.error(e); setUsers(oldUsers); }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            classes={classes} 
            students={students} 
            assessments={assessments} 
            skills={skills} 
            currentUser={currentUser}
            onNavigateToRemediation={() => handleNavigate('remediation')}
          />
        );
      case 'classes':
        return (
          <ClassList 
            classes={classes} 
            students={students} 
            users={users}
            selectedClassId={selectedClassId || undefined} 
            onSelectClass={handleSelectClass} 
            onSelectStudent={handleSelectStudent}
            onAddClass={handleAddClass}
            onUpdateClass={handleUpdateClass}
            onDeleteClass={handleDeleteClass}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        );
      case 'students':
        return (
          <StudentManager 
            students={students} 
            classes={classes} 
            onAddStudent={handleAddStudent} 
            onUpdateStudent={handleUpdateStudent} 
            onDeleteStudent={handleDeleteStudent} 
            onSelectStudent={handleSelectStudent}
          />
        );
      case 'assessments':
        return (
          <AssessmentManager 
            assessments={assessments} 
            students={students} 
            classes={classes} 
            skills={skills} 
            onAddAssessment={handleAddAssessment}
            onDeleteAssessment={handleDeleteAssessment}
          />
        );
      case 'skills':
        return (
           <SkillManager 
             skills={skills} 
             classes={classes}
             onAddSkill={handleAddSkill} 
             onUpdateSkill={handleUpdateSkill} 
             onDeleteSkill={handleDeleteSkill} 
             onUpdateClass={handleUpdateClass}
           />
        );
      case 'remediation':
        return (
          <RemediationList 
             assessments={assessments} 
             students={students} 
             skills={skills} 
             classes={classes} 
             users={users}
             logs={logs}
             onSelectStudent={handleSelectStudent}
             onAddClass={handleAddClass}
             onUpdateStudent={handleUpdateStudent}
             onAddLog={handleAddLog}
             onDeleteLog={handleDeleteLog}
             onDeleteClass={handleDeleteClass}
          />
        );
      case 'student-detail':
        return selectedStudentId ? (
           <StudentDetail 
              studentId={selectedStudentId} 
              students={students} 
              skills={skills} 
              assessments={assessments}
              classes={classes} // Adicionado: Passando classes para o componente
              onAddAssessment={handleAddAssessment} 
              onBack={() => {
                  if (selectedClassId) {
                      setCurrentPage('classes');
                  } else {
                      setCurrentPage('students');
                  }
              }}
           />
        ) : (
            <div className="p-8 text-center text-gray-500">
                Nenhum aluno selecionado.
            </div>
        );
      case 'users':
        return (
            <UserManager 
                users={users}
                currentUser={currentUser}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
            />
        );
      default:
        return <div>Página não encontrada</div>;
    }
  };

  const remediationCount = assessments.filter(
    (a) => a.status !== AssessmentStatus.SUPEROU
  ).length;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#f0fdf4] to-[#e6fffa]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#10898b]" size={48} />
          <p className="text-[#000039] font-medium">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
     if (connectionError) {
        return (
          <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff className="text-red-600" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Erro de Conexão</h2>
              <p className="text-gray-500 mb-6">{connectionError}</p>
              <button onClick={() => window.location.reload()} className="bg-[#10898b] text-white px-6 py-2 rounded-lg hover:bg-[#0d7274] transition-colors">Tentar Novamente</button>
            </div>
          </div>
        );
     }
     return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#f0fdfa] overflow-hidden">
      <div className="md:hidden fixed top-0 w-full bg-[#0f172a] text-white z-20 flex items-center justify-between px-4 h-16 shadow-md border-b border-white/10 print:hidden">
        <span className="font-bold text-lg flex items-center gap-2"><GraduationCap size={20} /> EDUCAÇÃO 5.0</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
           {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 text-white transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-16 md:pt-0 bg-[#0f172a] shadow-xl border-r border-white/5
        print:hidden
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 hidden md:block border-b border-white/10 relative overflow-hidden">
            {/* Abstract Header Decoration */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#10898b] rounded-full blur-[30px] opacity-20"></div>
            
            <div className="flex items-center gap-3 mb-2 relative z-10">
               <div className="bg-gradient-to-br from-[#10898b] to-[#2dd4bf] p-2 rounded-lg shadow-lg">
                  <GraduationCap size={24} className="text-white" />
               </div>
               <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">EDUCAÇÃO <span className="text-[#2dd4bf]">5.0</span></h1>
               </div>
            </div>
            <p className="text-slate-400 text-[10px] mt-2 uppercase tracking-widest font-semibold flex items-center gap-1">
                <Zap size={10} className="text-[#10898b]" /> Gestão Inteligente
            </p>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavItem icon={<LayoutDashboard size={20} />} label="Painel Geral" active={currentPage === 'dashboard'} onClick={() => handleNavigate('dashboard')} />
            <NavItem icon={<School size={20} />} label="Turmas" active={currentPage === 'classes'} onClick={() => handleNavigate('classes')} />
            <NavItem icon={<GraduationCap size={20} />} label="Alunos" active={currentPage === 'students' || currentPage === 'student-detail'} onClick={() => handleNavigate('students')} />
            <NavItem icon={<ClipboardCheck size={20} />} label="Avaliações" active={currentPage === 'assessments'} onClick={() => handleNavigate('assessments')} />
            <NavItem icon={<BookOpen size={20} />} label="Habilidades BNCC" active={currentPage === 'skills'} onClick={() => handleNavigate('skills')} />
            <NavItem icon={<AlertTriangle size={20} />} label="Reforço Escolar" active={currentPage === 'remediation'} onClick={() => handleNavigate('remediation')} badge={remediationCount > 0 ? remediationCount : undefined} />
            
            {(currentUser?.role === 'admin' || currentUser?.role === 'coordenador') && (
              <>
                <div className="pt-4 pb-2">
                   <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Administração</p>
                </div>
                <NavItem icon={<Users size={20} />} label="Equipe" active={currentPage === 'users'} onClick={() => handleNavigate('users')} />
              </>
            )}
          </nav>

          <div className="p-4 border-t border-white/10 bg-slate-900/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10898b] to-[#0f172a] flex items-center justify-center shadow-lg border border-white/10">
                <UserIcon size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{currentUser?.name.split(' ')[0] || 'Usuário'}</p>
                <p className="text-xs text-slate-400 capitalize">{currentUser?.role || 'Visitante'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-lg transition-colors text-sm">
              <LogOut size={16} />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto pt-16 md:pt-0 relative w-full bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {renderContent()}
        </div>
      </main>
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: number }> = ({ icon, label, active, onClick, badge }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-[#10898b] text-white shadow-lg shadow-[#10898b]/20 font-semibold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
    <div className="flex items-center gap-3">
        <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'}`}>{icon}</span>
        <span>{label}</span>
    </div>
    {badge ? <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">{badge}</span> : null}
  </button>
);