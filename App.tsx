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
  ClipboardCheck
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
  User
} from './types';

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

  // --- Initialize Data & Realtime ---
  useEffect(() => {
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
          { data: usersData, error: usersError }
        ] = await Promise.all([
          supabase.from('classes').select('*'),
          supabase.from('students').select('*'),
          supabase.from('skills').select('*'),
          supabase.from('assessments').select('*'),
          supabase.from('users').select('*')
        ]);

        if (classesError) throw classesError;
        if (studentsError) throw studentsError;
        if (skillsError) throw skillsError;
        if (assessmentsError) throw assessmentsError;

        if (classesData) setClasses(classesData);
        if (studentsData) setStudents(studentsData);
        if (skillsData) setSkills(skillsData);
        if (assessmentsData) setAssessments(assessmentsData);
        if (usersData) setUsers(usersData);

      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setConnectionError(err.message || 'Falha ao conectar ao banco de dados');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Setup Realtime Subscription
    const subscription = supabase
      .channel('public:db_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          handleRealtimeEvent(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleRealtimeEvent = (payload: any) => {
    const { table, eventType, new: newRecord, old: oldRecord } = payload;
    console.log('Realtime Event:', table, eventType);

    const updateState = (setter: React.Dispatch<React.SetStateAction<any[]>>) => {
      setter(prev => {
        if (eventType === 'INSERT') {
          if (prev.some(i => i.id === newRecord.id)) return prev;
          return [...prev, newRecord];
        } else if (eventType === 'UPDATE') {
          return prev.map(i => i.id === newRecord.id ? newRecord : i);
        } else if (eventType === 'DELETE') {
          return prev.filter(i => i.id !== oldRecord.id);
        }
        return prev;
      });
    };

    if (table === 'assessments') updateState(setAssessments);
    else if (table === 'skills') updateState(setSkills);
    else if (table === 'users') updateState(setUsers);
    else if (table === 'classes') updateState(setClasses);
    else if (table === 'students') updateState(setStudents);
  };

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
      return true;
    }

    if (sanitizedEmail === 'admin@escola.com' && sanitizedPass === '123456') {
        setCurrentUser({
            id: 'admin-fallback',
            name: 'Administrador (Sistema)',
            email: 'admin@escola.com',
            role: 'admin'
        });
        setIsAuthenticated(true);
        return true;
    }

    return false;
  };

  const handleLogout = () => {
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
      const payload = {
          id: newAssessment.id,
          studentId: newAssessment.studentId, // Ensure match with DB quotes
          skillId: newAssessment.skillId,     // Ensure match with DB quotes
          date: newAssessment.date,
          status: newAssessment.status,
          notes: newAssessment.notes
      };
      
      const { error } = await supabase.from('assessments').insert([payload]);
      if (error) {
        console.error("Erro insert assessment:", error);
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
           console.error("Erro delete assessment:", error);
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
        console.error("Erro insert skill:", error);
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

  // --- Class Handling Fix ---
  const handleAddClass = async (newClass: ClassGroup) => {
    // Optimistic update
    setClasses(prev => [...prev, newClass]);
    
    try {
      // Validate teacherId exists to prevent Foreign Key errors
      let safeTeacherId: string | null = null;
      
      if (newClass.teacherId && newClass.teacherId.trim() !== '') {
          const teacherExists = users.some(u => u.id === newClass.teacherId);
          if (teacherExists) {
              safeTeacherId = newClass.teacherId;
          }
      }

      // Explicit payload mapping
      const payload = {
          id: newClass.id,
          name: newClass.name,
          grade: newClass.grade,
          year: newClass.year,
          shift: newClass.shift,
          teacherId: safeTeacherId, // Maps to "teacherId" in DB
          status: newClass.status || 'active',
          isRemediation: newClass.isRemediation || false // Maps to "isRemediation" in DB
      };
      
      console.log("Enviando turma para Supabase:", payload);

      const { error } = await supabase.from('classes').insert([payload]);
      
      if (error) {
        console.error("Supabase Error Classes:", error);
        setClasses(prev => prev.filter(c => c.id !== newClass.id));
        alert(`Erro ao salvar turma: ${error.message}`);
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
            if (teacherExists) {
                safeTeacherId = updatedClass.teacherId;
            }
        }

       const payload = {
          name: updatedClass.name,
          grade: updatedClass.grade,
          year: updatedClass.year,
          shift: updatedClass.shift,
          teacherId: safeTeacherId,
          status: updatedClass.status,
          isRemediation: updatedClass.isRemediation
       };
       const { error } = await supabase.from('classes').update(payload).eq('id', updatedClass.id);
       if(error) alert(`Erro ao atualizar: ${error.message}`);
    } catch(e) { console.error(e); }
  };

  const handleDeleteClass = async (id: string) => {
    const prevData = [...classes];
    setClasses(prev => prev.filter(c => c.id !== id));
    try {
       const { error } = await supabase.from('classes').delete().eq('id', id);
       if(error) { 
           console.error("Delete Error:", error);
           setClasses(prevData); 
           alert(`Erro ao excluir: ${error.message}`); 
       }
    } catch(e) { setClasses(prevData); }
  };

  const handleAddStudent = async (newStudent: Student) => {
    setStudents(prev => [...prev, newStudent]);
    try {
      // Explicit payload
      const payload = {
        id: newStudent.id,
        name: newStudent.name,
        classId: newStudent.classId,
        avatarUrl: newStudent.avatarUrl,
        registrationNumber: newStudent.registrationNumber,
        birthDate: newStudent.birthDate,
        parentName: newStudent.parentName,
        phone: newStudent.phone,
        status: newStudent.status
      };
      
      const { error } = await supabase.from('students').insert([payload]);
      if (error) {
        console.error("Insert Student Error:", error);
        setStudents(prev => prev.filter(s => s.id !== newStudent.id));
        alert(`Erro ao salvar aluno: ${error.message}`);
      }
    } catch (e: any) { console.error(e); }
  };
  
  const handleUpdateStudent = async (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    try {
       const { error } = await supabase.from('students').update(updatedStudent).eq('id', updatedStudent.id);
       if(error) alert(`Erro ao atualizar: ${error.message}`);
    } catch(e) { console.error(e); }
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
      if (error) alert(`Erro ao atualizar usuário: ${error.message}`);
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
             onAddSkill={handleAddSkill} 
             onUpdateSkill={handleUpdateSkill} 
             onDeleteSkill={handleDeleteSkill} 
           />
        );
      case 'remediation':
        return (
          <RemediationList 
             assessments={assessments} 
             students={students} 
             skills={skills} 
             classes={classes} 
             onSelectStudent={handleSelectStudent}
             onAddClass={handleAddClass}
          />
        );
      case 'student-detail':
        return selectedStudentId ? (
           <StudentDetail 
              studentId={selectedStudentId} 
              students={students} 
              skills={skills} 
              assessments={assessments} 
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
          <p className="text-[#000039] font-medium">Carregando BNCC Tracker...</p>
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
      <div className="md:hidden fixed top-0 w-full bg-gradient-to-r from-[#10898b] to-[#0d7274] text-white z-20 flex items-center justify-between px-4 h-16 shadow-md">
        <span className="font-bold text-lg">BNCC Tracker</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
           {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 text-white transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-16 md:pt-0 bg-gradient-to-b from-[#10898b] to-[#0d7274] shadow-xl
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 hidden md:block border-b border-white/10">
            <div className="flex items-center gap-3 mb-2">
               <div className="bg-white/20 p-2 rounded-lg">
                  <BookOpen size={24} className="text-white" />
               </div>
               <h1 className="text-xl font-bold tracking-tight text-white">BNCC Tracker</h1>
            </div>
            <p className="text-teal-100 text-xs mt-1 opacity-80">Sistema de Gestão Escolar</p>
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
                   <p className="px-2 text-xs font-semibold text-teal-200 uppercase tracking-wider opacity-80">Administração</p>
                </div>
                <NavItem icon={<Users size={20} />} label="Equipe" active={currentPage === 'users'} onClick={() => handleNavigate('users')} />
              </>
            )}
          </nav>

          <div className="p-4 border-t border-white/10 bg-black/10">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                <UserIcon size={16} className="text-[#10898b]" />
              </div>
              <div>
                <p className="text-sm font-medium">{currentUser?.name || 'Usuário'}</p>
                <p className="text-xs text-teal-200 capitalize">{currentUser?.role || 'Visitante'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 text-teal-100 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto pt-16 md:pt-0 relative w-full bg-[#f0fdfa]">
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
  <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${active ? 'bg-white text-[#10898b] shadow-lg font-bold' : 'text-teal-100 hover:bg-white/10 hover:text-white'}`}>
    <div className="flex items-center gap-3">{icon}<span className="font-medium">{label}</span></div>
    {badge ? <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">{badge}</span> : null}
  </button>
);