import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  School, 
  BookOpen, 
  AlertTriangle, 
  LogOut, 
  LayoutDashboard, 
  Loader2, 
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
  User,
  ClassDailyLog
} from './types';

// --- Mapeadores de Banco de Dados ---

const mapClassFromDB = (c: any): ClassGroup => ({
  id: c.id,
  name: c.name,
  grade: c.grade,
  year: c.year,
  shift: c.shift,
  status: c.status,
  teacherId: c.teacher_id,
  isRemediation: c.is_remediation,
  focusSkills: c.focus_skills || []
});

const mapStudentFromDB = (s: any): Student => ({
  id: s.id,
  name: s.name,
  classId: s.class_id,
  avatarUrl: s.avatar_url,
  registrationNumber: s.registration_number,
  birthDate: s.birth_date,
  parentName: s.parent_name,
  phone: s.phone,
  status: s.status,
  remediationEntryDate: s.remediation_entry_date,
  remediationExitDate: s.remediation_exit_date
});

const mapAssessmentFromDB = (a: any): Assessment => ({
  id: a.id,
  studentId: a.student_id,
  skillId: a.skill_id,
  date: a.date,
  status: a.status as AssessmentStatus,
  score: a.score !== null ? Number(a.score) : undefined,
  notes: a.notes
});

const mapLogFromDB = (l: any): ClassDailyLog => ({
  id: l.id,
  classId: l.class_id,
  date: l.date,
  content: l.content,
  attendance: l.attendance
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('school_app_user'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('school_app_user');
    try { return stored ? JSON.parse(stored) : null; } catch { return null; }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Garante que a página inicial seja SEMPRE o dashboard
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ClassDailyLog[]>([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [
        { data: cl }, { data: st }, { data: sk }, { data: ass }, { data: us }, { data: lg }
      ] = await Promise.all([
        supabase.from('classes').select('*'),
        supabase.from('students').select('*'),
        supabase.from('skills').select('*'),
        supabase.from('assessments').select('*'),
        supabase.from('users').select('*'),
        supabase.from('class_daily_logs').select('*')
      ]);

      if (cl) setClasses(cl.map(mapClassFromDB));
      if (st) setStudents(st.map(mapStudentFromDB));
      if (sk) setSkills(sk);
      if (ass) setAssessments(ass.map(mapAssessmentFromDB));
      if (us) setUsers(us); // Users mapeados diretamente, status incluído
      if (lg) setLogs(lg.map(mapLogFromDB));

    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
        fetchData();
        // Reforça o redirecionamento para o dashboard ao carregar a aplicação autenticada
        setCurrentPage('dashboard');
    }
  }, [isAuthenticated]);

  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    let { data: dbUser } = await supabase.from('users').select('*').ilike('email', email).eq('password', pass).single();
    
    if (dbUser) {
        if (dbUser.status === 'inactive') {
            alert('Acesso negado: Usuário inativo. Contate o administrador.');
            return false;
        }

        setCurrentUser(dbUser);
        setIsAuthenticated(true);
        localStorage.setItem('school_app_user', JSON.stringify(dbUser));
        setCurrentPage('dashboard'); // Redireciona explicitamente para o Dashboard
        return true;
    }

    if (email === 'admin@escola.com' && pass === '123456') {
      const activeUser = { id: 'admin-fallback', name: 'Admin Master', email: 'admin@escola.com', role: 'admin' as const, status: 'active' as const };
      setCurrentUser(activeUser);
      setIsAuthenticated(true);
      localStorage.setItem('school_app_user', JSON.stringify(activeUser));
      setCurrentPage('dashboard'); // Redireciona explicitamente para o Dashboard
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('school_app_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage('dashboard'); // Reseta para o Dashboard ao sair
  };

  // --- CRUD OPERATIONS ---

  // 1. AVALIAÇÕES
  const handleAddAssessment = async (a: Assessment) => {
    try {
      const { error } = await supabase.from('assessments').insert([{
        id: a.id,
        student_id: a.studentId,
        skill_id: a.skillId,
        date: a.date,
        status: a.status,
        score: a.score,
        notes: a.notes
      }]);
      if (error) throw error;
      await fetchData(); // Refresh
    } catch (e: any) { alert('Erro ao salvar avaliação: ' + e.message); }
  };

  const handleDeleteAssessment = async (id: string) => {
      try {
          const { error } = await supabase.from('assessments').delete().eq('id', id);
          if (error) throw error;
          await fetchData();
      } catch(e: any) { alert('Erro ao excluir: ' + e.message); }
  }

  // 2. TURMAS
  const handleAddClass = async (c: ClassGroup) => {
    try {
      const { error } = await supabase.from('classes').insert([{
        id: c.id,
        name: c.name,
        grade: c.grade,
        year: c.year,
        shift: c.shift,
        status: c.status,
        teacher_id: c.teacherId,
        is_remediation: c.isRemediation,
        focus_skills: c.focusSkills
      }]);
      if (error) throw error;
      await fetchData();
    } catch (e: any) { alert('Erro ao salvar turma: ' + e.message); }
  };

  const handleUpdateClass = async (c: ClassGroup) => {
      try {
          const { error } = await supabase.from('classes').update({
              name: c.name,
              grade: c.grade,
              year: c.year,
              shift: c.shift,
              status: c.status,
              teacher_id: c.teacherId,
              is_remediation: c.isRemediation,
              focus_skills: c.focusSkills
          }).eq('id', c.id);
          if (error) throw error;
          await fetchData();
      } catch (e: any) { alert('Erro ao atualizar turma: ' + e.message); }
  };

  const handleDeleteClass = async (id: string) => {
      try {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', id);

          if (count && count > 0) {
              const confirmSoft = window.confirm('⚠️ Esta turma possui alunos matriculados.\n\nPara manter o histórico, ela será marcada como INATIVA em vez de excluída.\n\nDeseja continuar?');
              if (confirmSoft) {
                  const { error } = await supabase.from('classes').update({ status: 'inactive' }).eq('id', id);
                  if (error) throw error;
                  alert('Turma inativada com sucesso.');
                  await fetchData();
              }
          } else {
              const { error } = await supabase.from('classes').delete().eq('id', id);
              if(error) throw error;
              await fetchData();
          }
      } catch(e: any) { alert('Erro ao processar turma: ' + e.message); }
  };

  // 3. ALUNOS
  const handleAddStudent = async (s: Student) => {
      try {
          const { error } = await supabase.from('students').insert([{
              id: s.id,
              name: s.name,
              class_id: s.classId,
              avatar_url: s.avatarUrl,
              registration_number: s.registrationNumber,
              birth_date: s.birthDate,
              parent_name: s.parentName,
              phone: s.phone,
              status: s.status
          }]);
          if(error) throw error;
          await fetchData();
      } catch(e: any) { alert('Erro ao cadastrar aluno: ' + e.message); }
  };

  const handleUpdateStudent = async (s: Student) => {
    try {
      const { error } = await supabase.from('students').update({
        name: s.name,
        class_id: s.classId,
        avatar_url: s.avatarUrl,
        registration_number: s.registrationNumber,
        birth_date: s.birthDate,
        parent_name: s.parentName,
        phone: s.phone,
        status: s.status,
        remediation_entry_date: s.remediationEntryDate,
        remediation_exit_date: s.remediationExitDate
      }).eq('id', s.id);
      if (error) throw error;
      await fetchData();
    } catch (e: any) { alert('Erro ao atualizar aluno: ' + e.message); }
  };

  const handleDeleteStudent = async (id: string) => {
      try {
          const { count } = await supabase
            .from('assessments')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', id);

          if (count && count > 0) {
              const confirmSoft = window.confirm('⚠️ Este aluno possui histórico de avaliações.\n\nPara não perder os dados, o cadastro será marcado como INATIVO.\n\nDeseja continuar?');
              if (confirmSoft) {
                  const { error } = await supabase.from('students').update({ status: 'inactive' }).eq('id', id);
                  if (error) throw error;
                  alert('Aluno inativado com sucesso.');
                  await fetchData();
              }
          } else {
              const { error } = await supabase.from('students').delete().eq('id', id);
              if(error) throw error;
              await fetchData();
          }
      } catch(e: any) { alert('Erro ao processar aluno: ' + e.message); }
  };

  // 4. HABILIDADES
  const handleAddSkill = async (s: Skill) => {
      try {
          const { error } = await supabase.from('skills').insert([{
              id: s.id,
              code: s.code,
              description: s.description,
              subject: s.subject
          }]);
          if(error) throw error;
          await fetchData();
      } catch(e:any) { alert('Erro ao salvar habilidade: ' + e.message); }
  };

  const handleUpdateSkill = async (s: Skill) => {
      try {
          const { error } = await supabase.from('skills').update({
              code: s.code,
              description: s.description,
              subject: s.subject
          }).eq('id', s.id);
          if(error) throw error;
          await fetchData();
      } catch(e:any) { alert('Erro ao atualizar habilidade: ' + e.message); }
  };

  const handleDeleteSkill = async (id: string) => {
      try {
          const { error } = await supabase.from('skills').delete().eq('id', id);
          if(error) throw error;
          await fetchData();
      } catch(e:any) { alert('Erro ao excluir habilidade: ' + e.message); }
  };

  // 5. USUÁRIOS
  const handleAddUser = async (u: User) => {
      try {
          const { error } = await supabase.from('users').insert([{
              id: u.id,
              name: u.name,
              email: u.email,
              password: u.password,
              role: u.role,
              status: u.status || 'active'
          }]);
          if(error) throw error;
          await fetchData();
      } catch(e:any) { alert('Erro ao criar usuário: ' + e.message); }
  };

  const handleUpdateUser = async (u: User) => {
      try {
          const payload: any = {
              name: u.name,
              email: u.email,
              role: u.role,
              status: u.status
          };
          if(u.password) payload.password = u.password;

          const { error } = await supabase.from('users').update(payload).eq('id', u.id);
          if(error) throw error;
          await fetchData();
      } catch(e:any) { alert('Erro ao atualizar usuário: ' + e.message); }
  };

  const handleDeleteUser = async (id: string) => {
      try {
          // Check dependency: Is this user a teacher in any class?
          const linkedClasses = classes.filter(c => c.teacherId === id);

          if (linkedClasses.length > 0) {
              const confirmSoft = window.confirm(`⚠️ Este usuário é responsável por ${linkedClasses.length} turma(s).\n\nA exclusão física não é permitida para manter a integridade dos dados.\n\nDeseja INATIVAR o usuário, bloqueando seu acesso?`);
              if (confirmSoft) {
                  const { error } = await supabase.from('users').update({ status: 'inactive' }).eq('id', id);
                  if (error) throw error;
                  alert('Usuário inativado com sucesso.');
                  await fetchData();
              }
              return;
          }

          const { error } = await supabase.from('users').delete().eq('id', id);
          if(error) throw error;
          await fetchData();
      } catch(e:any) { alert('Erro ao excluir usuário: ' + e.message); }
  };

  // 6. LOGS
  const handleAddLog = async (l: ClassDailyLog) => {
    try {
      const { error } = await supabase.from('class_daily_logs').insert([{
        id: l.id,
        class_id: l.classId,
        date: l.date,
        content: l.content,
        attendance: l.attendance
      }]);
      if (error) throw error;
      await fetchData();
    } catch (e: any) { alert('Erro ao salvar diário: ' + e.message); }
  };

  const handleDeleteLog = async (id: string) => {
      try {
          const { error } = await supabase.from('class_daily_logs').delete().eq('id', id);
          if(error) throw error;
          await fetchData();
      } catch(e:any) { alert('Erro ao excluir diário: ' + e.message); }
  }


  if (!isAuthenticated) return <Login onLogin={handleLogin} />;
  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#fdfbf7]"><Loader2 className="animate-spin text-[#c48b5e]" size={40} /></div>;

  return (
    <div className="flex h-screen bg-[#fdfbf7] overflow-hidden font-sans">
      <aside className="w-72 bg-[#f3efe9] text-[#433422] p-6 hidden md:flex flex-col border-r border-[#eaddcf]">
        <div className="flex items-center gap-3 mb-10 px-2">
            <div className="bg-[#c48b5e] p-2 rounded-xl text-white shadow-md shadow-[#c48b5e]/20"><GraduationCap size={24} /></div>
            <h1 className="text-xl font-extrabold tracking-tight uppercase text-[#433422]">Educação <span className="text-[#c48b5e]">5.0</span></h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />
          <NavItem icon={<School size={20} />} label="Turmas" active={currentPage === 'classes'} onClick={() => setCurrentPage('classes')} />
          <NavItem icon={<Users size={20} />} label="Alunos" active={currentPage === 'students'} onClick={() => setCurrentPage('students')} />
          <NavItem icon={<ClipboardCheck size={20} />} label="Avaliações" active={currentPage === 'assessments'} onClick={() => setCurrentPage('assessments')} />
          <NavItem icon={<AlertTriangle size={20} />} label="Reforço Escolar" active={currentPage === 'remediation'} onClick={() => setCurrentPage('remediation')} />
          <NavItem icon={<BookOpen size={20} />} label="BNCC" active={currentPage === 'skills'} onClick={() => setCurrentPage('skills')} />
          {currentUser?.role === 'admin' && <NavItem icon={<UserIcon size={20} />} label="Equipe" active={currentPage === 'users'} onClick={() => setCurrentPage('users')} />}
        </nav>

        <div className="mt-auto pt-6 border-t border-[#eaddcf]">
            <div className="px-2 mb-4">
                <p className="text-xs text-[#8c7e72] font-bold uppercase tracking-widest">{currentUser?.name}</p>
                <p className="text-[10px] text-[#c48b5e] font-medium uppercase">{currentUser?.role}</p>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 text-[#8c7e72] hover:text-[#c48b5e] p-2 transition-colors text-sm font-bold">
              <LogOut size={16} /> Encerrar Sessão
            </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-4 md:p-10">
        {currentPage === 'dashboard' && <Dashboard classes={classes} students={students} assessments={assessments} skills={skills} currentUser={currentUser} onNavigateToRemediation={() => setCurrentPage('remediation')} />}
        
        {currentPage === 'classes' && <ClassList 
          classes={classes} 
          students={students} 
          users={users} 
          logs={logs}
          selectedClassId={selectedClassId || undefined} 
          onSelectClass={setSelectedClassId} 
          onSelectStudent={(id) => { setSelectedStudentId(id); setCurrentPage('student-detail'); }} 
          onAddClass={handleAddClass} 
          onUpdateClass={handleUpdateClass} 
          onDeleteClass={handleDeleteClass} 
          onAddStudent={handleAddStudent} 
          onUpdateStudent={handleUpdateStudent} 
          onDeleteStudent={handleDeleteStudent} 
          onAddLog={handleAddLog}
          onDeleteLog={handleDeleteLog}
        />}

        {currentPage === 'students' && <StudentManager students={students} classes={classes} onAddStudent={handleAddStudent} onUpdateStudent={handleUpdateStudent} onDeleteStudent={handleDeleteStudent} onSelectStudent={(id) => { setSelectedStudentId(id); setCurrentPage('student-detail'); }} />}
        {currentPage === 'assessments' && <AssessmentManager assessments={assessments} students={students} classes={classes} skills={skills} onAddAssessment={handleAddAssessment} onDeleteAssessment={handleDeleteAssessment} />}
        {currentPage === 'remediation' && <RemediationList assessments={assessments} students={students} skills={skills} classes={classes} users={users} logs={logs} onSelectStudent={(id) => { setSelectedStudentId(id); setCurrentPage('student-detail'); }} onAddClass={handleAddClass} onDeleteClass={handleDeleteClass} onUpdateStudent={handleUpdateStudent} onAddLog={handleAddLog} onDeleteLog={handleDeleteLog} />}
        {currentPage === 'skills' && <SkillManager skills={skills} classes={classes} onAddSkill={handleAddSkill} onUpdateSkill={handleUpdateSkill} onDeleteSkill={handleDeleteSkill} onUpdateClass={handleUpdateClass} />}
        {currentPage === 'student-detail' && selectedStudentId && <StudentDetail studentId={selectedStudentId} students={students} skills={skills} assessments={assessments} classes={classes} onAddAssessment={handleAddAssessment} onBack={() => setCurrentPage('students')} />}
        {currentPage === 'users' && <UserManager users={users} currentUser={currentUser} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />}
      </main>
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${active ? 'bg-white text-[#c48b5e] shadow-sm border border-[#eaddcf] font-bold' : 'text-[#8c7e72] hover:text-[#433422] hover:bg-[#eaddcf]/50 font-medium'}`}>
    {icon} <span className="text-sm">{label}</span>
  </button>
);