import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Skill } from '../types';

interface SkillManagerProps {
  skills: Skill[];
  onAddSkill: (s: Skill) => void;
}

export const SkillManager: React.FC<SkillManagerProps> = ({ skills, onAddSkill }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ code: '', description: '', subject: 'Língua Portuguesa' });

  const filteredSkills = skills.filter(s => 
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSkill({
      id: Date.now().toString(),
      ...formData
    });
    setFormData({ code: '', description: '', subject: 'Língua Portuguesa' });
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-800">Habilidades BNCC</h2>
           <p className="text-gray-500">Catálogo de competências curriculares</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} /> Cadastrar Habilidade
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl shadow border border-indigo-100">
           <h3 className="font-bold mb-4 text-gray-800">Nova Habilidade</h3>
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código BNCC</label>
                <input 
                  required
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: EF01LP01"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
                <input 
                  required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Descrição da habilidade..."
                />
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Disciplina</label>
                 <select 
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                 >
                    <option>Língua Portuguesa</option>
                    <option>Matemática</option>
                    <option>Ciências</option>
                    <option>História</option>
                    <option>Geografia</option>
                 </select>
              </div>
              <div className="flex gap-2">
                 <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-medium hover:bg-green-700">Salvar</button>
                 <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 bg-gray-200 text-gray-700 py-2 rounded text-sm font-medium hover:bg-gray-300">Cancelar</button>
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
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Código</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Disciplina</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSkills.map(skill => (
              <tr key={skill.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 align-top font-mono text-indigo-700 text-sm font-medium whitespace-nowrap">{skill.code}</td>
                <td className="p-4 align-top text-gray-700 text-sm">{skill.description}</td>
                <td className="p-4 align-top">
                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                     {skill.subject}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSkills.length === 0 && (
          <div className="p-8 text-center text-gray-500">
             Nenhuma habilidade encontrada para sua busca.
          </div>
        )}
      </div>
    </div>
  );
};
