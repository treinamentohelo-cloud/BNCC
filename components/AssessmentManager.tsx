import React, { useState } from 'react';
import { Plus, Check, Clock, AlertTriangle, Filter, Search, Trash2, ClipboardCheck, X, Calendar, User, BookOpen } from 'lucide-react';
import { Assessment, AssessmentStatus, ClassGroup, Skill, Student } from '../types';

interface AssessmentManagerProps {
  assessments: Assessment[];
  students: Student[];
  classes: ClassGroup[];
  skills: Skill[];
  onAddAssessment: (a: Assessment) => void;
  onDeleteAssessment?: (id: string) => void;
}

export const AssessmentManager: React.FC<AssessmentManagerProps> = ({
  assessments,
  students,
  classes,
  skills,
  onAddAssessment,
  onDeleteAssessment
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterClass, setFilterClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formClassId, setFormClassId] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formSkillId, setFormSkillId] = useState('');
  const [formStatus, setFormStatus] = useState<AssessmentStatus>(AssessmentStatus.EM_DESENVOLVIMENTO);
  const [formNotes, setFormNotes] = useState('');

  // Filtered Lists for View
  const filteredAssessments = assessments.filter(a => {
      const student = students.find(stud => stud.id === a.studentId);
      const skill = skills.find(s => s.id === a.skillId);
      
      const matchesClass = filterClass === 'all' || student?.classId === filterClass;
      const matchesSearch = searchTerm === '' || 
                            student?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            skill?.code.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesClass && matchesSearch;
  });

  // Derived Lists for Form
  const studentsInSelectedClass = students.filter(s => s.classId === formClassId);

  const handleDelete = (id: string) => {
    if(onDeleteAssessment && window.confirm('Deseja excluir esta avaliação?')) {
        onDeleteAssessment(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formSkillId) return;

    onAddAssessment({
        id: crypto.randomUUID(),
        studentId: formStudentId,
        skillId: formSkillId,
        date: new Date().toISOString().split('T')[0],
        status: formStatus,
        notes: formNotes
    });

    setIsModalOpen(false);
    // Reset but keep class selected for easier consecutive entry
    setFormStudentId('');
    setFormStatus(AssessmentStatus.EM_DESENVOLVIMENTO);
    setFormNotes('');
  };

  const getStatusBadge = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.SUPEROU:
        return (
          <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <Check size={12} /> Superou
          </span>
        );
      case AssessmentStatus.ATINGIU:
        return (
            <span className="flex items-center gap-1 bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <Check size={12} /> Atingiu
            </span>
        );
      case AssessmentStatus.EM_DESENVOLVIMENTO:
        return (
          <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <Clock size={12} /> Em Desenv.
          </span>
        );
      case AssessmentStatus.NAO_ATINGIU:
        return (
          <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <AlertTriangle size={12} /> Não Atingiu
          </span>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-[#000039]">Avaliações</h2>
           <p className="text-gray-500">Histórico e registro de desempenho</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#c48b5e] hover:bg-[#a0704a] text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#c48b5e]/20 transition-all transform hover:-translate-y-0.5 font-medium"
        >
          <Plus size={18} /> Nova Avaliação
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
             <input 
                type="text"
                placeholder="Buscar por aluno ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#c48b5e] outline-none text-[#000039]"
             />
         </div>
         <div className="w-full md:w-64 relative">
             <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
             <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#c48b5e] outline-none appearance-none bg-white text-[#000039]"
             >
                 <option value="all">Todas as Turmas</option>
                 {classes.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                 ))}
             </select>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssessments.slice().reverse().map(assessment => {
            const student = students.find(s => s.id === assessment.studentId);
            const skill = skills.find(s => s.id === assessment.skillId);
            const classInfo = classes.find(c => c.id === student?.classId);

            return (
                <div key={assessment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all p-5 relative group flex flex-col justify-between h-full">
                    {/* Header: Date & Status */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="bg-gray-50 text-gray-500 text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(assessment.date).toLocaleDateString('pt-BR')}
                        </div>
                        {getStatusBadge(assessment.status)}
                    </div>

                    {/* Body: Student & Skill Info */}
                    <div className="mb-4">
                        <div className="flex items-center gap-3 mb-3">
                             <div className="w-10 h-10 rounded-full bg-[#eaddcf] flex items-center justify-center text-[#c48b5e] font-bold shrink-0">
                                 {student?.name.charAt(0)}
                             </div>
                             <div>
                                 <h4 className="font-bold text-[#000039] leading-tight line-clamp-1" title={student?.name}>
                                     {student?.name || 'Aluno Desconhecido'}
                                 </h4>
                                 <p className="text-xs text-gray-500">{classInfo?.name}</p>
                             </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                             <div className="flex items-center gap-2 mb-1">
                                 <BookOpen size={14} className="text-[#c48b5e]" />
                                 <span className="font-mono text-xs font-bold text-[#c48b5e] bg-[#eaddcf]/30 px-1.5 rounded">{skill?.code}</span>
                             </div>
                             <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed" title={skill?.description}>
                                 {skill?.description}
                             </p>
                        </div>
                    </div>

                    {/* Footer: Delete Action */}
                    <div className="mt-auto pt-3 border-t border-gray-50 flex justify-end">
                        {onDeleteAssessment && (
                            <button 
                                onClick={() => handleDelete(assessment.id)}
                                className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={14} /> Excluir
                            </button>
                        )}
                    </div>
                </div>
            );
        })}
        {filteredAssessments.length === 0 && (
             <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <ClipboardCheck className="text-gray-300" size={24} />
                </div>
                Nenhuma avaliação encontrada com os filtros atuais.
            </div>
        )}
      </div>

      {/* MODAL DE AVALIAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#eaddcf]">
             <div className="px-6 py-5 bg-gradient-to-r from-[#c48b5e] to-[#a0704a] flex justify-between items-center">
                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                   <ClipboardCheck className="text-[#eaddcf]" />
                   Registrar Avaliação
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                   <X size={24} />
                </button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-5">
                
                <div>
                    <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">1. Selecione a Turma</label>
                    <select
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent bg-gray-50 focus:bg-white text-[#000039] transition-all"
                        value={formClassId}
                        onChange={e => { setFormClassId(e.target.value); setFormStudentId(''); }}
                    >
                        <option value="">Selecione...</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">2. Selecione o Aluno</label>
                    <select
                        required
                        disabled={!formClassId}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 text-[#000039] transition-all"
                        value={formStudentId}
                        onChange={e => setFormStudentId(e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        {studentsInSelectedClass.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">3. Selecione a Habilidade</label>
                    <select
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent bg-gray-50 focus:bg-white text-[#000039] transition-all"
                        value={formSkillId}
                        onChange={e => setFormSkillId(e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        {skills.map(s => (
                            <option key={s.id} value={s.id}>{s.code} - {s.subject}</option>
                        ))}
                    </select>
                    {formSkillId && (
                        <p className="text-xs bg-[#eaddcf]/30 p-3 rounded-lg mt-2 text-[#000039] border border-[#eaddcf]">
                            {skills.find(s => s.id === formSkillId)?.description}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#c48b5e] mb-2 ml-1">4. Resultado</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                        { val: AssessmentStatus.NAO_ATINGIU, label: 'Não Atingiu', color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' },
                        { val: AssessmentStatus.EM_DESENVOLVIMENTO, label: 'Em Desenv.', color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' },
                        { val: AssessmentStatus.ATINGIU, label: 'Atingiu', color: 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100' },
                        { val: AssessmentStatus.SUPEROU, label: 'Superou', color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' },
                        ].map((opt) => (
                        <button
                            key={opt.val}
                            type="button"
                            onClick={() => setFormStatus(opt.val)}
                            className={`border px-1 py-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-sm ${
                            formStatus === opt.val ? 'ring-2 ring-[#c48b5e] ring-offset-1 scale-105 ' + opt.color : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            {opt.label}
                        </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Observações (Opcional)</label>
                    <textarea 
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent bg-gray-50 focus:bg-white text-[#000039] resize-none h-24 transition-all"
                        value={formNotes}
                        onChange={e => setFormNotes(e.target.value)}
                        placeholder="Comentários sobre o desempenho..."
                    />
                </div>

                <div className="pt-2">
                    <button type="submit" className="w-full bg-[#c48b5e] text-white py-3.5 rounded-xl font-bold hover:bg-[#a0704a] shadow-lg shadow-[#c48b5e]/20 transition-all transform hover:-translate-y-0.5">
                    Salvar Avaliação
                    </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};