import React, { useState } from 'react';
import { Plus, Check, Clock, AlertTriangle, Filter, Search, Trash2, ClipboardCheck, X } from 'lucide-react';
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
  
  // Form State
  const [formClassId, setFormClassId] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formSkillId, setFormSkillId] = useState('');
  const [formStatus, setFormStatus] = useState<AssessmentStatus>(AssessmentStatus.EM_DESENVOLVIMENTO);
  const [formNotes, setFormNotes] = useState('');

  // Filtered Lists for View
  const filteredAssessments = assessments.filter(a => {
      if (filterClass === 'all') return true;
      const s = students.find(stud => stud.id === a.studentId);
      return s?.classId === filterClass;
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
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Superou</span>;
      case AssessmentStatus.EM_DESENVOLVIMENTO:
        return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">Em Desenv.</span>;
      case AssessmentStatus.NAO_ATINGIU:
        return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">Não Atingiu</span>;
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
          className="bg-[#10898b] hover:bg-[#0d7274] text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#10898b]/20 transition-all transform hover:-translate-y-0.5 font-medium"
        >
          <Plus size={18} /> Nova Avaliação
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
         <Filter size={18} className="text-gray-400" />
         <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-transparent outline-none text-[#000039] font-medium w-full"
         >
             <option value="all">Todas as Turmas</option>
             {classes.map(c => (
                 <option key={c.id} value={c.id}>{c.name}</option>
             ))}
         </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Aluno</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Habilidade</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Resultado</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredAssessments.slice().reverse().map(assessment => {
                    const student = students.find(s => s.id === assessment.studentId);
                    const skill = skills.find(s => s.id === assessment.skillId);
                    const classInfo = classes.find(c => c.id === student?.classId);

                    return (
                        <tr key={assessment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                                {new Date(assessment.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-4">
                                <div className="font-medium text-[#000039]">{student?.name || 'Desconhecido'}</div>
                                <div className="text-xs text-gray-500">{classInfo?.name}</div>
                            </td>
                            <td className="p-4">
                                <div className="text-sm text-[#10898b] font-mono bg-[#bfe4cd]/30 inline-block px-1 rounded mb-1">{skill?.code}</div>
                                <div className="text-xs text-gray-600 line-clamp-1" title={skill?.description}>{skill?.description}</div>
                            </td>
                            <td className="p-4 text-center">
                                {getStatusBadge(assessment.status)}
                            </td>
                            <td className="p-4 text-right">
                                {onDeleteAssessment && (
                                    <button 
                                        onClick={() => handleDelete(assessment.id)}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
            </table>
        </div>
        {filteredAssessments.length === 0 && (
             <div className="p-12 text-center text-gray-500">
                Nenhuma avaliação registrada com os filtros atuais.
            </div>
        )}
      </div>

      {/* MODAL DE AVALIAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#bfe4cd]">
             <div className="px-6 py-5 bg-gradient-to-r from-[#10898b] to-[#0d7274] flex justify-between items-center">
                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                   <ClipboardCheck className="text-[#bfe4cd]" />
                   Registrar Avaliação
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                   <X size={24} />
                </button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-5">
                
                <div>
                    <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">1. Selecione a Turma</label>
                    <select
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent bg-gray-50 focus:bg-white text-[#000039] transition-all"
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
                    <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">2. Selecione o Aluno</label>
                    <select
                        required
                        disabled={!formClassId}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 text-[#000039] transition-all"
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
                    <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">3. Selecione a Habilidade</label>
                    <select
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent bg-gray-50 focus:bg-white text-[#000039] transition-all"
                        value={formSkillId}
                        onChange={e => setFormSkillId(e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        {skills.map(s => (
                            <option key={s.id} value={s.id}>{s.code} - {s.subject}</option>
                        ))}
                    </select>
                    {formSkillId && (
                        <p className="text-xs bg-[#bfe4cd]/30 p-3 rounded-lg mt-2 text-[#000039] border border-[#bfe4cd]">
                            {skills.find(s => s.id === formSkillId)?.description}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#10898b] mb-2 ml-1">4. Resultado</label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                        { val: AssessmentStatus.NAO_ATINGIU, label: 'Não Atingiu', color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' },
                        { val: AssessmentStatus.EM_DESENVOLVIMENTO, label: 'Em Desenv.', color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' },
                        { val: AssessmentStatus.SUPEROU, label: 'Superou', color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' },
                        ].map((opt) => (
                        <button
                            key={opt.val}
                            type="button"
                            onClick={() => setFormStatus(opt.val)}
                            className={`border px-2 py-3 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            formStatus === opt.val ? 'ring-2 ring-[#10898b] ring-offset-1 scale-105 ' + opt.color : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            {opt.label}
                        </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">Observações (Opcional)</label>
                    <textarea 
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent bg-gray-50 focus:bg-white text-[#000039] resize-none h-24 transition-all"
                        value={formNotes}
                        onChange={e => setFormNotes(e.target.value)}
                        placeholder="Comentários sobre o desempenho..."
                    />
                </div>

                <div className="pt-2">
                    <button type="submit" className="w-full bg-[#10898b] text-white py-3.5 rounded-xl font-bold hover:bg-[#0d7274] shadow-lg shadow-[#10898b]/20 transition-all transform hover:-translate-y-0.5">
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