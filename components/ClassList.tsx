import React, { useState } from 'react';
import { ChevronRight, Users, GraduationCap, Plus, Camera, Calendar, Phone, User as UserIcon, Edit2, Trash2, ArrowLeft, X, Target, BookOpen, Save, CheckSquare, Square, Clock, Archive, RefreshCcw } from 'lucide-react';
import { ClassGroup, Student, User, ClassDailyLog } from '../types';

interface ClassListProps {
  classes: ClassGroup[];
  students: Student[];
  users: User[];
  logs?: ClassDailyLog[];
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
}

export const ClassList: React.FC<ClassListProps> = ({ 
  classes, 
  students,
  users,
  logs = [],
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
  onDeleteLog
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'diary'>('students');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  const canDelete = currentUser?.role !== 'professor';

  // Class Form State
  const [classFormData, setClassFormData] = useState<Partial<ClassGroup>>({
    name: '',
    grade: '',
    year: new Date().getFullYear(),
    shift: 'Matutino',
    teacherId: '',
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
          teacherId: cls.teacherId || '',
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
      if(window.confirm('ATENÇÃO: Deseja excluir PERMANENTEMENTE esta turma vazia? Esta ação não pode ser desfeita.')) {
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

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormData.name || !classFormData.grade) return;

    const payload: ClassGroup = {
        id: editingClassId || generateId(),
        name: classFormData.name!,
        grade: classFormData.grade!,
        year: classFormData.year || new Date().getFullYear(),
        shift: classFormData.shift as 'Matutino' | 'Vespertino' | 'Integral' | 'Noturno',
        teacherId: classFormData.teacherId || undefined, // Send undefined if empty
        status: classFormData.status as 'active' | 'inactive',
        isRemediation: false
    };

    if (editingClassId) {
        onUpdateClass(payload);
    } else {
        onAddClass(payload);
    }
    
    setIsClassModalOpen(false);
    setClassFormData({ name: '', grade: '', year: new Date().getFullYear(), shift: 'Matutino', teacherId: '', status: 'active' });
    setEditingClassId(null);
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
  };

  const formatDateDisplay = (dateString: string) => {
      if (!dateString) return '-';
      // Create date object treating the string as local date components to avoid timezone shifts
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        weekday: 'short'
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#433422]">
            {activeClass ? activeClass.name : 'Minhas Turmas'}
          </h2>
          <p className="text-[#8c7e72]">
            {activeClass 
              ? `${activeClass.grade} • ${filteredStudents.length} Alunos matriculados`
              : 'Gerencie as turmas e acompanhe o progresso dos alunos.'
            }
          </p>
        </div>
        
        <div className="flex gap-2">
          {!activeClass ? (
            <button 
              onClick={() => { setEditingClassId(null); setIsClassModalOpen(true); }}
              className="bg-[#c48b5e] hover:bg-[#a0704a] text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#c48b5e]/20 transition-all transform hover:-translate-y-0.5 font-medium"
            >
              <Plus size={20} /> Nova Turma
            </button>
          ) : (
            <>
              <button 
                 onClick={() => onSelectClass('')}
                 className="px-4 py-2 text-[#433422] bg-white border border-[#eaddcf] rounded-xl hover:bg-[#fcf9f6] font-medium flex items-center gap-2 transition-colors"
              >
                 <ArrowLeft size={16} /> Voltar
              </button>
              {activeTab === 'students' && (
                <button 
                    onClick={() => setIsStudentModalOpen(true)}
                    className="bg-[#c48b5e] hover:bg-[#a0704a] text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-[#c48b5e]/20 transition-all transform hover:-translate-y-0.5 font-medium"
                >
                    <Plus size={18} /> Novo Aluno
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {!activeClass ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const studentCount = students.filter(s => s.classId === cls.id).length;
            const teacherName = users.find(u => u.id === cls.teacherId)?.name || 'Sem professor';
            const isRemediation = cls.isRemediation;
            const focusCount = cls.focusSkills?.length || 0;
            const isActive = cls.status !== 'inactive';
            
            return (
              <div 
                key={cls.id}
                onClick={() => onSelectClass(cls.id)}
                className={`rounded-xl shadow-sm border border-[#eaddcf] border-t-4 p-6 cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden
                    ${isActive ? 'bg-white border-t-[#c48b5e]' : 'bg-gray-50 border-t-gray-400 opacity-80'}`}
              >
                {!isActive && (
                  <div className="absolute top-2 right-2 bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                      <Archive size={10} /> Inativa
                  </div>
                )}
                {isRemediation && isActive && (
                   <div className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                      Reforço
                   </div>
                )}
                
                <div className="flex items-start justify-between mb-4 mt-2">
                  <div className={`p-3 rounded-xl transition-colors ${isActive ? 'bg-[#eaddcf] text-[#c48b5e]' : 'bg-gray-200 text-gray-500'}`}>
                    <GraduationCap size={28} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="bg-[#fcf9f6] text-[#8c7e72] text-xs px-2 py-1 rounded mb-1 font-mono border border-[#eaddcf]">
                      {cls.year}
                    </span>
                    <span className="text-[10px] text-[#8c7e72] font-medium uppercase">{cls.shift}</span>
                  </div>
                </div>
                
                <h3 className={`text-xl font-bold mb-1 transition-colors ${isActive ? 'text-[#433422] group-hover:text-[#c48b5e]' : 'text-gray-600'}`}>{cls.name}</h3>
                <p className="text-[#8c7e72] text-sm mb-4 line-clamp-1">{cls.grade}</p>
                
                <div className="flex items-center gap-2 mb-2 bg-[#fcf9f6] p-2 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-[#eaddcf]">
                        <UserIcon size={12} className="text-[#8c7e72]"/>
                    </div>
                    <span className="text-xs text-[#8c7e72] font-medium truncate">{teacherName}</span>
                </div>

                {focusCount > 0 && isActive && (
                   <div className="mb-4 inline-flex items-center gap-1.5 text-xs text-[#a0704a] bg-[#eaddcf]/30 px-2 py-1 rounded border border-[#eaddcf]/50">
                      <Target size={12} />
                      <strong>{focusCount}</strong> Habilidades Foco
                   </div>
                )}
                
                <div className={`flex items-center justify-between border-t border-[#eaddcf] pt-3 ${focusCount > 0 ? '' : 'mt-4'}`}>
                  <div className="flex items-center text-[#8c7e72] text-sm font-medium">
                    <Users size={16} className={`mr-2 ${isActive ? 'text-[#c48b5e]' : 'text-gray-400'}`} />
                    {studentCount} Alunos
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleEditClassClick(e, cls)} className="p-2 text-[#8c7e72] hover:text-[#c48b5e] hover:bg-[#eaddcf] rounded-full transition-colors" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      
                      <button 
                         onClick={(e) => handleToggleStatusClick(e, cls)} 
                         className={`p-2 rounded-full transition-colors ${isActive ? 'text-orange-400 hover:text-orange-600 hover:bg-orange-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'}`}
                         title={isActive ? "Arquivar/Inativar" : "Reativar Turma"}
                      >
                         {isActive ? <Archive size={16} /> : <RefreshCcw size={16} />}
                      </button>

                      {canDelete && !isActive && studentCount === 0 && (
                          <button onClick={(e) => handleDeleteClassClick(e, cls.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Excluir Permanentemente">
                            <Trash2 size={16} />
                          </button>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
          {classes.length === 0 && (
            <div className="col-span-full py-16 px-4 text-center text-[#8c7e72] bg-white rounded-xl border-2 border-dashed border-[#eaddcf] hover:border-[#c48b5e] transition-colors">
               <div className="w-16 h-16 bg-[#fcf9f6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="text-[#d1c5b8]" size={32} />
               </div>
               <h3 className="text-lg font-medium text-[#433422] mb-1">Nenhuma turma encontrada</h3>
               <p className="text-sm text-[#8c7e72] mb-4">Comece criando sua primeira turma para gerenciar alunos.</p>
               <button 
                  onClick={() => { setEditingClassId(null); setIsClassModalOpen(true); }}
                  className="text-[#c48b5e] font-medium hover:underline"
               >
                  Criar Turma Agora
               </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
            <div className="flex gap-2 border-b border-[#eaddcf] pb-1">
                <button 
                    onClick={() => setActiveTab('students')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'students' ? 'bg-[#c48b5e] text-white' : 'text-[#8c7e72] hover:bg-[#eaddcf]/30'}`}
                >
                    <Users size={16} className="inline mr-2" />
                    Alunos
                </button>
                <button 
                    onClick={() => setActiveTab('diary')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'diary' ? 'bg-[#c48b5e] text-white' : 'text-[#8c7e72] hover:bg-[#eaddcf]/30'}`}
                >
                    <BookOpen size={16} className="inline mr-2" />
                    Diário de Classe
                </button>
            </div>

            {activeTab === 'students' && (
                <div className="bg-white rounded-xl shadow-sm border border-[#eaddcf] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-[#fcf9f6] border-b border-[#eaddcf]">
                        <th className="p-4 text-sm font-semibold text-[#8c7e72] uppercase text-xs tracking-wider">Aluno</th>
                        <th className="p-4 text-sm font-semibold text-[#8c7e72] uppercase text-xs tracking-wider">Matrícula</th>
                        <th className="p-4 text-sm font-semibold text-[#8c7e72] uppercase text-xs tracking-wider">Responsável</th>
                        <th className="p-4 text-sm font-semibold text-[#8c7e72] uppercase text-xs tracking-wider text-center">Status</th>
                        <th className="p-4 text-sm font-semibold text-[#8c7e72] text-right"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#fcf9f6]">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => {
                            const isActiveStudent = student.status !== 'inactive';
                            return (
                                <tr 
                                    key={student.id} 
                                    className="hover:bg-[#eaddcf]/20 transition-colors cursor-pointer group"
                                    onClick={() => onSelectStudent(student.id)}
                                >
                                    <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {student.avatarUrl ? (
                                        <img src={student.avatarUrl} alt={student.name} className={`w-10 h-10 rounded-full object-cover border border-[#eaddcf] ${!isActiveStudent ? 'grayscale opacity-50' : ''}`} />
                                        ) : (
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border border-[#eaddcf] ${isActiveStudent ? 'bg-[#eaddcf] text-[#c48b5e]' : 'bg-gray-100 text-gray-400'}`}>
                                            {student.name.charAt(0)}
                                        </div>
                                        )}
                                        <div>
                                        <p className={`font-medium transition-colors ${isActiveStudent ? 'text-[#433422] group-hover:text-[#c48b5e]' : 'text-gray-400 line-through'}`}>{student.name}</p>
                                        <p className="text-xs text-[#8c7e72]">{new Date().getFullYear() - new Date(student.birthDate || '').getFullYear()} anos</p>
                                        </div>
                                    </div>
                                    </td>
                                    <td className="p-4 text-[#8c7e72] text-sm font-mono">{student.registrationNumber || '-'}</td>
                                    <td className="p-4 text-[#8c7e72] text-sm">
                                    <div>{student.parentName || '-'}</div>
                                    <div className="text-xs text-[#8c7e72] flex items-center gap-1">
                                        <Phone size={10} /> {student.phone}
                                    </div>
                                    </td>
                                    <td className="p-4 text-center">
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide border ${!isActiveStudent ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                        {!isActiveStudent ? 'Inativo' : 'Ativo'}
                                    </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={(e) => handleToggleStudentClick(e, student)}
                                                className={`p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${isActiveStudent ? 'text-orange-400 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                                                title={isActiveStudent ? "Inativar Aluno" : "Reativar Aluno"}
                                            >
                                                {isActiveStudent ? <Archive size={18} /> : <RefreshCcw size={18} />}
                                            </button>
                                            
                                            <div className="w-8 h-8 rounded-full bg-[#fcf9f6] flex items-center justify-center text-[#d1c5b8] group-hover:bg-[#eaddcf] group-hover:text-[#c48b5e] transition-all">
                                                <ChevronRight size={18} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                        <td colSpan={5} className="p-12 text-center text-[#8c7e72] flex flex-col items-center">
                            <div className="w-12 h-12 bg-[#fcf9f6] rounded-full flex items-center justify-center mb-3">
                                <Users className="text-[#d1c5b8]" />
                            </div>
                            <p>Nenhum aluno cadastrado nesta turma.</p>
                            <button 
                                onClick={() => setIsStudentModalOpen(true)}
                                className="mt-2 text-[#c48b5e] text-sm font-medium hover:underline"
                            >
                                Adicionar primeiro aluno
                            </button>
                        </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            )}

            {activeTab === 'diary' && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-[#eaddcf] h-fit">
                        <h3 className="font-bold text-[#433422] text-lg mb-4 flex items-center gap-2">
                             <Edit2 size={18} className="text-[#c48b5e]" /> Novo Registro
                        </h3>
                        <form onSubmit={handleSaveLog} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Data</label>
                                <input 
                                    type="date" 
                                    value={newLogDate}
                                    onChange={e => setNewLogDate(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] bg-[#fcf9f6] focus:bg-white text-[#433422]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Conteúdo Ministrado</label>
                                <textarea 
                                    value={newLogContent}
                                    onChange={e => setNewLogContent(e.target.value)}
                                    placeholder="O que foi ensinado hoje..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] bg-[#fcf9f6] focus:bg-white text-[#433422] resize-none h-28"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#c48b5e] mb-2 ml-1">Chamada (Alunos Ativos)</label>
                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-[#fcf9f6] space-y-1">
                                    {filteredStudents.filter(s => s.status !== 'inactive').map(s => (
                                        <div 
                                            key={s.id} 
                                            onClick={() => handleToggleAttendance(s.id)}
                                            className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                                        >
                                            {attendance[s.id] ? <CheckSquare className="text-green-600" size={20} /> : <Square className="text-gray-300" size={20} />}
                                            <span className={`text-sm ${attendance[s.id] ? 'font-bold text-[#433422]' : 'text-gray-500'}`}>{s.name}</span>
                                        </div>
                                    ))}
                                    {filteredStudents.filter(s => s.status !== 'inactive').length === 0 && <p className="text-xs text-center text-gray-400 py-2">Sem alunos ativos.</p>}
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-[#c48b5e] text-white py-3 rounded-xl font-bold hover:bg-[#a0704a] shadow-md flex items-center justify-center gap-2">
                                <Save size={18} /> Salvar Diário
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-bold text-[#433422] text-lg mb-2 flex items-center gap-2">
                            <Clock size={18} className="text-[#c48b5e]" /> Histórico de Aulas
                        </h3>
                        {classLogs.length > 0 ? (
                            classLogs.map(log => {
                                const presentCount = filteredStudents.filter(s => log.attendance?.[s.id]).length;
                                return (
                                    <div key={log.id} className="bg-white p-5 rounded-xl shadow-sm border border-[#eaddcf] hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-[#eaddcf] text-[#c48b5e] px-2 py-1 rounded-lg text-xs font-bold font-mono border border-[#c48b5e]/20 capitalize">
                                                    {formatDateDisplay(log.date)}
                                                </span>
                                                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                    Presença: <strong>{presentCount}</strong>
                                                </span>
                                            </div>
                                            {onDeleteLog && canDelete && (
                                                <button onClick={() => handleDeleteLogClick(log.id)} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-line bg-[#fcf9f6] p-3 rounded-lg border border-[#eaddcf]/50">
                                            {log.content}
                                        </p>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-[#eaddcf] text-[#8c7e72]">
                                <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Nenhum registro de aula encontrado.</p>
                            </div>
                        )}
                    </div>
                 </div>
            )}
        </div>
      )}

      {/* MODAL: NOVA TURMA e MODAL: NOVO ALUNO */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#eaddcf]">
             <div className="px-6 py-5 bg-gradient-to-r from-[#c48b5e] to-[#a0704a] flex justify-between items-center">
                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                   <GraduationCap className="text-[#eaddcf]" /> 
                   {editingClassId ? 'Editar Turma' : 'Nova Turma'}
                </h3>
                <button onClick={() => setIsClassModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                    <X size={24} />
                </button>
             </div>
             
             <form onSubmit={handleCreateClass} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                   <div>
                      <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Nome da Turma</label>
                      <input 
                        required
                        placeholder="Ex: 1º Ano A"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-[#433422] bg-[#fcf9f6] focus:bg-white placeholder-[#d1c5b8]"
                        value={classFormData.name}
                        onChange={e => setClassFormData({...classFormData, name: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Ano Letivo</label>
                      <input 
                        type="number"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-[#433422] bg-[#fcf9f6] focus:bg-white"
                        value={classFormData.year}
                        onChange={e => setClassFormData({...classFormData, year: parseInt(e.target.value)})}
                      />
                   </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Série / Grau</label>
                  <input 
                    required
                    placeholder="Ex: Ensino Fundamental I"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-[#433422] bg-[#fcf9f6] focus:bg-white placeholder-[#d1c5b8]"
                    value={classFormData.grade}
                    onChange={e => setClassFormData({...classFormData, grade: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Turno</label>
                    <select 
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent bg-[#fcf9f6] focus:bg-white transition-all text-[#433422]"
                      value={classFormData.shift}
                      onChange={e => setClassFormData({...classFormData, shift: e.target.value as any})}
                    >
                      <option value="Matutino">Matutino</option>
                      <option value="Vespertino">Vespertino</option>
                      <option value="Integral">Integral</option>
                      <option value="Noturno">Noturno</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Status</label>
                    <select 
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent bg-[#fcf9f6] focus:bg-white transition-all text-[#433422]"
                      value={classFormData.status}
                      onChange={e => setClassFormData({...classFormData, status: e.target.value as any})}
                    >
                      <option value="active">Ativa</option>
                      <option value="inactive">Inativa</option>
                    </select>
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Professor Responsável</label>
                   <select 
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent bg-[#fcf9f6] focus:bg-white transition-all text-[#433422]"
                      value={classFormData.teacherId}
                      onChange={e => setClassFormData({...classFormData, teacherId: e.target.value})}
                   >
                      <option value="">Selecione um professor...</option>
                      {users.filter(u => u.role !== 'admin').map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                   </select>
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

      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#eaddcf]">
             <div className="px-6 py-5 bg-gradient-to-r from-[#c48b5e] to-[#a0704a] flex justify-between items-center">
                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                   <Users className="text-[#eaddcf]" />
                   Matricular Aluno
                </h3>
                <button onClick={() => setIsStudentModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                    <X size={24} />
                </button>
             </div>
             
             <form onSubmit={handleCreateStudent} className="p-8 space-y-5 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center gap-4">
                   <div className="w-20 h-20 bg-[#fcf9f6] rounded-full flex items-center justify-center border-2 border-dashed border-[#c48b5e]/30 overflow-hidden relative group shrink-0">
                      {studentFormData.avatarUrl ? (
                        <img src={studentFormData.avatarUrl} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="text-[#c48b5e]" size={28} />
                      )}
                   </div>
                   <div className="flex-1">
                      <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">URL da Foto (Opcional)</label>
                      <input 
                        placeholder="https://..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-[#433422] bg-[#fcf9f6] focus:bg-white placeholder-[#d1c5b8]"
                        value={studentFormData.avatarUrl}
                        onChange={e => setStudentFormData({...studentFormData, avatarUrl: e.target.value})}
                      />
                   </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Nome Completo</label>
                  <input 
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-[#433422] bg-[#fcf9f6] focus:bg-white"
                    value={studentFormData.name}
                    onChange={e => setStudentFormData({...studentFormData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                   <div>
                      <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Matrícula</label>
                      <input 
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-[#433422] bg-[#fcf9f6] focus:bg-white"
                        value={studentFormData.registrationNumber}
                        onChange={e => setStudentFormData({...studentFormData, registrationNumber: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Nascimento</label>
                      <input 
                        type="date"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-[#433422] bg-[#fcf9f6] focus:bg-white"
                        value={studentFormData.birthDate}
                        onChange={e => setStudentFormData({...studentFormData, birthDate: e.target.value})}
                      />
                   </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Responsável</label>
                  <input 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-[#433422] bg-[#fcf9f6] focus:bg-white"
                    value={studentFormData.parentName}
                    onChange={e => setStudentFormData({...studentFormData, parentName: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                   <div>
                      <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Telefone</label>
                      <input 
                        placeholder="(00) 00000-0000"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-[#433422] bg-[#fcf9f6] focus:bg-white"
                        value={studentFormData.phone}
                        onChange={e => setStudentFormData({...studentFormData, phone: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Status</label>
                      <select 
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent bg-[#fcf9f6] focus:bg-white transition-all text-[#433422]"
                        value={studentFormData.status}
                        onChange={e => setStudentFormData({...studentFormData, status: e.target.value as any})}
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                      </select>
                   </div>
                </div>
                
                <div className="bg-[#eaddcf]/20 p-4 rounded-xl border border-[#eaddcf] text-sm text-[#a0704a] flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#c48b5e]"></div>
                   Turma selecionada: <strong>{activeClass?.name}</strong>
                </div>

                <div className="pt-2">
                    <button type="submit" className="w-full bg-[#c48b5e] text-white py-3.5 rounded-xl font-bold hover:bg-[#a0704a] shadow-lg shadow-[#c48b5e]/20 transition-all transform hover:-translate-y-0.5">
                    Matricular Aluno
                    </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};