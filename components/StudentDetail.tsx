import React, { useState } from 'react';
import { ArrowLeft, PlusCircle, Check, AlertTriangle, Clock, ClipboardCheck, X, Star } from 'lucide-react';
import { Assessment, AssessmentStatus, Skill, Student, ClassGroup } from '../types';

interface StudentDetailProps {
  studentId: string;
  students: Student[];
  skills: Skill[];
  assessments: Assessment[];
  classes?: ClassGroup[];
  onAddAssessment: (a: Assessment) => void;
  onBack: () => void;
}

export const StudentDetail: React.FC<StudentDetailProps> = ({
  studentId,
  students,
  skills,
  assessments,
  classes = [],
  onAddAssessment,
  onBack
}) => {
  const student = students.find(s => s.id === studentId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [status, setStatus] = useState<AssessmentStatus>(AssessmentStatus.EM_DESENVOLVIMENTO);
  const [notes, setNotes] = useState('');

  if (!student) return null;

  const studentClass = classes.find(c => c.id === student.classId);
  const focusSkillsIds = studentClass?.focusSkills || [];

  const studentAssessments = assessments.filter(a => a.studentId === studentId);

  // Group assessments by Subject
  const assessmentsBySubject = skills.reduce((acc, skill) => {
    const assessment = studentAssessments.find(a => a.skillId === skill.id);
    if (!acc[skill.subject]) acc[skill.subject] = [];
    
    acc[skill.subject].push({
      skill,
      assessment
    });
    return acc;
  }, {} as Record<string, { skill: Skill, assessment?: Assessment }[]>);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) return;

    const newAssessment: Assessment = {
      id: crypto.randomUUID(),
      studentId,
      skillId: selectedSkillId,
      date: new Date().toISOString().split('T')[0],
      status,
      notes
    };

    onAddAssessment(newAssessment);
    setIsModalOpen(false);
    // Reset form
    setSelectedSkillId('');
    setStatus(AssessmentStatus.EM_DESENVOLVIMENTO);
    setNotes('');
  };

  const getStatusBadge = (status?: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.SUPEROU:
        return (
          <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
            <Check size={12} /> Superou
          </span>
        );
      case AssessmentStatus.ATINGIU:
        return (
            <span className="flex items-center gap-1 bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-bold">
            <Check size={12} /> Atingiu
            </span>
        );
      case AssessmentStatus.EM_DESENVOLVIMENTO:
        return (
          <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
            <Clock size={12} /> Em Desenv.
          </span>
        );
      case AssessmentStatus.NAO_ATINGIU:
        return (
          <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
            <AlertTriangle size={12} /> Não Atingiu
          </span>
        );
      default:
        return <span className="text-gray-400 text-xs">Não Avaliado</span>;
    }
  };

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center text-gray-500 hover:text-[#c48b5e] transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Voltar para a Turma
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#eaddcf] text-[#c48b5e] flex items-center justify-center text-2xl font-bold">
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-gray-500">Histórico de Desenvolvimento</p>
            {studentClass && (
                 <p className="text-xs text-[#c48b5e] mt-1 font-medium bg-[#eaddcf]/30 px-2 py-0.5 rounded inline-block">
                    {studentClass.name}
                 </p>
            )}
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-[#c48b5e] hover:bg-[#a0704a] text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <PlusCircle size={18} className="mr-2" />
          Nova Avaliação
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {Object.entries(assessmentsBySubject).map(([subject, items]: [string, { skill: Skill, assessment?: Assessment }[]]) => (
          <div key={subject} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 font-semibold text-gray-700">
              {subject}
            </div>
            <div className="divide-y divide-gray-100">
              {items.map(({ skill, assessment }) => {
                const isFocus = focusSkillsIds.includes(skill.id);
                return (
                  <div key={skill.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${isFocus ? 'bg-[#c48b5e] text-white border-[#c48b5e]' : 'bg-indigo-50 text-[#c48b5e] border-[#eaddcf]'}`}>
                          {skill.code}
                        </span>
                        {isFocus && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><Star size={8} fill="currentColor" /> Foco</span>}
                        {getStatusBadge(assessment?.status)}
                      </div>
                      <p className="text-gray-800 text-sm">{skill.description}</p>
                      {assessment?.notes && (
                        <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded inline-block border border-red-100">
                          <strong>Obs:</strong> {assessment.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right min-w-[100px]">
                      <span className="text-xs text-gray-400">
                        {assessment ? new Date(assessment.date).toLocaleDateString('pt-BR') : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Evaluation Modal - Standardized Style */}
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
                <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Habilidade BNCC</label>
                <select 
                  required
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                >
                  <option value="">Selecione a habilidade...</option>
                  {skills.map(s => {
                    const isFocus = focusSkillsIds.includes(s.id);
                    return (
                      <option key={s.id} value={s.id} className={isFocus ? 'font-bold text-[#c48b5e]' : ''}>
                        {isFocus ? '★ ' : ''}{s.code} - {s.subject} {isFocus ? '(Foco da Turma)' : ''}
                      </option>
                    );
                  })}
                </select>
                {selectedSkillId && (
                  <p className="mt-2 text-xs text-gray-600 bg-[#eaddcf]/20 p-3 rounded-lg border border-[#eaddcf]">
                    {skills.find(s => s.id === selectedSkillId)?.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Nível de Desempenho</label>
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
                      onClick={() => setStatus(opt.val)}
                      className={`border px-1 py-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-sm ${
                        status === opt.val ? 'ring-2 ring-[#c48b5e] ring-offset-1 scale-105 ' + opt.color : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {(status !== AssessmentStatus.SUPEROU && status !== AssessmentStatus.ATINGIU) && (
                 <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <p className="text-xs text-amber-800 flex items-start gap-2">
                       <AlertTriangle size={14} className="mt-0.5" />
                       O aluno será incluído na lista de <strong>Reforço Escolar</strong>.
                    </p>
                 </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Observações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white h-24 resize-none"
                  placeholder="Detalhes sobre o desempenho..."
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-[#c48b5e] text-white py-3.5 rounded-xl font-bold hover:bg-[#a0704a] shadow-lg shadow-[#c48b5e]/20 transition-all transform hover:-translate-y-0.5"
                >
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