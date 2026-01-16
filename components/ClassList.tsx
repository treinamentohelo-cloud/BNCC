import React, { useState } from 'react';
import { ChevronRight, Users, GraduationCap, Plus, Camera, Calendar, Phone, User as UserIcon, Edit2, Trash2, ArrowLeft, X } from 'lucide-react';
import { ClassGroup, Student, User } from '../types';

interface ClassListProps {
  classes: ClassGroup[];
  students: Student[];
  users: User[];
  selectedClassId?: string;
  onSelectClass: (id: string) => void;
  onSelectStudent: (id: string) => void;
  onAddClass: (c: ClassGroup) => void;
  onUpdateClass: (c: ClassGroup) => void;
  onDeleteClass: (id: string) => void;
  onAddStudent: (s: Student) => void;
  onUpdateStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
}

export const ClassList: React.FC<ClassListProps> = ({ 
  classes, 
  students,
  users,
  selectedClassId, 
  onSelectClass,
  onSelectStudent,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent
}) => {
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

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

  const activeClass = selectedClassId ? classes.find(c => c.id === selectedClassId) : null;
  const filteredStudents = selectedClassId 
    ? students.filter(s => s.classId === selectedClassId) 
    : [];

  const handleEditClassClick = (e: React.MouseEvent, cls: ClassGroup) => {
      e.stopPropagation();
      setEditingClassId(cls.id);
      setClassFormData({
          name: cls.name,
          grade: cls.grade,
          year: cls.year,
          shift: cls.shift,
          teacherId: cls.teacherId,
          status: cls.status
      });
      setIsClassModalOpen(true);
  };

  const handleDeleteClassClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm('Tem certeza que deseja excluir esta turma?')) {
          onDeleteClass(id);
      }
  };

  const generateId = () => {
    return typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormData.name || !classFormData.grade) return;

    const payload: ClassGroup = {
        id: editingClassId || generateId(),
        name: classFormData.name!,
        grade: classFormData.grade!,
        year: classFormData.year || new Date().getFullYear(),
        shift: classFormData.shift as any,
        teacherId: classFormData.teacherId || '',
        status: classFormData.status as any,
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
      status: studentFormData.status as any
    });

    setIsStudentModalOpen(false);
    setStudentFormData({ name: '', avatarUrl: '', registrationNumber: '', birthDate: '', parentName: '', phone: '', status: 'active' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#000039]">
            {activeClass ? activeClass.name : 'Minhas Turmas'}
          </h2>
          <p className="text-gray-500">
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
              className="bg-[#10898b] hover:bg-[#0d7274] text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#10898b]/20 transition-all transform hover:-translate-y-0.5 font-medium"
            >
              <Plus size={20} /> Nova Turma
            </button>
          ) : (
            <>
              <button 
                 onClick={() => onSelectClass('')}
                 className="px-4 py-2 text-[#000039] bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-medium flex items-center gap-2 transition-colors"
              >
                 <ArrowLeft size={16} /> Voltar
              </button>
              <button 
                onClick={() => setIsStudentModalOpen(true)}
                className="bg-[#10898b] hover:bg-[#0d7274] text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-[#10898b]/20 transition-all transform hover:-translate-y-0.5 font-medium"
              >
                <Plus size={18} /> Novo Aluno
              </button>
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
            // Padronizando cores para o tema Teal (#10898b)
            const borderColor = isRemediation ? 'border-t-orange-500' : 'border-t-[#10898b]';
            const iconBg = isRemediation ? 'bg-orange-100 text-orange-600' : 'bg-[#bfe4cd] text-[#10898b]';
            
            return (
              <div 
                key={cls.id}
                onClick={() => onSelectClass(cls.id)}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 border-t-4 ${borderColor} p-6 cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden`}
              >
                {cls.status === 'inactive' && (
                  <div className="absolute top-2 right-2 bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded font-medium uppercase tracking-wider">Arquivada</div>
                )}
                {isRemediation && (
                   <div className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider shadow-sm">Reforço</div>
                )}
                
                <div className="flex items-start justify-between mb-4 mt-2">
                  <div className={`p-3 rounded-xl transition-colors ${iconBg}`}>
                    <GraduationCap size={28} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded mb-1 font-mono border border-gray-100">
                      {cls.year}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase">{cls.shift}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-[#000039] mb-1 group-hover:text-[#10898b] transition-colors">{cls.name}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-1">{cls.grade}</p>
                
                <div className="flex items-center gap-2 mb-4 bg-gray-50 p-2 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-gray-200">
                        <UserIcon size={12} className="text-gray-400"/>
                    </div>
                    <span className="text-xs text-gray-600 font-medium truncate">{teacherName}</span>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center text-gray-500 text-sm font-medium">
                    <Users size={16} className="mr-2 text-[#10898b]" />
                    {studentCount} Alunos
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleEditClassClick(e, cls)} className="p-2 text-gray-400 hover:text-[#10898b] hover:bg-[#bfe4cd] rounded-full transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={(e) => handleDeleteClassClick(e, cls.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 size={16} />
                      </button>
                  </div>
                </div>
              </div>
            );
          })}
          {classes.length === 0 && (
            <div className="col-span-full py-16 px-4 text-center text-gray-400 bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-[#bfe4cd] transition-colors">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="text-gray-300" size={32} />
               </div>
               <h3 className="text-lg font-medium text-gray-600 mb-1">Nenhuma turma encontrada</h3>
               <p className="text-sm text-gray-400 mb-4">Comece criando sua primeira turma para gerenciar alunos.</p>
               <button 
                  onClick={() => { setEditingClassId(null); setIsClassModalOpen(true); }}
                  className="text-[#10898b] font-medium hover:underline"
               >
                  Criar Turma Agora
               </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase text-xs tracking-wider">Aluno</th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase text-xs tracking-wider">Matrícula</th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase text-xs tracking-wider">Responsável</th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase text-xs tracking-wider text-center">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-[#bfe4cd]/20 transition-colors cursor-pointer group"
                    onClick={() => onSelectStudent(student.id)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {student.avatarUrl ? (
                          <img src={student.avatarUrl} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#bfe4cd] flex items-center justify-center text-[#10898b] font-bold border border-[#bfe4cd]">
                            {student.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[#000039] group-hover:text-[#10898b] transition-colors">{student.name}</p>
                          <p className="text-xs text-gray-400">{new Date().getFullYear() - new Date(student.birthDate || '').getFullYear()} anos</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 text-sm font-mono">{student.registrationNumber || '-'}</td>
                    <td className="p-4 text-gray-600 text-sm">
                       <div>{student.parentName || '-'}</div>
                       <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone size={10} /> {student.phone}
                       </div>
                    </td>
                    <td className="p-4 text-center">
                       <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide border ${student.status === 'inactive' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                         {student.status === 'inactive' ? 'Inativo' : 'Ativo'}
                       </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#bfe4cd] group-hover:text-[#10898b] transition-all ml-auto">
                        <ChevronRight size={18} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500 flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <Users className="text-gray-300" />
                    </div>
                    <p>Nenhum aluno cadastrado nesta turma.</p>
                    <button 
                        onClick={() => setIsStudentModalOpen(true)}
                        className="mt-2 text-[#10898b] text-sm font-medium hover:underline"
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

      {/* MODAL: NOVA TURMA */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#bfe4cd]">
             {/* Header com Gradiente igual ao Login */}
             <div className="px-6 py-5 bg-gradient-to-r from-[#10898b] to-[#0d7274] flex justify-between items-center">
                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                   <GraduationCap className="text-[#bfe4cd]" /> 
                   {editingClassId ? 'Editar Turma' : 'Nova Turma'}
                </h3>
                <button onClick={() => setIsClassModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                    <X size={24} />
                </button>
             </div>
             
             <form onSubmit={handleCreateClass} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                   <div>
                      <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">Nome da Turma</label>
                      <input 
                        required
                        placeholder="Ex: 1º Ano A"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white placeholder-gray-400"
                        value={classFormData.name}
                        onChange={e => setClassFormData({...classFormData, name: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">Ano Letivo</label>
                      <input 
                        type="number"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                        value={classFormData.year}
                        onChange={e => setClassFormData({...classFormData, year: parseInt(e.target.value)})}
                      />
                   </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">Série / Grau</label>
                  <input 
                    required
                    placeholder="Ex: Ensino Fundamental I"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white placeholder-gray-400"
                    value={classFormData.grade}
                    onChange={e => setClassFormData({...classFormData, grade: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">Turno</label>
                    <select 
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent bg-gray-50 focus:bg-white transition-all text-[#000039]"
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
                    <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">Status</label>
                    <select 
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent bg-gray-50 focus:bg-white transition-all text-[#000039]"
                      value={classFormData.status}
                      onChange={e => setClassFormData({...classFormData, status: e.target.value as any})}
                    >
                      <option value="active">Ativa</option>
                      <option value="inactive">Inativa</option>
                    </select>
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">Professor Responsável</label>
                   <select 
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent bg-gray-50 focus:bg-white transition-all text-[#000039]"
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
                    <button type="submit" className="w-full bg-[#10898b] text-white py-3.5 rounded-xl font-bold hover:bg-[#0d7274] shadow-lg shadow-[#10898b]/20 transition-all transform hover:-translate-y-0.5">
                    {editingClassId ? 'Salvar Alterações' : 'Criar Turma'}
                    </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO ALUNO */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#bfe4cd]">
             {/* Header com Gradiente igual ao Login */}
             <div className="px-6 py-5 bg-gradient-to-r from-[#10898b] to-[#0d7274] flex justify-between items-center">
                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                   <Users className="text-[#bfe4cd]" />
                   Matricular Aluno
                </h3>
                <button onClick={() => setIsStudentModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                    <X size={24} />
                </button>
             </div>
             
             <form onSubmit={handleCreateStudent} className="p-8 space-y-5 max-h-[80vh] overflow-y-auto">
                
                <div className="flex items-center gap-4">
                   <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-[#10898b]/30 overflow-hidden relative group shrink-0">
                      {studentFormData.avatarUrl ? (
                        <img src={studentFormData.avatarUrl} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="text-[#10898b]" size={28} />
                      )}
                   </div>
                   <div className="flex-1">
                      <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">URL da Foto (Opcional)</label>
                      <input 
                        placeholder="https://..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white placeholder-gray-400"
                        value={studentFormData.avatarUrl}
                        onChange={e => setStudentFormData({...studentFormData, avatarUrl: e.target.value})}
                      />
                   </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">Nome Completo</label>
                  <input 
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                    value={studentFormData.name}
                    onChange={e => setStudentFormData({...studentFormData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                   <div>
                      <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">Matrícula</label>
                      <input 
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                        value={studentFormData.registrationNumber}
                        onChange={e => setStudentFormData({...studentFormData, registrationNumber: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">Nascimento</label>
                      <input 
                        type="date"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                        value={studentFormData.birthDate}
                        onChange={e => setStudentFormData({...studentFormData, birthDate: e.target.value})}
                      />
                   </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">Responsável</label>
                  <input 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                    value={studentFormData.parentName}
                    onChange={e => setStudentFormData({...studentFormData, parentName: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                   <div>
                      <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">Telefone</label>
                      <input 
                        placeholder="(00) 00000-0000"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                        value={studentFormData.phone}
                        onChange={e => setStudentFormData({...studentFormData, phone: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">Status</label>
                      <select 
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent bg-gray-50 focus:bg-white transition-all text-[#000039]"
                        value={studentFormData.status}
                        onChange={e => setStudentFormData({...studentFormData, status: e.target.value as any})}
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                      </select>
                   </div>
                </div>
                
                <div className="bg-[#bfe4cd]/20 p-4 rounded-xl border border-[#bfe4cd] text-sm text-[#0d7274] flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#10898b]"></div>
                   Turma selecionada: <strong>{activeClass?.name}</strong>
                </div>

                <div className="pt-2">
                    <button type="submit" className="w-full bg-[#10898b] text-white py-3.5 rounded-xl font-bold hover:bg-[#0d7274] shadow-lg shadow-[#10898b]/20 transition-all transform hover:-translate-y-0.5">
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