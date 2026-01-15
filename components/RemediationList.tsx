import React from 'react';
import { AlertTriangle, ArrowRight, ClipboardList } from 'lucide-react';
import { Assessment, AssessmentStatus, ClassGroup, Skill, Student } from '../types';

interface RemediationListProps {
  assessments: Assessment[];
  students: Student[];
  skills: Skill[];
  classes: ClassGroup[];
  onSelectStudent: (id: string) => void;
}

export const RemediationList: React.FC<RemediationListProps> = ({
  assessments,
  students,
  skills,
  classes,
  onSelectStudent
}) => {
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

  return (
    <div className="space-y-8">
       <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
             <AlertTriangle className="text-red-500" />
             Plano de Reforço
          </h2>
          <p className="text-gray-500">
            Alunos que necessitam de intervenção pedagógica específica baseada nos registros da BNCC.
          </p>
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
                       <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-lg mb-2">
                         {student.name.charAt(0)}
                       </div>
                       <button 
                         onClick={() => onSelectStudent(student.id)}
                         className="text-xs text-indigo-600 font-medium hover:underline"
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
                         className="flex items-center gap-1 text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
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
    </div>
  );
};
