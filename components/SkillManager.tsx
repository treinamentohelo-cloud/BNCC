import React, { useState } from 'react';
import { Plus, Search, BookOpen, Edit2, Trash2, Link as LinkIcon, X, CheckSquare, Square, School } from 'lucide-react';
import { Skill, ClassGroup, User as UserType } from '../types';

interface SkillManagerProps {
  skills: Skill[];
  classes?: ClassGroup[];
  currentUser: UserType | null;
  onAddSkill: (s: Skill) => void;
  onUpdateSkill: (s: Skill) => void;
  onDeleteSkill: (id: string) => void;
  onUpdateClass?: (c: ClassGroup) => void;
}

export const SkillManager: React.FC<SkillManagerProps> = ({ 
    skills, 
    classes = [],
    currentUser,
    onAddSkill,
    onUpdateSkill,
    onDeleteSkill,
    onUpdateClass
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: '', description: '', subject: 'Língua Portuguesa' });

  // State for Linking Modal
  const [linkingSkill, setLinkingSkill] = useState<Skill | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  const canDelete = currentUser?.role !== 'professor';

  const filteredSkills = skills.filter(s => 
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ code: '', description: '', subject: 'Língua Portuguesa' });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEditClick = (skill: Skill) => {
    setEditingId(skill.id);
    setFormData({
        code: skill.code,
        description: skill.description,
        subject: skill.subject
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if(window.confirm('Tem certeza que deseja excluir esta habilidade?')) {
        onDeleteSkill(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editingId || crypto.randomUUID(),
      ...formData
    };

    if (editingId) {
        onUpdateSkill(payload);
    } else {
        onAddSkill(payload);
    }
    
    resetForm();
  };

  // --- Link to Class Logic ---

  const openLinkModal = (skill: Skill) => {
      setLinkingSkill(skill);
      // Find classes that have this skill in their focusSkills array
      const activeClasses = classes
        .filter(c => c.focusSkills?.includes(skill.id))
        .map(c => c.id);
      setSelectedClassIds(activeClasses);
  };

  const toggleClassSelection = (classId: string) => {
      setSelectedClassIds(prev => 
         prev.includes(classId) 
           ? prev.filter(id => id !== classId)
           : [...prev, classId]
      );
  };

  const handleSaveLinks = () => {
      if (!linkingSkill || !onUpdateClass) return;

      // Update classes that CHANGED state
      classes.forEach(cls => {
          const currentlyHasSkill = cls.focusSkills?.includes(linkingSkill.id);
          const shouldHaveSkill = selectedClassIds.includes(cls.id);

          if (currentlyHasSkill !== shouldHaveSkill) {
              let newFocusSkills = cls.focusSkills || [];
              if (shouldHaveSkill) {
                  newFocusSkills = [...newFocusSkills, linkingSkill.id];
              } else {
                  newFocusSkills = newFocusSkills.filter(id => id !== linkingSkill.id);
              }
              // Call update for this class
              onUpdateClass({ ...cls, focusSkills: newFocusSkills });
          }
      });
      
      setLinkingSkill(null);
      setSelectedClassIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-[#000039]">Habilidades BNCC</h2>
           <p className="text-gray-500">Catálogo de competências curriculares</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="bg-[#10898b] hover:bg-[#0d7274] text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#10898b]/20 transition-all transform hover:-translate-y-0.5 font-medium"
        >
          <Plus size={18} /> Cadastrar Habilidade
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#bfe4cd] animate-in slide-in-from-top-4 duration-300">
           <div className="flex items-center gap-2 mb-6 text-[#10898b]">
              <BookOpen />
              <h3 className="font-bold text-xl">{editingId ? 'Editar Habilidade' : 'Nova Habilidade'}</h3>
           </div>
           
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                <label className="block text-sm font-bold text-[#10898b] mb-1.5">Código BNCC</label>
                <input 
                  required
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#10898b] outline-none text-[#000039] bg-gray-50 focus:bg-white transition-all"
                  placeholder="Ex: EF01LP01"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[#10898b] mb-1.5">Descrição</label>
                <input 
                  required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#10898b] outline-none text-[#000039] bg-gray-50 focus:bg-white transition-all"
                  placeholder="Descrição da habilidade..."
                />
              </div>
              <div>
                 <label className="block text-sm font-bold text-[#10898b] mb-1.5">Disciplina</label>
                 <select 
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#10898b] outline-none text-[#000039] bg-gray-50 focus:bg-white transition-all"
                 >
                    <option>Língua Portuguesa</option>
                    <option>Matemática</option>
                    <option>Ciências</option>
                    <option>História</option>
                    <option>Geografia</option>
                 </select>
              </div>
              <div className="flex gap-3 md:col-span-4 justify-end mt-2">
                 <button type="button" onClick={resetForm} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
                 <button type="submit" className="px-8 py-2.5 bg-[#10898b] text-white rounded-xl font-bold hover:bg-[#0d7274] shadow-md shadow-[#10898b]/20 transition-all transform hover:-translate-y-0.5">Salvar</button>
              </div>
           </form>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text"
          placeholder="Buscar habilidade por código ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10898b] outline-none shadow-sm text-[#000039]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSkills.map(skill => {
            const usageCount = classes.filter(c => c.focusSkills?.includes(skill.id)).length;
            
            return (
              <div key={skill.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-[#bfe4cd] hover:shadow-lg transition-all group flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                    <span className="bg-[#bfe4cd] text-[#10898b] font-mono font-bold px-2 py-1 rounded text-sm">
                        {skill.code}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(skill)} className="p-1.5 text-gray-400 hover:text-[#10898b] rounded hover:bg-[#bfe4cd]">
                            <Edit2 size={16} />
                        </button>
                        {canDelete && (
                            <button onClick={() => handleDeleteClick(skill.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-gray-800 font-medium mb-4 line-clamp-3 flex-1">
                    {skill.description}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center text-xs text-gray-500">
                        <BookOpen size={14} className="mr-1.5 text-[#10898b]" />
                        {skill.subject}
                    </div>
                    
                    {/* Link to Class Button */}
                    {onUpdateClass && (
                        <div className="flex items-center gap-2">
                             {usageCount > 0 && (
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold" title={`${usageCount} Turmas Focadas`}>
                                    {usageCount}
                                </span>
                             )}
                             <button 
                                onClick={() => openLinkModal(skill)}
                                className={`p-1.5 rounded-lg transition-colors ${usageCount > 0 ? 'bg-[#10898b] text-white' : 'bg-gray-50 text-gray-400 hover:bg-[#bfe4cd] hover:text-[#10898b]'}`}
                                title="Vincular a Turmas"
                             >
                                <LinkIcon size={14} />
                             </button>
                        </div>
                    )}
                </div>
              </div>
            );
        })}
        {filteredSkills.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-[#bfe4cd] transition-colors">
              <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <BookOpen className="text-gray-300" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-1">Nenhuma habilidade encontrada</h3>
              <p className="text-sm text-gray-400">Verifique os filtros ou cadastre uma nova habilidade.</p>
          </div>
        )}
      </div>

      {/* MODAL: VINCULAR HABILIDADE A TURMAS */}
      {linkingSkill && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#bfe4cd]">
               <div className="px-6 py-5 bg-gradient-to-r from-[#10898b] to-[#0d7274] flex justify-between items-center">
                   <h3 className="font-bold text-xl text-white flex items-center gap-2">
                      <LinkIcon className="text-[#bfe4cd]" /> Vincular a Turmas
                   </h3>
                   <button onClick={() => setLinkingSkill(null)} className="text-white/80 hover:text-white transition-colors">
                      <X size={24} />
                   </button>
               </div>
               
               <div className="p-6">
                   <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                       <p className="text-xs text-[#10898b] font-bold font-mono mb-1">{linkingSkill.code}</p>
                       <p className="text-sm text-gray-700">{linkingSkill.description}</p>
                   </div>
                   
                   <p className="text-sm font-semibold text-[#000039] mb-3">Selecione as turmas que terão esta habilidade como foco:</p>
                   
                   <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
                       {classes.map(cls => {
                           const isSelected = selectedClassIds.includes(cls.id);
                           return (
                               <div 
                                  key={cls.id} 
                                  onClick={() => toggleClassSelection(cls.id)}
                                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${isSelected ? 'border-[#10898b] bg-[#bfe4cd]/20' : 'border-gray-200 hover:bg-gray-50'}`}
                               >
                                   <div className="flex items-center gap-3">
                                       <School size={16} className={isSelected ? 'text-[#10898b]' : 'text-gray-400'} />
                                       <span className={`text-sm font-medium ${isSelected ? 'text-[#10898b]' : 'text-gray-600'}`}>{cls.name}</span>
                                   </div>
                                   {isSelected ? <CheckSquare size={20} className="text-[#10898b]" /> : <Square size={20} className="text-gray-300" />}
                               </div>
                           );
                       })}
                       {classes.length === 0 && <p className="text-sm text-gray-400 text-center">Nenhuma turma cadastrada.</p>}
                   </div>

                   <button 
                      onClick={handleSaveLinks}
                      className="w-full bg-[#10898b] text-white py-3 rounded-xl font-bold hover:bg-[#0d7274] shadow-lg shadow-[#10898b]/20 transition-all"
                   >
                      Salvar Vínculos
                   </button>
               </div>
            </div>
          </div>
      )}

    </div>
  );
};