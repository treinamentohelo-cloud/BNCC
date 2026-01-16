import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, ClipboardList, PlusCircle, X, School } from 'lucide-react';
import { Assessment, AssessmentStatus, ClassGroup, Skill, Student } from '../types';

interface RemediationListProps {
  assessments: Assessment[];
  students: Student[];
  skills: Skill[];
  classes: ClassGroup[];
  onSelectStudent: (id: string) => void;
  onAddClass?: (c: ClassGroup) => void;
}

export const RemediationList: React.FC<RemediationListProps> = ({
  assessments,
  students,
  skills,
  classes,
  onSelectStudent,
  onAddClass
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  // Filter for remediation
  const remediationItems = assessments.filter(
    (a) => a.status === AssessmentStatus.NAO_ATINGIU || a.status === AssessmentStatus.EM_DESENVOLVIMENTO
  );

  // Group by Class for better organization
  const byClass = remediationItems.reduce((acc, item) => {
    const student = students.find(s => s.id === item.studentId);
    if (!student) return acc;
    
    const classGroup = classes.find(c => c.id === student.classId);
    if (!classGroup) return acc;

    const skill = skills.find(s => s.id === item.skillId);
    if (!skill) return acc;

    if (!acc[classGroup.id]) {
      acc[classGroup.id] = {
        classInfo: classGroup,
        items: []
      };
    }
    
    acc[classGroup.id].items.push({ student, skill, assessment: item });
    return acc;
  }, {} as Record<string, { classInfo: ClassGroup, items: { student: Student, skill: Skill, assessment: Assessment }[] }>);

  const handleCreateRemediationClass = () => {
    if(!newClassName || !onAddClass) return;

    const newClass: ClassGroup = {
        id: crypto.randomUUID(),
        name: newClassName,
        grade: 'Reforço Escolar',
        year: new Date().getFullYear(),
        shift: 'Integral', // Default
        status: 'active',
        isRemediation: true
    };

    onAddClass(newClass);

    setIsModalOpen(false);
    setNewClassName('');
    // Alerta movido para App.tsx para padronização de tratamento de erros
  };

  return (
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#000039] flex items-center gap-3">
                <AlertTriangle className="text-orange-500" />
                Plano de Reforço
            </h2>
            <p className="text-gray-500">
                Alunos que necessitam de intervenção pedagógica específica.
            </p>
          </div>
          {onAddClass && (
             <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all transform hover:-translate-y-0.5 font-medium"
             >
                <PlusCircle size={18} /> Criar Turma de Reforço
             </button>
          )}
        </div>

        {remediationItems.length === 0 ? (
           <div className="bg-green-50 border border-green-200 rounded-xl p-12 text-center">
              <ClipboardList className="mx-auto text-green-500 mb-4" size={48} />
              <h3 className="text-xl font-bold text-green-800 mb-2">Excelente!</h3>
              <p className="text-green-700">Nenhum aluno pendente para reforço no momento.</p>
           </div>
        ) : (
          Object.values(byClass).map(({ classInfo, items }) => (
            <div key={classInfo.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-lg">{classInfo.name}</h3>
                <span className="text-sm bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600">
                  {items.length} Casos
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map(({ student, skill, assessment }) => (
                  <div key={assessment.id} className="p-6 flex flex-col lg:flex-row gap-6 hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[80px]">
                       <div className="w-12 h-12 bg-[#bfe4cd] text-[#10898b] rounded-full flex items-center justify-center font-bold text-lg mb-2 overflow-hidden border border-[#10898b]/20">
                         {student.avatarUrl ? <img src={student.avatarUrl} className="w-full h-full object-cover"/> : student.name.charAt(0)}
                       </div>
                       <button 
                         onClick={() => onSelectStudent(student.id)}
                         className="text-xs text-[#10898b] font-medium hover:underline"
                       >
                         Ver Perfil
                       </button>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                         <h4 className="font-bold text-gray-900">{student.name}</h4>
                         <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                            assessment.status === AssessmentStatus.NAO_ATINGIU 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-amber-100 text-amber-700'
                         }`}>
                           {assessment.status === AssessmentStatus.NAO_ATINGIU ? 'Não Atingiu' : 'Em Desenv.'}
                         </span>
                      </div>
                      <div className="text-sm text-gray-600">
                         <span className="font-mono bg-gray-100 px-1 rounded mr-2 text-xs">{skill.code}</span>
                         {skill.description}
                      </div>
                      {assessment.notes && (
                         <div className="bg-red-50 text-red-800 text-sm p-3 rounded-lg border border-red-100 mt-2">
                            <strong>Diagnóstico:</strong> {assessment.notes}
                         </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-center items-end min-w-[140px]">
                       <span className="text-xs text-gray-400 mb-2">Avaliado em {new Date(assessment.date).toLocaleDateString()}</span>
                       <button 
                         onClick={() => onSelectStudent(student.id)}
                         className="flex items-center gap-1 text-sm bg-[#bfe4cd]/30 text-[#10898b] px-4 py-2 rounded-lg hover:bg-[#bfe4cd] transition-colors font-medium"
                       >
                         Reavaliar <ArrowRight size={14} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Modal Nova Turma de Reforço - Estilo Padronizado */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-[#bfe4cd]">
                    <div className="px-6 py-5 bg-gradient-to-r from-[#10898b] to-[#0d7274] flex justify-between items-center">
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                           <School className="text-[#bfe4cd]" size={20} />
                           Nova Turma de Reforço
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                           <X size={24} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#10898b] mb-1.5 ml-1">Nome da Turma</label>
                            <input 
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#10898b] focus:border-transparent transition-all text-[#000039] bg-gray-50 focus:bg-white"
                                placeholder="Ex: Reforço Matemática"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                            />
                        </div>
                        
                        <div className="pt-2 flex gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleCreateRemediationClass} 
                                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all transform hover:-translate-y-0.5"
                            >
                                Criar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};