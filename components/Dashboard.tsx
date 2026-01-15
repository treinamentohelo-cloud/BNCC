import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { Users, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { Assessment, AssessmentStatus, ClassGroup, Skill, Student, User } from '../types';

interface DashboardProps {
  classes: ClassGroup[];
  students: Student[];
  assessments: Assessment[];
  skills: Skill[];
  currentUser: User | null;
  onNavigateToRemediation: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  classes, 
  students, 
  assessments, 
  skills,
  currentUser,
  onNavigateToRemediation 
}) => {

  // Metrics
  const totalStudents = students.length;
  const totalSkills = skills.length;
  const remediationCases = assessments.filter(a => a.status !== AssessmentStatus.SUPEROU).length;
  const successCases = assessments.filter(a => a.status === AssessmentStatus.SUPEROU).length;

  // Pie Chart Data
  const pieData = [
    { name: 'Superou', value: successCases, color: '#10B981' }, // Green
    { name: 'Em Desenv.', value: assessments.filter(a => a.status === AssessmentStatus.EM_DESENVOLVIMENTO).length, color: '#F59E0B' }, // Amber
    { name: 'Não Atingiu', value: assessments.filter(a => a.status === AssessmentStatus.NAO_ATINGIU).length, color: '#EF4444' }, // Red
  ];

  // Bar Chart Data (Performance by Subject)
  const subjectPerformance = skills.reduce((acc, skill) => {
    const skillAssessments = assessments.filter(a => a.skillId === skill.id);
    if (skillAssessments.length === 0) return acc;

    if (!acc[skill.subject]) {
      acc[skill.subject] = { subject: skill.subject, superou: 0, total: 0 };
    }
    
    acc[skill.subject].total += skillAssessments.length;
    acc[skill.subject].superou += skillAssessments.filter(a => a.status === AssessmentStatus.SUPEROU).length;
    return acc;
  }, {} as Record<string, { subject: string, superou: number, total: number }>);

  const barData = Object.values(subjectPerformance).map((item: { subject: string, superou: number, total: number }) => ({
    name: item.subject,
    taxa: Math.round((item.superou / item.total) * 100)
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Olá, {currentUser?.name.split(' ')[0] || 'Professor(a)'}! 👋
          </h2>
          <p className="text-gray-500">
             Bem-vindo ao painel de controle pedagógico.
             {currentUser?.role === 'admin' && <span className="text-indigo-600 font-medium ml-1">(Administrador)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-4 py-2 rounded-full">
            Ano Letivo 2024
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Total de Alunos" 
          value={totalStudents} 
          icon={<Users className="text-blue-600" />} 
          color="bg-blue-50"
        />
        <KpiCard 
          title="Habilidades BNCC" 
          value={totalSkills} 
          icon={<BookOpen className="text-indigo-600" />} 
          color="bg-indigo-50"
        />
        <KpiCard 
          title="Casos de Reforço" 
          value={remediationCases} 
          icon={<AlertCircle className="text-red-600" />} 
          color="bg-red-50"
          onClick={onNavigateToRemediation}
          isActionable
        />
        <KpiCard 
          title="Habilidades Superadas" 
          value={successCases} 
          icon={<CheckCircle className="text-green-600" />} 
          color="bg-green-50"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Distribuição de Desempenho</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Taxa de Sucesso por Disciplina (%)</h3>
          <div className="h-64">
             {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="taxa" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} name="Taxa de 'Superou'" />
                  </BarChart>
                </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-gray-400">
                 Sem dados suficientes
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  color: string;
  onClick?: () => void;
  isActionable?: boolean;
}> = ({ title, value, icon, color, onClick, isActionable }) => (
  <div 
    onClick={onClick}
    className={`p-6 rounded-xl shadow-sm border border-gray-100 bg-white flex items-center justify-between transition-all ${isActionable ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
  >
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      {icon}
    </div>
  </div>
);