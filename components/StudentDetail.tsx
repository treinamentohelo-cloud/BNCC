import React, { useState } from 'react';
import { ArrowLeft, PlusCircle, Check, AlertTriangle, Clock, ClipboardCheck, X, Star, Calendar, History, Printer, TrendingUp, TrendingDown, BookOpen, LayoutList, User as UserIcon, Flag, Table } from 'lucide-react';
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

// Tipos auxiliares definidos explicitamente
type TimelineEvent = 
  | { type: 'assessment'; date: string; assessment: Assessment; skill?: Skill }
  | { type: 'remediation_entry'; date: string }
  | { type: 'remediation_exit'; date: string };

interface SubjectGroupItem {
    skill: Skill;
    assessment: Assessment;
}

interface ReportCardData {
    total: number;
    success: number;
    cellStatus: 'success' | 'danger' | 'warning' | 'neutral';
}

// ATUALIZADO PARA TRIMESTRES
const TERMS = ['1º Trimestre', '2º Trimestre', '3º Trimestre', 'Recuperação'];

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
  const [viewMode, setViewMode] = useState<'subjects' | 'timeline' | 'report_card'>('subjects');
  
  // Form State
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [status, setStatus] = useState<AssessmentStatus>(AssessmentStatus.EM_DESENVOLVIMENTO);
  const [term, setTerm] = useState('1º Trimestre');
  const [notes, setNotes] = useState('');

  if (!student) return null;

  const studentClass = classes.find(c => c.id === student.classId);
  const focusSkillsIds: string[] = studentClass?.focusSkills || [];
  const studentAssessments = assessments.filter(a => a.studentId === studentId);

  // Helper para gerar ID seguro
  const generateId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID() as string;
    }
    return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Group assessments by Subject
  // FIXED: Removido generics da chamada da função e usado casting no valor inicial
  const assessmentsBySubject = skills.reduce((acc, skill) => {
    const assessment = studentAssessments
        .filter(a => a.skillId === skill.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (!acc[skill.subject]) acc[skill.subject] = [];
    if (assessment) acc[skill.subject].push({ skill, assessment });
    return acc;
  }, {} as Record<string, SubjectGroupItem[]>);

  // --- Logic for Report Card (Boletim) ---
  const uniqueSubjects = Array.from(new Set(skills.map(s => s.subject))).sort();
  
  // Tipagem explícita de retorno para aliviar o analisador
  const getReportCardCell = (subject: string, termName: string): ReportCardData | null => {
      const subjectSkills = skills.filter(s => s.subject === subject);
      const subjectSkillIds = subjectSkills.map(s => s.id);

      const termAssessments = studentAssessments.filter(a => 
          a.skillId && subjectSkillIds.includes(a.skillId) && a.term === termName
      );

      if (termAssessments.length === 0) return null;

      const total = termAssessments.length;
      const success = termAssessments.filter(a => a.status === AssessmentStatus.ATINGIU || a.status === AssessmentStatus.SUPEROU).length;
      
      let cellStatus: 'success' | 'danger' | 'warning' | 'neutral' = 'neutral';
      if (success === total) cellStatus = 'success';
      else if (success === 0) cellStatus = 'danger';
      else cellStatus = 'warning';

      return { total, success, cellStatus };
  };

  // --- Timeline Construction ---
  const timelineEvents: TimelineEvent[] = studentAssessments.map(a => ({
    type: 'assessment' as const,
    date: a.date,
    assessment: a,
    skill: skills.find(s => s.id === a.skillId)
  }));

  if (student.remediationEntryDate) {
      timelineEvents.push({ 
          type: 'remediation_entry' as const, 
          date: student.remediationEntryDate 
      });
  }
  if (student.remediationExitDate) {
      timelineEvents.push({ 
          type: 'remediation_exit' as const, 
          date: student.remediationExitDate 
      });
  }

  const sortedTimeline = [...timelineEvents].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
  });

  // --- Handlers ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) return;

    const newAssessment: Assessment = {
      id: generateId(),
      studentId,
      skillId: selectedSkillId,
      date: new Date().toISOString().split('T')[0],
      status,
      term,
      notes
    };

    onAddAssessment(newAssessment);
    setIsModalOpen(false);
    setSelectedSkillId('');
    setStatus(AssessmentStatus.EM_DESENVOLVIMENTO);
    setTerm('1º Trimestre');
    setNotes('');
  };

  const handlePrint = () => window.print();

  const getStatusBadge = (status?: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.SUPEROU: return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold"><Check size={12} /> Superou</span>;
      case AssessmentStatus.ATINGIU: return <span className="flex items-center gap-1 bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-bold"><Check size={12} /> Atingiu</span>;
      case AssessmentStatus.EM_DESENVOLVIMENTO: return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold"><Clock size={12} /> Em Desenv.</span>;
      case AssessmentStatus.NAO_ATINGIU: return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold"><AlertTriangle size={12} /> Não Atingiu</span>;
      default: return <span className="text-gray-400 text-xs">Não Avaliado</span>;
    }
  };

  const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('pt-BR') : '-';
  const formatDateTime = (dateString?: string) => {
      if (!dateString) return '-';
      const d = new Date(dateString);
      return dateString.includes('T') 
         ? d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
         : d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={onBack} className="flex items-center text-gray-500 hover:text-[#c48b5e] transition-colors">
            <ArrowLeft size={20} className="mr-2" /> Voltar para a Turma
        </button>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#eaddcf] text-[#433422] rounded-xl hover:bg-[#fcf9f6] transition-colors font-medium shadow-sm">
            <Printer size={18} /> Imprimir Relatório
        </button>
      </div>

      {/* HEADER DO ALUNO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#eaddcf] text-[#c48b5e] flex items-center justify-center text-3xl font-bold overflow-hidden border-2 border-white shadow-sm">
             {student.avatarUrl ? <img src={student.avatarUrl} className="w-full h-full object-cover" /> : student.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1"><UserIcon size={14} /> Matrícula: {student.registrationNumber || 'N/A'}</span>
                <span>•</span>
                <span>{studentClass?.name || 'Sem Turma'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 w-full md:w-auto mt-4 md:mt-0">
             {student.remediationEntryDate && !student.remediationExitDate ? (
                 <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-center gap-3 w-full md:w-auto">
                     <div className="bg-red-100 p-2 rounded-full text-red-600"><TrendingDown size={20} /></div>
                     <div>
                         <p className="text-xs text-red-600 font-bold uppercase tracking-wide">Em Reforço Escolar</p>
                         <p className="text-sm text-red-800 font-medium">Desde: {formatDate(student.remediationEntryDate)}</p>
                     </div>
                 </div>
             ) : student.remediationExitDate ? (
                 <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-3 w-full md:w-auto">
                     <div className="bg-green-100 p-2 rounded-full text-green-600"><TrendingUp size={20} /></div>
                     <div>
                         <p className="text-xs text-green-600 font-bold uppercase tracking-wide">Reforço Concluído</p>
                         <div className="text-xs text-green-800">
                            <p>Entrada: {formatDate(student.remediationEntryDate)}</p>
                            <p>Saída: {formatDate(student.remediationExitDate)}</p>
                         </div>
                     </div>
                 </div>
             ) : (
                 <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex items-center gap-3 w-full md:w-auto opacity-70">
                     <div className="bg-gray-200 p-2 rounded-full text-gray-500"><Check size={20} /></div>
                     <div>
                         <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Situação Regular</p>
                         <p className="text-xs text-gray-400">Nenhum histórico de reforço ativo.</p>
                     </div>
                 </div>
             )}
            <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center w-full md:w-auto bg-[#c48b5e] hover:bg-[#a0704a] text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm font-medium print:hidden">
            <PlusCircle size={18} className="mr-2" /> Nova Avaliação
            </button>
        </div>
      </div>

      {/* TABS DE VISUALIZAÇÃO */}
      <div className="flex gap-2 border-b border-gray-200 print:hidden overflow-x-auto">
          <button 
            onClick={() => setViewMode('subjects')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${viewMode === 'subjects' ? 'border-[#c48b5e] text-[#c48b5e]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <LayoutList size={16} /> Visão por Disciplina
          </button>
          <button 
            onClick={() => setViewMode('report_card')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${viewMode === 'report_card' ? 'border-[#c48b5e] text-[#c48b5e]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Table size={16} /> Boletim Escolar
          </button>
          <button 
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${viewMode === 'timeline' ? 'border-[#c48b5e] text-[#c48b5e]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <History size={16} /> Histórico Completo
          </button>
      </div>

      {/* 1. VISÃO POR DISCIPLINA */}
      {viewMode === 'subjects' && (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {Object.keys(assessmentsBySubject).length === 0 && (
                <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhuma avaliação registrada por disciplina.</p>
                </div>
            )}
            
            {Object.keys(assessmentsBySubject).map((subject) => {
              const items = assessmentsBySubject[subject];
              return (
                <div key={subject} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden break-inside-avoid">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 font-semibold text-gray-700 flex items-center gap-2">
                       <div className="w-1 h-4 bg-[#c48b5e] rounded-full"></div> {subject}
                    </div>
                    <div className="divide-y divide-gray-100">
                    {items.map(({ skill, assessment }) => {
                        const isFocus = focusSkillsIds.includes(skill.id);
                        return (
                        <div key={`${skill.id}-${assessment?.id}`} className="p-4 md:p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-mono px-2 py-0.5 rounded border ${isFocus ? 'bg-[#c48b5e] text-white border-[#c48b5e]' : 'bg-indigo-50 text-[#c48b5e] border-[#eaddcf]'}`}>
                                {skill.code}
                                </span>
                                {isFocus && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><Star size={8} fill="currentColor" /> Foco</span>}
                                {getStatusBadge(assessment?.status)}
                                {assessment.term && (
                                    <span className="text-[10px] text-gray-500 border border-gray-200 px-1.5 rounded">{assessment.term}</span>
                                )}
                            </div>
                            <p className="text-gray-800 text-sm">{skill.description}</p>
                            {assessment?.notes && (
                                <p className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded inline-block border border-gray-100 italic">"{assessment.notes}"</p>
                            )}
                            </div>
                            <div className="text-right min-w-[100px]">
                            <span className="text-xs text-gray-400 flex items-center justify-end gap-1">
                                <Calendar size={12} /> {assessment ? formatDate(assessment.date) : '-'}
                            </span>
                            </div>
                        </div>
                        );
                    })}
                    </div>
                </div>
              );
            })}
        </div>
      )}

      {/* 2. BOLETIM ESCOLAR */}
      {viewMode === 'report_card' && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center print:bg-white print:border-b-2 print:border-black">
                  <div>
                    <h3 className="font-bold text-[#000039] text-lg">Boletim de Desempenho</h3>
                    <p className="text-xs text-gray-500">Visão consolidada por disciplina e trimestre.</p>
                  </div>
                  <div className="text-right">
                      <p className="text-xs text-gray-400">Ano Letivo {new Date().getFullYear()}</p>
                  </div>
             </div>
             
             <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                     <thead>
                         <tr className="bg-white border-b border-gray-200">
                             <th className="p-4 text-sm font-bold text-gray-600 uppercase w-1/4 border-r border-gray-100">Disciplina</th>
                             {TERMS.map(t => (
                                 <th key={t} className="p-4 text-xs font-bold text-gray-500 uppercase text-center border-r border-gray-100 last:border-0 min-w-[100px]">
                                     {t.replace(' Trimestre', 'º Tri.')}
                                 </th>
                             ))}
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {uniqueSubjects.map(subject => (
                             <tr key={subject} className="hover:bg-gray-50 transition-colors">
                                 <td className="p-4 text-sm font-bold text-[#433422] border-r border-gray-100">{subject}</td>
                                 {TERMS.map(t => {
                                     const data = getReportCardCell(subject, t);
                                     return (
                                         <td key={t} className="p-4 text-center border-r border-gray-100 last:border-0 align-middle">
                                             {data ? (
                                                 <div className="flex flex-col items-center gap-1">
                                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 
                                                         ${data.cellStatus === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                           data.cellStatus === 'danger' ? 'bg-red-50 text-red-700 border-red-200' : 
                                                           'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                         {Math.round((data.success / data.total) * 100)}%
                                                     </div>
                                                     <span className="text-[10px] text-gray-400 font-mono">
                                                         {data.success}/{data.total} Hb.
                                                     </span>
                                                 </div>
                                             ) : (
                                                 <span className="text-gray-300 text-xs">-</span>
                                             )}
                                         </td>
                                     );
                                 })}
                             </tr>
                         ))}
                         {uniqueSubjects.length === 0 && (
                             <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma disciplina avaliada.</td></tr>
                         )}
                     </tbody>
                 </table>
             </div>
             <div className="p-4 bg-gray-50 text-[10px] text-gray-500 flex flex-wrap gap-4 justify-center border-t border-gray-100">
                 <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-100 border border-green-200"></div> 100% de Sucesso</div>
                 <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-200"></div> Parcialmente Atingido</div>
                 <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div> Não Atingido</div>
             </div>
         </div>
      )}

      {/* 3. HISTÓRICO COMPLETO */}
      {viewMode === 'timeline' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center print:bg-white print:border-b-2 print:border-black">
                  <div>
                    <h3 className="font-bold text-[#000039] text-lg">Histórico Cronológico</h3>
                    <p className="text-xs text-gray-500">Linha do tempo de todas as ocorrências.</p>
                  </div>
              </div>

              {sortedTimeline.length === 0 ? (
                   <div className="p-12 text-center text-gray-400">
                       <History size={32} className="mx-auto mb-2 opacity-50" />
                       <p>O aluno ainda não possui histórico registrado.</p>
                   </div>
              ) : (
                  <table className="w-full text-left">
                      <thead>
                          <tr className="bg-white border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                              <th className="p-4 font-semibold">Data</th>
                              <th className="p-4 font-semibold">Evento / Habilidade</th>
                              <th className="p-4 font-semibold text-center">Status</th>
                              <th className="p-4 font-semibold">Detalhes</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {sortedTimeline.map((item: TimelineEvent, idx) => {
                              if (item.type === 'assessment') {
                                  const { assessment, skill } = item;
                                  return (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm font-mono text-gray-600 whitespace-nowrap align-top">
                                            {formatDate(assessment.date)}
                                            {assessment.term && <div className="text-[10px] text-gray-400 mt-1 uppercase">{assessment.term}</div>}
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="text-sm font-bold text-[#000039] mb-1">{skill?.subject}</div>
                                            <div className="text-xs text-gray-600">
                                                <span className="font-mono bg-gray-100 px-1 rounded mr-1">{skill?.code}</span>
                                                {skill?.description}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center align-top">{getStatusBadge(assessment.status)}</td>
                                        <td className="p-4 text-sm text-gray-600 italic align-top">{assessment.notes || '-'}</td>
                                    </tr>
                                  );
                              } else if (item.type === 'remediation_entry') {
                                  return (
                                    <tr key={idx} className="bg-red-50/50 hover:bg-red-50 transition-colors border-l-4 border-red-400">
                                        <td className="p-4 text-sm font-mono text-red-700 whitespace-nowrap align-top font-bold">{formatDateTime(item.date)}</td>
                                        <td className="p-4 align-top">
                                            <div className="text-sm font-bold text-red-800 mb-1 flex items-center gap-2"><AlertTriangle size={14} /> Reforço Escolar</div>
                                            <div className="text-xs text-red-600">Início do ciclo de intervenção.</div>
                                        </td>
                                        <td className="p-4 text-center align-top"><span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Entrada</span></td>
                                        <td className="p-4 text-sm text-red-700 italic align-top">Encaminhado para reforço.</td>
                                    </tr>
                                  );
                              } else if (item.type === 'remediation_exit') {
                                  return (
                                    <tr key={idx} className="bg-green-50/50 hover:bg-green-50 transition-colors border-l-4 border-green-400">
                                        <td className="p-4 text-sm font-mono text-green-700 whitespace-nowrap align-top font-bold">{formatDateTime(item.date)}</td>
                                        <td className="p-4 align-top">
                                            <div className="text-sm font-bold text-green-800 mb-1 flex items-center gap-2"><Flag size={14} /> Reforço Escolar</div>
                                            <div className="text-xs text-green-600">Conclusão do ciclo.</div>
                                        </td>
                                        <td className="p-4 text-center align-top"><span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Saída</span></td>
                                        <td className="p-4 text-sm text-green-700 italic align-top">Objetivos atingidos.</td>
                                    </tr>
                                  );
                              }
                              return null;
                          })}
                      </tbody>
                  </table>
              )}
              <div className="hidden print:flex justify-between mt-12 px-6 pb-6 text-xs text-gray-400 border-t pt-4">
                  <div>___________________________________________<br/>Assinatura do Responsável</div>
                  <div>___________________________________________<br/>Assinatura da Coordenação</div>
              </div>
          </div>
      )}

      {/* Modal de Avaliação (Mantido) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#eaddcf]">
            <div className="px-6 py-5 bg-gradient-to-r from-[#c48b5e] to-[#a0704a] flex justify-between items-center">
              <h3 className="font-bold text-xl text-white flex items-center gap-2"><ClipboardCheck className="text-[#eaddcf]" /> Registrar Avaliação</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Habilidade BNCC</label>
                <select required value={selectedSkillId} onChange={(e) => setSelectedSkillId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] bg-white text-black">
                  <option value="">Selecione...</option>
                  {skills.map(s => (<option key={s.id} value={s.id} className={focusSkillsIds.includes(s.id) ? 'font-bold text-[#c48b5e]' : ''}>{focusSkillsIds.includes(s.id) ? '★ ' : ''}{s.code} - {s.subject}</option>))}
                </select>
                {selectedSkillId && <p className="mt-2 text-xs text-gray-600 bg-[#eaddcf]/20 p-3 rounded-lg border border-[#eaddcf]">{skills.find(s => s.id === selectedSkillId)?.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Trimestre</label>
                    <select required className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] bg-white text-black" value={term} onChange={e => setTerm(e.target.value)}>
                        {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Resultado</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { val: AssessmentStatus.NAO_ATINGIU, label: 'Não', color: 'bg-red-50 text-red-700' },
                            { val: AssessmentStatus.EM_DESENVOLVIMENTO, label: 'Em Des.', color: 'bg-amber-50 text-amber-700' },
                            { val: AssessmentStatus.ATINGIU, label: 'Sim', color: 'bg-cyan-50 text-cyan-700' },
                            { val: AssessmentStatus.SUPEROU, label: 'Super', color: 'bg-green-50 text-green-700' },
                        ].map((opt) => (
                            <button key={opt.val} type="button" onClick={() => setStatus(opt.val)} className={`border px-1 py-3 rounded-xl text-[10px] font-bold transition-all shadow-sm ${status === opt.val ? 'ring-2 ring-[#c48b5e] ring-offset-1 ' + opt.color : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{opt.label}</button>
                        ))}
                    </div>
                  </div>
              </div>
              {(status !== AssessmentStatus.SUPEROU && status !== AssessmentStatus.ATINGIU) && (
                 <div className="bg-amber-50 p-3 rounded-lg border border-amber-100"><p className="text-xs text-amber-800 flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5" />O aluno será incluído na lista de <strong>Reforço Escolar</strong>.</p></div>
              )}
              <div>
                <label className="block text-sm font-semibold text-[#c48b5e] mb-1.5 ml-1">Observações</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#c48b5e] bg-white text-black h-24 resize-none" placeholder="Detalhes..." />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-[#c48b5e] text-white py-3.5 rounded-xl font-bold hover:bg-[#a0704a] shadow-lg shadow-[#c48b5e]/20 transition-all transform hover:-translate-y-0.5">Salvar Avaliação</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};