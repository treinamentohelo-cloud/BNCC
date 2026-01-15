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
  Users
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { Dashboard } from './components/Dashboard';
import { ClassList } from './components/ClassList';
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
        // Not throwing on usersError immediately to allow app to work if table doesn't exist yet, 
        // but for login to work, it is needed.

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
    // Check against loaded users
    const user = users.find(u => u.email === email && u.password === pass);
    
    if (user) {
      setCurrentUser(user);
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

  const handleAddAssessment = async (newAssessment: Assessment) => {
    setAssessments(prev => [...prev, newAssessment]);
    try {
      const { error } = await supabase.from('assessments').insert([newAssessment]);
      if (error) {
        setAssessments(prev => prev.filter(a => a.id !== newAssessment.id));
        alert("Erro ao salvar: " + error.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSkill = async (newSkill: Skill) => {
    setSkills(prev => [...prev, newSkill]);
    try {
      const { error } = await supabase.from('skills').insert([newSkill]);
      if (error) {
        setSkills(prev => prev.filter(s => s.id !== newSkill.id));
        alert("Erro ao salvar: " + error.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // User Management Handlers
  const handleAddUser = async (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    try {
      const { error } = await supabase.from('users').insert([newUser]);
      if (error) {
        setUsers(prev => prev.filter(u => u.id !== newUser.id));
        alert("Erro ao criar usuário: " + error.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    try {
      const { error } = await supabase.from('users').update(updatedUser).eq('id', updatedUser.id);
      if (error) {
         alert("Erro ao atualizar usuário: " + error.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const oldUsers = [...users];
    setUsers(prev => prev.filter(u => u.id !== id));
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        setUsers(oldUsers);
        alert("Erro ao excluir usuário: " + error.message);
      }
    } catch (e) {
      console.error(e);
      setUsers(oldUsers);
    }
  };

  // --- Derived State ---
  
  const remediationCount = assessments.filter(
    (a) => a.status !== AssessmentStatus.SUPEROU
  ).length;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="text-gray-500 font-medium">Carregando dados escolares...</p>
        </div>
      </div>
    );
  }

  // If connected but not authenticated (and no connection error that blocks rendering completely)
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
              <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg">Tentar Novamente</button>
            </div>
          </div>
        );
     }
     return <Login onLogin={handleLogin} />;
  }

  // --- Render ---

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
        if (selectedClassId) {
          return (
            <ClassList 
              classes={classes}
              students={students}
              selectedClassId={selectedClassId}
              onSelectClass={handleSelectClass}
              onSelectStudent={handleSelectStudent}
            />
          );
        }
        return (
          <ClassList 
            classes={classes}
            students={students}
            onSelectClass={handleSelectClass}
            onSelectStudent={handleSelectStudent}
          />
        );
      case 'student-detail':
        if (!selectedStudentId) return <div>Aluno não encontrado</div>;
        return (
          <StudentDetail
            studentId={selectedStudentId}
            students={students}
            skills={skills}
            assessments={assessments}
            onAddAssessment={handleAddAssessment}
            onBack={() => {
                const s = students.find(st => st.id === selectedStudentId);
                if (s) {
                    setSelectedClassId(s.classId);
                    setCurrentPage('classes');
                } else {
                    handleNavigate('classes');
                }
            }}
          />
        );
      case 'skills':
        return <SkillManager skills={skills} onAddSkill={handleAddSkill} />;
      case 'remediation':
        return (
          <RemediationList 
            assessments={assessments} 
            students={students} 
            skills={skills} 
            classes={classes}
            onSelectStudent={handleSelectStudent}
          />
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
        return <Dashboard 
          classes={classes}
          students={students}
          assessments={assessments}
          skills={skills}
          currentUser={currentUser}
          onNavigateToRemediation={() => handleNavigate('remediation')}
        />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-indigo-700 text-white z-20 flex items-center justify-between px-4 h-16 shadow-md">
        <span className="font-bold text-lg">BNCC Tracker</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
           {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-indigo-800 text-white transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-16 md:pt-0
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 hidden md:block border-b border-indigo-700">
            <h1 className="text-2xl font-bold tracking-tight">BNCC Tracker</h1>
            <p className="text-indigo-200 text-xs mt-1">Gestão Pedagógica</p>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Painel Geral" 
              active={currentPage === 'dashboard'} 
              onClick={() => handleNavigate('dashboard')} 
            />
            <NavItem 
              icon={<School size={20} />} 
              label="Turmas" 
              active={currentPage === 'classes' || currentPage === 'student-detail'} 
              onClick={() => handleNavigate('classes')} 
            />
            <NavItem 
              icon={<BookOpen size={20} />} 
              label="Habilidades BNCC" 
              active={currentPage === 'skills'} 
              onClick={() => handleNavigate('skills')} 
            />
            <NavItem 
              icon={<AlertTriangle size={20} />} 
              label="Reforço Escolar" 
              active={currentPage === 'remediation'} 
              onClick={() => handleNavigate('remediation')}
              badge={remediationCount > 0 ? remediationCount : undefined}
            />
            
            {(currentUser?.role === 'admin' || currentUser?.role === 'coordenador') && (
              <>
                <div className="pt-4 pb-2">
                   <p className="px-2 text-xs font-semibold text-indigo-300 uppercase tracking-wider">Administração</p>
                </div>
                <NavItem 
                  icon={<Users size={20} />} 
                  label="Equipe" 
                  active={currentPage === 'users'} 
                  onClick={() => handleNavigate('users')} 
                />
              </>
            )}
          </nav>

          <div className="p-4 border-t border-indigo-700">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                <UserIcon size={16} />
              </div>
              <div>
                <p className="text-sm font-medium">{currentUser?.name || 'Usuário'}</p>
                <p className="text-xs text-indigo-300 capitalize">{currentUser?.role || 'Visitante'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-indigo-200 hover:text-white hover:bg-indigo-700 p-2 rounded transition-colors"
            >
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0 relative w-full">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {renderContent()}
        </div>
      </main>
      
      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg' 
        : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-medium">{label}</span>
    </div>
    {badge ? (
      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
        {badge}
      </span>
    ) : null}
  </button>
);