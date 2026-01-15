import React from 'react';
import { ChevronRight, Users, GraduationCap } from 'lucide-react';
import { ClassGroup, Student } from '../types';

interface ClassListProps {
  classes: ClassGroup[];
  students: Student[];
  selectedClassId?: string;
  onSelectClass: (id: string) => void;
  onSelectStudent: (id: string) => void;
}

export const ClassList: React.FC<ClassListProps> = ({ 
  classes, 
  students, 
  selectedClassId, 
  onSelectClass,
  onSelectStudent
}) => {

  const activeClass = selectedClassId ? classes.find(c => c.id === selectedClassId) : null;
  const filteredStudents = selectedClassId 
    ? students.filter(s => s.classId === selectedClassId) 
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            {activeClass ? `Alunos: ${activeClass.name}` : 'Minhas Turmas'}
          </h2>
          <p className="text-gray-500">
            {activeClass 
              ? `${activeClass.grade} • ${filteredStudents.length} Alunos matriculados`
              : 'Selecione uma turma para gerenciar avaliações'
            }
          </p>
        </div>
        {activeClass && (
           <button 
             onClick={() => onSelectClass('')} // Go back effectively (parent handles this logic by strict routing, but here we just need to clear selection if we wanted a back button inside component)
             className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hidden"
           >
             Voltar para Turmas
           </button>
        )}
      </div>

      {!activeClass ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const studentCount = students.filter(s => s.classId === cls.id).length;
            return (
              <div 
                key={cls.id}
                onClick={() => onSelectClass(cls.id)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-all hover:border-indigo-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-indigo-50 p-3 rounded-lg group-hover:bg-indigo-100 transition-colors">
                    <GraduationCap className="text-indigo-600" size={24} />
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    {cls.year}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">{cls.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{cls.grade}</p>
                <div className="flex items-center text-gray-400 text-sm">
                  <Users size={16} className="mr-2" />
                  {studentCount} Alunos
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-sm font-semibold text-gray-600">Nome do Aluno</th>
                <th className="p-4 text-sm font-semibold text-gray-600">ID</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onSelectStudent(student.id)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800">{student.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 text-sm">#{student.id.toUpperCase()}</td>
                    <td className="p-4 text-right">
                      <button className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    Nenhum aluno cadastrado nesta turma.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
