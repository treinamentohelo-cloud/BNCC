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
    { name: 'Superou', value: successCases, color: '#10B981' }, // Green (mantido semântico)
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
      <div className="bg-gradient-to-r from-white to-[#bfe4cd]/20 p-6 rounded-xl shadow-sm border border-[#bfe4cd] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Olá, {currentUser?.name.split(' ')[0] || 'Professor(a)'}! 👋
          </h2>
          <p className="text-gray-500">
             Bem-vindo ao painel de controle pedagógico.
             {currentUser?.role === 'admin' && <span className="text-[#10898b] font-medium ml-1">(Administrador)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-white border border-[#bfe4cd] text-[#10898b] text-sm font-semibold px-4 py-2 rounded-full shadow-sm">
            Ano Letivo {new Date().getFullYear()}
          </span>
        </div>
      </div>

      {/* KPI Cards - Coloridos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Total de Alunos" 
          value={totalStudents} 
          icon={<Users className="text-white" size={24} />} 
          gradient="bg-[#10898b]" // Usando cor sólida da marca para destaque principal
        />
        <KpiCard 
          title="Habilidades BNCC" 
          value={totalSkills} 
          icon={<BookOpen className="text-white" size={24} />} 
          gradient="bg-[#0d7274]"
        />
        <KpiCard 
          title="Casos de Reforço" 
          value={remediationCases} 
          icon={<AlertCircle className="text-white" size={24} />} 
          gradient="bg-orange-500" // Mantido laranja para alerta
          onClick={onNavigateToRemediation}
          isActionable
        />
        <KpiCard 
          title="Habilidades Superadas" 
          value={successCases} 
          icon={<CheckCircle className="text-white" size={24} />} 
          gradient="bg-[#10b981]" // Mantido verde para sucesso
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
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

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Taxa de Sucesso por Disciplina (%)</h3>
          <div className="h-64">
             {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#4B5563'}} />
                    <Tooltip 
                        cursor={{fill: '#F3F4F6'}} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="taxa" fill="#10898b" radius={[0, 4, 4, 0]} barSize={20} name="Taxa de 'Superou'">
                        {barData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.taxa > 70 ? '#10B981' : entry.taxa > 40 ? '#10898b' : '#F59E0B'} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
                 <BookOpen size={32} className="mb-2 opacity-50" />
                 <p className="text-sm">Sem dados de avaliação suficientes</p>
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
  gradient: string;
  onClick?: () => void;
  isActionable?: boolean;
}> = ({ title, value, icon, gradient, onClick, isActionable }) => (
  <div 
    onClick={onClick}
    className={`p-6 rounded-xl shadow-sm border border-transparent bg-white flex items-center justify-between transition-all relative overflow-hidden group
    ${isActionable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}`}
  >
    {/* Colored Background Accent */}
    <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 rounded-full opacity-10 ${gradient} group-hover:scale-110 transition-transform`}></div>
    
    <div className="relative z-10">
      <p className="text-sm font-semibold text-gray-500 mb-1">{title}</p>
      <h3 className={`text-3xl font-bold bg-clip-text text-transparent ${gradient}`}>{value}</h3>
    </div>
    <div className={`relative z-10 p-3 rounded-xl shadow-md ${gradient}`}>
      {icon}
    </div>
  </div>
);