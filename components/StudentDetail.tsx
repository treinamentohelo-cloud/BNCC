import React, { useState } from 'react';
import { ArrowLeft, PlusCircle, Check, AlertTriangle, Clock } from 'lucide-react';
import { Assessment, AssessmentStatus, Skill, Student } from '../types';

interface StudentDetailProps {
  studentId: string;
  students: Student[];
  skills: Skill[];
  assessments: Assessment[];
  onAddAssessment: (a: Assessment) => void;
  onBack: () => void;
}

export const StudentDetail: React.FC<StudentDetailProps> = ({
  studentId,
  students,
  skills,
  assessments,
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
      id: Date.now().toString(),
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
        className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Voltar para a Turma
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-gray-500">Histórico de Desenvolvimento</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
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
              {items.map(({ skill, assessment }) => (
                <div key={skill.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-mono px-2 py-0.5 rounded">
                        {skill.code}
                      </span>
                      {getStatusBadge(assessment?.status)}
                    </div>
                    <p className="text-gray-800 text-sm">{skill.description}</p>
                    {assessment?.notes && (
                      <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded inline-block">
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
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Evaluation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Registrar Avaliação</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-2xl">×</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Habilidade BNCC</label>
                <select 
                  required
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="">Selecione a habilidade...</option>
                  {skills.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.subject}
                    </option>
                  ))}
                </select>
                {selectedSkillId && (
                  <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {skills.find(s => s.id === selectedSkillId)?.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Desempenho</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: AssessmentStatus.NAO_ATINGIU, label: 'Não Atingiu', color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' },
                    { val: AssessmentStatus.EM_DESENVOLVIMENTO, label: 'Em Desenv.', color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' },
                    { val: AssessmentStatus.SUPEROU, label: 'Superou', color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setStatus(opt.val)}
                      className={`border px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                        status === opt.val ? 'ring-2 ring-indigo-500 ring-offset-1 ' + opt.color : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {status !== AssessmentStatus.SUPEROU && (
                 <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-800 flex items-start gap-2">
                       <AlertTriangle size={14} className="mt-0.5" />
                       Este aluno será automaticamente adicionado à lista de <strong>Reforço Escolar</strong> para esta habilidade.
                    </p>
                 </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações (Opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm h-24 resize-none"
                  placeholder="Detalhes sobre a dificuldade encontrada..."
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors"
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