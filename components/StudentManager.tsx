import React, { useState } from 'react';
import { Plus, Search, Camera, Filter, User, Calendar, Phone, Hash, Edit2, Trash2, Upload, X } from 'lucide-react';
import { Student, ClassGroup } from '../types';

interface StudentManagerProps {
  students: Student[];
  classes: ClassGroup[];
  onAddStudent: (s: Student) => void;
  onUpdateStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
  onSelectStudent: (id: string) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({ 
  students, 
  classes, 
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onSelectStudent 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    classId: '',
    avatarUrl: '',
    registrationNumber: '',
    birthDate: '',
    parentName: '',
    phone: '',
    status: 'active'
  });

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.registrationNumber && s.registrationNumber.includes(searchTerm));
    const matchesClass = filterClass === 'all' || s.classId === filterClass;
    return matchesSearch && matchesClass;
  });

  const resetForm = () => {
    setFormData({ 
        name: '', classId: '', avatarUrl: '', registrationNumber: '', 
        birthDate: '', parentName: '', phone: '', status: 'active' 
    });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleEditClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    setEditingId(student.id);
    setFormData({
        name: student.name,
        classId: student.classId,
        avatarUrl: student.avatarUrl,
        registrationNumber: student.registrationNumber,
        birthDate: student.birthDate,
        parentName: student.parentName,
        phone: student.phone,
        status: student.status
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm('Tem certeza que deseja excluir este aluno?')) {
        onDeleteStudent(id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.classId) {
        alert("Nome e Turma são obrigatórios");
        return;
    }

    const payload: Student = {
      id: editingId || crypto.randomUUID(),
      name: formData.name!,
      classId: formData.classId!,
      avatarUrl: formData.avatarUrl,
      registrationNumber: formData.registrationNumber,
      birthDate: formData.birthDate,
      parentName: formData.parentName,
      phone: formData.phone,
      status: formData.status as any
    };

    if (editingId) {
        onUpdateStudent(payload);
    } else {
        onAddStudent(payload);
    }

    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-[#000039]">Alunos</h2>
           <p className="text-gray-500">Gestão de matrículas e cadastros</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-[#10898b] hover:bg-[#0d7274] text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#10898b]/20 transition-all transform hover:-translate-y-0.5 font-medium"
        >
          <Plus size={20} /> Cadastrar Aluno
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nome ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10898b] outline-none text-[#000039]"
            />
        </div>
        <div className="w-full md:w-64 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select 
               value={filterClass}
               onChange={(e) => setFilterClass(e.target.value)}
               className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#10898b] outline-none appearance-none bg-white text-[#000039]"
            >
                <option value="all">Todas as Turmas</option>
                {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Aluno</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Turma</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contato</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.map(student => {
                const studentClass = classes.find(c => c.id === student.classId);
                return (
                  <tr 
                    key={student.id} 
                    className="hover:bg-[#bfe4cd]/20 transition-colors cursor-pointer"
                    onClick={() => onSelectStudent(student.id)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-[#bfe4cd] flex items-center justify-center text-[#10898b] font-bold">
                            {student.name.charAt(0)}
                            </div>
                        )}
                        <div>
                          <p className="font-medium text-[#000039]">{student.name}</p>
                          <p className="text-xs text-gray-500 font-mono">Mat: {student.registrationNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                        {studentClass ? (
                            <span className="bg-[#bfe4cd] text-[#10898b] px-2 py-1 rounded-md text-xs font-medium">
                                {studentClass.name}
                            </span>
                        ) : (
                            <span className="text-gray-400 italic">Sem turma</span>
                        )}
                    </td>
                    <td className="p-4">
                        <div className="text-sm text-gray-600">{student.parentName || '-'}</div>
                        <div className="text-xs text-gray-400">{student.phone || '-'}</div>
                    </td>
                    <td className="p-4 text-center">
                        <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${student.status === 'inactive' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'}`}>
                         {student.status === 'inactive' ? 'Inativo' : 'Ativo'}
                       </span>
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                             <button 
                                onClick={(e) => handleEditClick(e, student)}
                                className="p-2 text-gray-400 hover:text-[#10898b] hover:bg-[#bfe4cd] rounded-lg transition-colors"
                             >
                                <Edit2 size={16} />
                             </button>
                             <button 
                                onClick={(e) => handleDeleteClick(e, student.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                             >
                                <Trash2 size={16} />
                             </button>
                        </div>
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
        {filteredStudents.length === 0 && (
            <div className="p-12 text-center text-gray-500">
                Nenhum aluno encontrado.
            </div>
        )}
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#bfe4cd]">
             {/* Header com Gradiente igual ao Login */}
             <div className="px-6 py-5 bg-gradient-to-r from-[#10898b] to-[#0d7274] flex justify-between items-center">
                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                   <User className="text-[#bfe4cd]" />
                   {editingId ? 'Editar Aluno' : 'Novo Cadastro de Aluno'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                    <X size={24} />
                </button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Coluna Esquerda: Foto */}
                    <div className="flex flex-col items-center gap-3">
                         <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-[#10898b]/30 overflow-hidden relative group">
                            {formData.avatarUrl ? (
                                <img src={formData.avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="text-[#10898b] w-8 h-8" />
                            )}
                            <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <Upload className="text-white" size={20} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                         </div>
                         <div className="w-full text-center">
                            <label className="text-xs text-[#10898b] font-bold cursor-pointer hover:underline">
                                Alterar Foto
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                         </div>
                    </div>

                    {/* Coluna Direita: Dados Principais */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#10898b] mb-1.5 flex items-center gap-1">
                                <User size={14} /> Nome Completo
                            </label>
                            <input 
                                required
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#10898b] mb-1.5 flex items-center gap-1">
                                    <Hash size={14} /> Matrícula
                                </label>
                                <input 
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                                    value={formData.registrationNumber}
                                    onChange={e => setFormData({...formData, registrationNumber: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#10898b] mb-1.5 flex items-center gap-1">
                                    <Calendar size={14} /> Nascimento
                                </label>
                                <input 
                                    type="date"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                                    value={formData.birthDate}
                                    onChange={e => setFormData({...formData, birthDate: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-[#10898b] mb-1.5">Turma</label>
                            <select 
                                required
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                                value={formData.classId}
                                onChange={e => setFormData({...formData, classId: e.target.value})}
                            >
                                <option value="">Selecione a turma...</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} - {c.grade}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <h4 className="font-bold text-[#000039] mb-4 text-lg">Informações de Contato</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-[#10898b] mb-1.5">Responsável Legal</label>
                            <input 
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                                value={formData.parentName}
                                onChange={e => setFormData({...formData, parentName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#10898b] mb-1.5 flex items-center gap-1">
                                <Phone size={14} /> Telefone
                            </label>
                            <input 
                                placeholder="(00) 00000-0000"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#10898b] mb-1.5">Status da Matrícula</label>
                            <select 
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                                value={formData.status}
                                onChange={e => setFormData({...formData, status: e.target.value as any})}
                            >
                                <option value="active">Ativo</option>
                                <option value="inactive">Inativo</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <button type="submit" className="w-full bg-[#10898b] text-white py-3.5 rounded-xl font-bold hover:bg-[#0d7274] shadow-lg shadow-[#10898b]/20 transition-all transform hover:-translate-y-0.5">
                    {editingId ? 'Salvar Alterações' : 'Confirmar Matrícula'}
                    </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};