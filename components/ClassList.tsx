import React, { useState } from 'react';
import { ChevronRight, Users, GraduationCap, Plus, Camera, Calendar, Phone, User as UserIcon, Edit2, Trash2, ArrowLeft, X, Target, BookOpen, Save, CheckSquare, Square, Clock, Archive, RefreshCcw, Check, School, Search, Filter, BarChart2, Star, Medal, AlertCircle, Upload, Hash } from 'lucide-react';
import { ClassGroup, Student, User, ClassDailyLog, Assessment, AssessmentStatus } from '../types';

interface ClassListProps {
  classes: ClassGroup[];
  students: Student[];
  users: User[];
  logs?: ClassDailyLog[];
  assessments?: Assessment[]; // Nova prop
  selectedClassId?: string;
  currentUser: User | null;
  onSelectClass: (id: string) => void;
  onSelectStudent: (id: string) => void;
  onAddClass: (c: ClassGroup) => void;
  onUpdateClass: (c: ClassGroup) => void;
  onDeleteClass: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: 'active' | 'inactive') => void;
  onAddStudent: (s: Student) => void;
  onUpdateStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
  onToggleStudentStatus: (id: string, currentStatus: 'active' | 'inactive') => void;
  onAddLog?: (l: ClassDailyLog) => void;
  onDeleteLog?: (id: string) => void;
  onAddAssessment?: (a: Assessment) => void; // Para lançar notas
}

export const ClassList: React.FC<ClassListProps> = ({ 
  classes, 
  students,
  users,
  logs = [],
  assessments = [],
  selectedClassId, 
  currentUser,
  onSelectClass,
  onSelectStudent,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onToggleStatus,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onToggleStudentStatus,
  onAddLog,
  onDeleteLog,
  onAddAssessment
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'diary' | 'performance'>('students');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShift, setFilterShift] = useState('all');

  // Grade Modal State
  const [gradeCategory, setGradeCategory] = useState<'participation' | 'behavior' | 'exam'>('participation');
  const [gradeTerm, setGradeTerm] = useState('1º Trimestre');
  const [gradeDate, setGradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentGrades, setStudentGrades] = useState<Record<string, string>>({});

  const canDelete = currentUser?.role !== 'professor';

  // Class Form State
  const [classFormData, setClassFormData] = useState<Partial<ClassGroup>>({
    name: '',
    grade: '',
    year: new Date().getFullYear(),
    shift: 'Matutino',
    teacherIds: [],
    status: 'active'
  });

  // Student Form State
  const [studentFormData, setStudentFormData] = useState<Partial<Student>>({
    name: '',
    avatarUrl: '',
    registrationNumber: '',
    birthDate: '',
    parentName: '',
    phone: '',
    status: 'active'
  });

  // Diary Form State
  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [newLogContent, setNewLogContent] = useState('');
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  // Helper to filter classes
  const filterClasses = (list: ClassGroup[]) => {
    return list.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.grade.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesShift = filterShift === 'all' || c.shift === filterShift;
      return matchesSearch && matchesShift;
    });
  };

  const regularClasses = classes.filter(c => !c.isRemediation);
  const activeClassesList = filterClasses(regularClasses.filter(c => c.status !== 'inactive'));
  const inactiveClassesList = filterClasses(regularClasses.filter(c => c.status === 'inactive'));

  const activeClass = selectedClassId ? classes.find(c => c.id === selectedClassId) : null;
  const filteredStudents = selectedClassId 
    ? students.filter(s => s.classId === selectedClassId) 
    : [];
  
  const classLogs = activeClass 
    ? logs.filter(l => l.classId === activeClass.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const handleEditClassClick = (e: React.MouseEvent, cls: ClassGroup) => {
      e.stopPropagation();
      setEditingClassId(cls.id);
      setClassFormData({
          name: cls.name,
          grade: cls.grade,
          year: cls.year,
          shift: cls.shift,
          teacherIds: cls.teacherIds || [],
          status: cls.status
      });
      setIsClassModalOpen(true);
  };

  const handleToggleStatusClick = (e: React.MouseEvent, cls: ClassGroup) => {
      e.stopPropagation();
      const confirmMsg = cls.status === 'active' 
         ? `Deseja ARQUIVAR a turma "${cls.name}"?\n\nEla ficará oculta nas listagens principais, mas o histórico será preservado.`
         : `Deseja REATIVAR a turma "${cls.name}"?`;
      
      if(window.confirm(confirmMsg)) {
          onToggleStatus(cls.id, cls.status || 'active');
      }
  };

  const handleDeleteClassClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm('ATENÇÃO: Deseja excluir PERMANENTEMENTE esta turma? Esta ação não pode ser desfeita.')) {
          onDeleteClass(id);
      }
  };

  const handleToggleStudentClick = (e: React.MouseEvent, student: Student) => {
      e.stopPropagation();
      const confirmMsg = student.status === 'active' 
        ? `Deseja INATIVAR o aluno ${student.name}?\n\nEle não aparecerá nas chamadas, mas o histórico será mantido.`
        : `Deseja REATIVAR o aluno ${student.name}?`;

      if(window.confirm(confirmMsg)) {
        onToggleStudentStatus(student.id, student.status || 'active');
      }
  }

  const generateId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const toggleTeacherSelection = (teacherId: string) => {
      setClassFormData(prev => {
          const currentIds = prev.teacherIds || [];
          if (currentIds.includes(teacherId)) {
              return { ...prev, teacherIds: currentIds.filter(id => id !== teacherId) };
          } else {
              return { ...prev, teacherIds: [...currentIds, teacherId] };
          }
      });
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormData.name || !classFormData.grade) return;

    const payload: ClassGroup = {
        id: editingClassId || generateId(),
        name: classFormData.name!,
        grade: classFormData.grade!,
        year: classFormData.year || new Date().getFullYear(),
        shift: classFormData.shift as 'Matutino' | 'Vespertino' | 'Integral' | 'Noturno',
        teacherIds: classFormData.teacherIds || [],
        status: classFormData.status as 'active' | 'inactive',
        isRemediation: false
    };

    if (editingClassId) {
        onUpdateClass(payload);
    } else {
        onAddClass(payload);
    }
    
    setIsClassModalOpen(false);
    setClassFormData({ name: '', grade: '', year: new Date().getFullYear(), shift: 'Matutino', teacherIds: [], status: 'active' });
    setEditingClassId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !studentFormData.name) return;

    onAddStudent({
      id: generateId(),
      classId: activeClass.id,
      name: studentFormData.name!,
      avatarUrl: studentFormData.avatarUrl,
      registrationNumber: studentFormData.registrationNumber,
      birthDate: studentFormData.birthDate,
      parentName: studentFormData.parentName,
      phone: studentFormData.phone,
      status: studentFormData.status as 'active' | 'inactive'
    });

    setIsStudentModalOpen(false);
    setStudentFormData({ name: '', avatarUrl: '', registrationNumber: '', birthDate: '', parentName: '', phone: '', status: 'active' });
  };

  // DIARY LOGIC
  const handleToggleAttendance = (studentId: string) => {
      setAttendance(prev => ({
          ...prev,
          [studentId]: !prev[studentId]
      }));
  };

  const handleSaveLog = (e: React.FormEvent) => {
      e.preventDefault();
      if (!onAddLog || !activeClass || !newLogContent) return;

      onAddLog({
          id: generateId(),
          classId: activeClass.id,
          date: newLogDate,
          content: newLogContent,
          attendance: attendance
      });

      setNewLogContent('');
      setAttendance({});
      alert('Registro de aula salvo com sucesso!');
  };

  const handleDeleteLogClick = (id: string) => {
    if(onDeleteLog && window.confirm('Deseja excluir este registro?')) {
        onDeleteLog(id);
    }
  }

  // --- PERFORMANCE LOGIC: Helper to calc average ---
  const calculateAverage = (items: Assessment[], field: keyof Assessment) => {
      const validItems = items.filter(i => i[field] !== undefined && i[field] !== null);
      if (validItems.length === 0) return null;
      const sum = validItems.reduce((acc, curr) => acc + (Number(curr[field]) || 0), 0);
      return (sum / validItems.length).toFixed(1);
  };

  // --- SAVE BULK GRADES (CORRIGIDO PARA ESTRUTURA UNIFICADA) ---
  const handleGradeChange = (studentId: string, value: string) => {
    setStudentGrades(prev => ({
        ...prev,
        [studentId]: value
    }));
  };

  const handleSaveGrades = () => {
      if (!onAddAssessment) return;
      
      const entries = Object.entries(studentGrades);
      if (entries.length === 0) return;

      entries.forEach(([studentId, score]) => {
          const scoreVal = Number(score);
          let status = AssessmentStatus.EM_DESENVOLVIMENTO;
          // Lógica simplificada de status baseada na nota
          if (scoreVal >= 7) status = AssessmentStatus.ATINGIU;
          if (scoreVal >= 9) status = AssessmentStatus.SUPEROU;
          if (scoreVal < 5) status = AssessmentStatus.NAO_ATINGIU;

          const assessmentPayload: Assessment = {
              id: generateId(),
              studentId,
              date: gradeDate,
              term: gradeTerm,
              status: status, // Status inferido da nota
              notes: `Avaliação Rápida: ${gradeCategory === 'participation' ? 'Participação' : gradeCategory === 'behavior' ? 'Comportamento' : 'Prova'}`,
              
              // Mapeamento correto para a coluna específica
              participationScore: gradeCategory === 'participation' ? scoreVal : undefined,
              behaviorScore: gradeCategory === 'behavior' ? scoreVal : undefined,
              examScore: gradeCategory === 'exam' ? scoreVal : undefined
          };

          onAddAssessment(assessmentPayload);
      });

      setIsGradeModalOpen(false);
      setStudentGrades({});
      alert('Notas lançadas com sucesso!');
  };


  // Se uma turma está selecionada
  if (selectedClassId && activeClass) {
    const activeStudents = filteredStudents.filter(s => s.status !== 'inactive');
    const inactiveStudents = filteredStudents.filter(s => s.status === 'inactive');

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button 
            onClick={() => onSelectClass('')}
            className="flex items-center text-gray-500 hover:text-[#c48b5e] transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" /> Voltar para Turmas
          </button>
          
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <button 
                  onClick={() => setActiveTab('students')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'students' ? 'bg-[#c48b5e] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
              >
                  Alunos
              </button>
              <button 
                  onClick={() => setActiveTab('diary')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'diary' ? 'bg-[#c48b5e] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
              >
                  Diário de Classe
              </button>
              <button 
                  onClick={() => setActiveTab('performance')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'performance' ? 'bg-[#c48b5e] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
              >
                  <BarChart2 size={16}/> Desempenho
              </button>
          </div>
        </div>

        {/* HEADER DA TURMA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#eaddcf] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-[#c48b5e] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#c48b5e]/30">
                <GraduationCap size={32} />
             </div>
             <div>
                <h2 className="text-2xl font-bold text-[#433422]">{activeClass.name}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#8c7e72] mt-1">
                   <span className="flex items-center gap-1"><Target size={14}/> {activeClass.grade}</span>
                   <span className="flex items-center gap-1"><Calendar size={14}/> {activeClass.year}</span>
                   <span className="flex items-center gap-1"><Clock size={14}/> {activeClass.shift}</span>
                </div>
                <div className="mt-2 text-xs flex items-center gap-1 text-[#8c7e72]">
                   <UserIcon size={12} /> 
                   <span className="font-semibold">Professores:</span>
                   {activeClass.teacherIds && activeClass.teacherIds.length > 0 ? (
                       <span>
                           {activeClass.teacherIds.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ')}
                       </span>
                   ) : (
                       <span className="italic text-gray-400">Não atribuído</span>
                   )}
                </div>
             </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
             <span className="bg-[#fcf9f6] text-[#c48b5e] px-4 py-2 rounded-xl font-bold border border-[#eaddcf] text-sm">
                {activeStudents.length} Alunos Ativos
             </span>
             {activeTab === 'students' && (
                 <button 
                    onClick={() => setIsStudentModalOpen(true)}
                    className="bg-[#c48b5e] hover:bg-[#a0704a] text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm font-medium text-sm transition-all w-full md:w-auto justify-center"
                 >
                    <Plus size={16} /> Novo Aluno
                 </button>
             )}
             {activeTab === 'performance' && (
                 <button 
                    onClick={() => { setStudentGrades({}); setIsGradeModalOpen(true); }}
                    className="bg-[#10898b] hover:bg-[#0d7274] text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm font-medium text-sm transition-all w-full md:w-auto justify-center"
                 >
                    <Plus size={16} /> Lançar Notas
                 </button>
             )}
          </div>
        </div>

        {activeTab === 'students' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeStudents.map(student => (
                    <div 
                        key={student.id} 
                        onClick={() => onSelectStudent(student.id)}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-[#c48b5e] hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            {student.avatarUrl ? (
                                <img src={student.avatarUrl} alt={student.name} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-[#fcf9f6] text-[#c48b5e] flex items-center justify-center font-bold text-lg border border-[#eaddcf]">
                                    {student.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-[#433422]">{student.name}</h3>
                                <p className="text-xs text-gray-500">Mat: {student.registrationNumber || '-'}</p>
                            </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                             <ChevronRight className="text-[#c48b5e]" size={20} />
                        </div>
                    </div>
                ))}
             </div>
        ) : activeTab === 'diary' ? (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* FORMULÁRIO DO DIÁRIO */}
                 <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                     <h3 className="font-bold text-[#000039] text-lg mb-4 flex items-center gap-2">
                         <BookOpen className="text-[#c48b5e]" size={20} /> Novo Registro
                     </h3>
                     <form onSubmit={handleSaveLog} className="space-y-4">
                         <div>
                             <label className="block text-sm font-semibold text-[#c48b5e] mb-1">Data</label>
                             <input 
                                type="date"
                                required 
                                value={newLogDate}
                                onChange={e => setNewLogDate(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#c48b5e] text-black bg-white"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-semibold text-[#c48b5e] mb-1">Conteúdo</label>
                             <textarea 
                                required
                                value={newLogContent}
                                onChange={e => setNewLogContent(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#c48b5e] h-32 resize-none text-black bg-white"
                                placeholder="O que foi ensinado hoje?"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-semibold text-[#c48b5e] mb-2">Chamada</label>
                             <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                                 {activeStudents.map(s => (
                                     <div 
                                        key={s.id} 
                                        onClick={() => handleToggleAttendance(s.id)}
                                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                                     >
                                         {attendance[s.id] ? <CheckSquare className="text-green-500" size={20} /> : <Square className="text-gray-300" size={20} />}
                                         <span className="text-sm text-gray-700">{s.name}</span>
                                     </div>
                                 ))}
                             </div>
                         </div>
                         <button type="submit" className="w-full bg-[#c48b5e] text-white py-3 rounded-xl font-bold hover:bg-[#a0704a] flex items-center justify-center gap-2 shadow-md">
                             <Save size={18} /> Salvar Aula
                         </button>
                     </form>
                 </div>

                 {/* HISTÓRICO DO DIÁRIO */}
                 <div className="lg:col-span-2 space-y-4">
                     {classLogs.length > 0 ? classLogs.map(log => {
                         const presentCount = activeStudents.filter(s => log.attendance?.[s.id]).length;
                         return (
                             <div key={log.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-[#eaddcf] transition-all">
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="flex items-center gap-3">
                                         <span className="bg-[#eaddcf] text-[#c48b5e] px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                             <Calendar size={12} /> {new Date(log.date).toLocaleDateString()}
                                         </span>
                                         <span className="text-xs text-gray-500">
                                             Presença: <strong>{presentCount}</strong>/{activeStudents.length}
                                         </span>
                                     </div>
                                     {onDeleteLog && canDelete && (
                                         <button onClick={() => handleDeleteLogClick(log.id)} className="text-gray-400 hover:text-red-500">
                                             <Trash2 size={16} />
                                         </button>
                                     )}
                                 </div>
                                 <p className="text-gray-700 text-sm whitespace-pre-wrap">{log.content}</p>
                             </div>
                         );
                     }) : (
                         <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
                             <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                             <p>Nenhum registro de aula nesta turma.</p>
                         </div>
                     )}
                 </div>
             </div>
        ) : (
            // PERFORMANCE TAB - UPDATED LOGIC FOR UNIFIED ASSESSMENT
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Aluno</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Presença (Diário)</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Média Part.</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Média Comp.</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Média Provas</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Destaque</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {activeStudents.map(student => {
                                // 1. Cálculo de Presença
                                const totalClasses = classLogs.length;
                                const attendedClasses = classLogs.filter(log => log.attendance && log.attendance[student.id]).length;
                                const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
                                
                                // 2. Cálculo de Notas (usando novos campos)
                                const studentAssessments = assessments.filter(a => a.studentId === student.id);
                                
                                const partScore = calculateAverage(studentAssessments, 'participationScore');
                                const behavScore = calculateAverage(studentAssessments, 'behaviorScore');
                                const examScore = calculateAverage(studentAssessments, 'examScore');
                                
                                // Lógica de Superação: Presença > 90% E (Notas altas OU Status Superou em Habilidades)
                                const superouSkills = studentAssessments.filter(a => a.status === AssessmentStatus.SUPEROU).length;
                                const isSuperacao = attendancePercentage >= 90 && (Number(examScore) >= 9 || superouSkills >= 2);

                                return (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-[#000039]">{student.name}</div>
                                            <div className="text-xs text-gray-400">Mat: {student.registrationNumber || '-'}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`font-bold ${attendancePercentage < 75 ? 'text-red-500' : 'text-green-600'}`}>
                                                    {attendancePercentage}%
                                                </span>
                                                <span className="text-[10px] text-gray-400">{attendedClasses}/{totalClasses} aulas</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center text-sm font-medium text-gray-600">
                                            {partScore || '-'}
                                        </td>
                                        <td className="p-4 text-center text-sm font-medium text-gray-600">
                                            {behavScore || '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                             <span className={`px-2 py-1 rounded text-xs font-bold ${Number(examScore) < 6 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
                                                 {examScore || '-'}
                                             </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {isSuperacao && (
                                                <div className="inline-flex flex-col items-center animate-in zoom-in">
                                                    <Medal className="text-yellow-500 drop-shadow-sm" size={24} />
                                                    <span className="text-[10px] font-bold text-yellow-600 uppercase mt-1">Superação</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Modal Novo Aluno (ATUALIZADO PARA FORMULÁRIO COMPLETO) */}
        {isStudentModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#eaddcf]">
                <div className="px-6 py-5 bg-gradient-to-r from-[#c48b5e] to-[#a0704a] flex justify-between items-center">
                   <h3 className="font-bold text-xl text-white flex items-center gap-2">
                        <UserIcon className="text-[#eaddcf]" /> Novo Cadastro de Aluno
                   </h3>
                   <button onClick={() => setIsStudentModalOpen(false)} className="text-white/80 hover:text-white"><X size={24}/></button>
                </div>
                
                <form onSubmit={handleCreateStudent} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Coluna Esquerda: Foto */}
                        <div className="flex flex-col items-center gap-3">
                             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-2 border-dashed border-[#c48b5e]/30 overflow-hidden relative group">
                                {studentFormData.avatarUrl ? (
                                    <img src={studentFormData.avatarUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="text-[#c48b5e] w-8 h-8" />
                                )}
                                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <Upload className="text-white" size={20} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                             </div>
                             <div className="w-full text-center">
                                <label className="text-xs text-[#c48b5e] font-bold cursor-pointer hover:underline">
                                    Alterar Foto
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                             </div>
                        </div>

                        {/* Coluna Direita: Dados Principais */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 flex items-center gap-1">
                                    <UserIcon size={14} /> Nome Completo
                                </label>
                                <input 
                                    required
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-black bg-white"
                                    value={studentFormData.name}
                                    onChange={e => setStudentFormData({...studentFormData, name: e.target.value})}
                                    placeholder="Ex: João da Silva"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 flex items-center gap-1">
                                        <Hash size={14} /> Matrícula
                                    </label>
                                    <input 
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-black bg-white"
                                        value={studentFormData.registrationNumber}
                                        onChange={e => setStudentFormData({...studentFormData, registrationNumber: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 flex items-center gap-1">
                                        <Calendar size={14} /> Nascimento
                                    </label>
                                    <input 
                                        type="date"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-black bg-white"
                                        value={studentFormData.birthDate}
                                        onChange={e => setStudentFormData({...studentFormData, birthDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            {/* Turma é fixa nesta visualização */}
                            <div className="bg-[#fcf9f6] p-3 rounded-xl border border-[#eaddcf]">
                                <span className="text-xs text-[#8c7e72] font-bold uppercase">Turma Vinculada</span>
                                <p className="text-sm font-bold text-[#433422]">{activeClass.name} - {activeClass.grade}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h4 className="font-bold text-[#433422] mb-4 text-lg">Informações de Contato</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5">Responsável Legal</label>
                                <input 
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-black bg-white"
                                    value={studentFormData.parentName}
                                    onChange={e => setStudentFormData({...studentFormData, parentName: e.target.value})}
                                    placeholder="Nome do Pai/Mãe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 flex items-center gap-1">
                                    <Phone size={14} /> Telefone
                                </label>
                                <input 
                                    placeholder="(00) 00000-0000"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-black bg-white"
                                    value={studentFormData.phone}
                                    onChange={e => setStudentFormData({...studentFormData, phone: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                   <button type="submit" className="w-full bg-[#c48b5e] text-white py-3.5 rounded-xl font-bold hover:bg-[#a0704a] shadow-lg mt-2">
                       Cadastrar Aluno
                   </button>
                </form>
             </div>
          </div>
        )}

        {/* Modal Lançar Notas (ATUALIZADO) */}
        {isGradeModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#bfe4cd]">
                 <div className="px-6 py-5 bg-gradient-to-r from-[#10898b] to-[#0d7274] flex justify-between items-center">
                    <h3 className="font-bold text-xl text-white flex items-center gap-2">
                       <BarChart2 className="text-[#bfe4cd]" /> Lançamento de Notas
                    </h3>
                    <button onClick={() => setIsGradeModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                       <X size={24} />
                    </button>
                 </div>
                 <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#10898b] mb-1">Categoria da Nota</label>
                            <select 
                                value={gradeCategory}
                                onChange={e => setGradeCategory(e.target.value as any)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#10898b] outline-none text-black bg-white"
                            >
                                <option value="participation">Participação</option>
                                <option value="behavior">Comportamento</option>
                                <option value="exam">Prova / Trabalho</option>
                            </select>
                        </div>
                        {/* Campo de Peso Removido para simplificação */}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-semibold text-[#10898b] mb-1">Data</label>
                            <input 
                                type="date"
                                value={gradeDate}
                                onChange={e => setGradeDate(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#10898b] outline-none text-black bg-white"
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-semibold text-[#10898b] mb-1">Trimestre</label>
                            <select 
                                value={gradeTerm}
                                onChange={e => setGradeTerm(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#10898b] outline-none text-black bg-white"
                            >
                                <option value="1º Trimestre">1º Trimestre</option>
                                <option value="2º Trimestre">2º Trimestre</option>
                                <option value="3º Trimestre">3º Trimestre</option>
                            </select>
                         </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-bold text-[#000039] mb-3">Atribuir Notas aos Alunos</h4>
                        <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100 max-h-60 overflow-y-auto">
                            {activeStudents.map(student => (
                                <div key={student.id} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">{student.name}</span>
                                    <input 
                                        type="number"
                                        min="0" max="10" step="0.1"
                                        placeholder="0-10"
                                        className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:ring-2 focus:ring-[#10898b] outline-none text-black bg-white"
                                        value={studentGrades[student.id] || ''}
                                        onChange={e => handleGradeChange(student.id, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveGrades}
                        className="w-full bg-[#10898b] text-white py-3 rounded-xl font-bold hover:bg-[#0d7274] shadow-md mt-2"
                    >
                        Salvar Lançamentos
                    </button>
                 </div>
              </div>
            </div>
        )}

      </div>
    );
  }

  // Lista de Turmas (Cards) - Mantido igual ao original
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-[#433422]">Minhas Turmas</h2>
           <p className="text-[#8c7e72]">Gerenciamento de salas e alunos</p>
        </div>
        <button 
          onClick={() => { setEditingClassId(null); setClassFormData({ name: '', grade: '', year: new Date().getFullYear(), shift: 'Matutino', teacherIds: [], status: 'active' }); setIsClassModalOpen(true); }}
          className="bg-[#c48b5e] hover:bg-[#a0704a] text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#c48b5e]/20 transition-all transform hover:-translate-y-0.5 font-medium"
        >
          <Plus size={18} /> Nova Turma
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-[#eaddcf] mb-6">
          <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                  type="text"
                  placeholder="Buscar por nome ou série..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#c48b5e] outline-none bg-white text-black placeholder-gray-500"
              />
          </div>
          <div className="w-full md:w-48 relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select 
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#c48b5e] outline-none appearance-none bg-white text-black"
              >
                  <option value="all">Todos os Turnos</option>
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                  <option value="Integral">Integral</option>
                  <option value="Noturno">Noturno</option>
              </select>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeClassesList.map(cls => {
            const studentCount = students.filter(s => s.classId === cls.id && s.status !== 'inactive').length;
            
            return (
              <div key={cls.id} onClick={() => onSelectClass(cls.id)} className="bg-white p-6 rounded-xl shadow-sm border border-[#eaddcf] hover:border-[#c48b5e] hover:shadow-lg transition-all cursor-pointer group relative">
                <div className="flex items-start justify-between mb-4">
                   <div className="p-3 bg-[#fcf9f6] rounded-xl text-[#c48b5e] group-hover:bg-[#c48b5e] group-hover:text-white transition-colors">
                      <GraduationCap size={24} />
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                       <button 
                         onClick={(e) => handleEditClassClick(e, cls)} 
                         className="p-2 text-gray-400 hover:text-[#c48b5e] hover:bg-[#fcf9f6] rounded-lg"
                         title="Editar Turma"
                       >
                           <Edit2 size={16} />
                       </button>
                       <button 
                         onClick={(e) => handleToggleStatusClick(e, cls)} 
                         className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg"
                         title="Arquivar Turma"
                       >
                           <Archive size={16} />
                       </button>
                       {canDelete && (
                         <button 
                           onClick={(e) => handleDeleteClassClick(e, cls.id)} 
                           className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                           title="Excluir Turma"
                         >
                           <Trash2 size={16} />
                         </button>
                       )}
                   </div>
                </div>
                
                <h3 className="text-xl font-bold text-[#433422] mb-1">{cls.name}</h3>
                <p className="text-sm text-[#8c7e72] mb-4">{cls.grade} • {cls.shift}</p>
                
                {/* Professor List in Card */}
                <div className="flex items-center gap-2 mb-4 bg-[#fcf9f6] p-2 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-[#eaddcf]">
                        <UserIcon size={12} className="text-[#c48b5e]"/>
                    </div>
                    <div className="flex-1 overflow-hidden">
                         {cls.teacherIds && cls.teacherIds.length > 0 ? (
                             <span className="text-xs text-[#8c7e72] font-medium truncate block" title={cls.teacherIds.map(id => users.find(u => u.id === id)?.name).join(', ')}>
                                 {cls.teacherIds.map(id => users.find(u => u.id === id)?.name.split(' ')[0]).join(', ')}
                             </span>
                         ) : (
                             <span className="text-xs text-gray-400 italic">Sem professor</span>
                         )}
                    </div>
                </div>
                
                <div className="flex items-center text-[#8c7e72] text-sm font-medium border-t border-[#fcf9f6] pt-3">
                    <Users size={16} className="mr-2" />
                    {studentCount} Alunos
                </div>
              </div>
            );
        })}

        {/* INACTIVE CLASSES */}
        {inactiveClassesList.length > 0 && (
             <div className="col-span-full mt-8">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <Archive size={16} /> Turmas Arquivadas
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {inactiveClassesList.map(cls => (
                         <div key={cls.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 opacity-75 hover:opacity-100 transition-all flex flex-col justify-between">
                             <div>
                                 <h3 className="text-lg font-bold text-gray-600 mb-1">{cls.name}</h3>
                                 <p className="text-xs text-gray-500 mb-2">{cls.grade} • {cls.year}</p>
                             </div>
                             <div className="flex justify-end">
                                 <button 
                                     onClick={(e) => handleToggleStatusClick(e, cls)}
                                     className="flex items-center gap-2 text-xs font-bold text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors border border-green-200"
                                 >
                                     <RefreshCcw size={12} /> Reativar
                                 </button>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
        )}

        {activeClassesList.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
                <p>Nenhuma turma encontrada com os filtros selecionados.</p>
            </div>
        )}

        {/* Create Card */}
        <button 
          onClick={() => { setEditingClassId(null); setClassFormData({ name: '', grade: '', year: new Date().getFullYear(), shift: 'Matutino', teacherIds: [], status: 'active' }); setIsClassModalOpen(true); }}
          className="bg-[#fcf9f6] p-6 rounded-xl border-2 border-dashed border-[#eaddcf] flex flex-col items-center justify-center text-[#c48b5e] hover:bg-[#eaddcf]/20 hover:border-[#c48b5e] transition-all min-h-[200px] group"
        >
           <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
              <Plus size={24} />
           </div>
           <span className="font-bold">Criar Nova Turma</span>
        </button>
      </div>

      {/* Modal Criar/Editar Turma */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#eaddcf]">
             <div className="px-6 py-5 bg-gradient-to-r from-[#c48b5e] to-[#a0704a] flex justify-between items-center">
                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                   <School className="text-[#eaddcf]" /> {editingClassId ? 'Editar Turma' : 'Nova Turma'}
                </h3>
                <button onClick={() => setIsClassModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                   <X size={24} />
                </button>
             </div>
             
             <form onSubmit={handleCreateClass} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5">Nome da Turma</label>
                    <input 
                       required
                       className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] text-black bg-white"
                       placeholder="Ex: 1º Ano A"
                       value={classFormData.name}
                       onChange={e => setClassFormData({...classFormData, name: e.target.value})}
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5">Série / Grau</label>
                        <input 
                           required
                           className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] text-black bg-white"
                           placeholder="Ex: Fundamental I"
                           value={classFormData.grade}
                           onChange={e => setClassFormData({...classFormData, grade: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5">Ano Letivo</label>
                        <input 
                           type="number"
                           required
                           className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] text-black bg-white"
                           value={classFormData.year}
                           onChange={e => setClassFormData({...classFormData, year: Number(e.target.value)})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5">Turno</label>
                    <select 
                       className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] text-black bg-white"
                       value={classFormData.shift}
                       onChange={e => setClassFormData({...classFormData, shift: e.target.value as any})}
                    >
                        <option value="Matutino">Matutino</option>
                        <option value="Vespertino">Vespertino</option>
                        <option value="Integral">Integral</option>
                        <option value="Noturno">Noturno</option>
                    </select>
                </div>

                {/* Multi-Teacher Selection */}
                <div>
                   <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5">Professores Responsáveis</label>
                   <div className="border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto bg-white">
                      {users.filter(u => u.role !== 'admin').map(u => (
                        <div 
                           key={u.id} 
                           onClick={() => toggleTeacherSelection(u.id)} 
                           className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors border border-transparent hover:border-gray-100"
                        >
                           <div className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${classFormData.teacherIds?.includes(u.id) ? 'bg-[#c48b5e] border-[#c48b5e]' : 'border-gray-300 bg-white'}`}>
                              {classFormData.teacherIds?.includes(u.id) && <Check size={14} className="text-white" />}
                           </div>
                           <span className="text-sm text-black font-medium">{u.name}</span>
                        </div>
                      ))}
                      {users.filter(u => u.role !== 'admin').length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-2">Nenhum professor cadastrado.</p>
                      )}
                   </div>
                   <p className="text-[10px] text-gray-400 mt-1 ml-1">* Selecione um ou mais professores para esta turma.</p>
                </div>

                <div className="pt-2">
                    <button type="submit" className="w-full bg-[#c48b5e] text-white py-3.5 rounded-xl font-bold hover:bg-[#a0704a] shadow-lg shadow-[#c48b5e]/20 transition-all transform hover:-translate-y-0.5">
                       {editingClassId ? 'Salvar Alterações' : 'Criar Turma'}
                    </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};