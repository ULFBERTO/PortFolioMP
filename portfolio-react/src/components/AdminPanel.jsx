import { useState } from 'react'
import { useData } from '../context/DataContext'

const tabs = [
  { id: 'profile', label: 'Perfil', icon: 'person' },
  { id: 'hero', label: 'Hero', icon: 'home' },
  { id: 'stats', label: 'Stats', icon: 'analytics' },
  { id: 'experience', label: 'Experiencia', icon: 'work' },
  { id: 'projects', label: 'Proyectos', icon: 'folder' },
  { id: 'theme', label: 'Tema', icon: 'palette' },
]

export default function AdminPanel({ onClose }) {
  const { data, updateData, downloadData } = useData()
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState(structuredClone(data))

  const handleSave = () => {
    updateData({ ...formData })
  }

  const updateField = (path, value) => {
    setFormData(prev => {
      const newData = structuredClone(prev)
      const keys = path.split('.')
      let obj = newData
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]]
      }
      obj[keys[keys.length - 1]] = value
      return newData
    })
  }

  return (
    <div className="fixed inset-0 bg-background-dark z-[100] overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-background-dark py-4 z-10 border-b border-white/10">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
            <div>
              <h1 className="text-white text-2xl font-bold">Panel de Administración</h1>
              <p className="text-gray-400 text-sm">Edita todo el contenido de tu portafolio</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { handleSave(); downloadData(); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-lg font-bold text-sm hover:bg-[#1fd665] transition-colors">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Guardar JSON
            </button>
            <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white rounded-lg font-bold text-sm hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
              Cerrar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === tab.id ? 'bg-primary text-background-dark' : 'text-gray-400 hover:bg-white/10'}`}
            >
              <span className="material-symbols-outlined text-[16px] align-middle mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="admin-section bg-white/5 border border-white/5 rounded-2xl p-6">
          {activeTab === 'profile' && <ProfileTab formData={formData} updateField={updateField} />}
          {activeTab === 'hero' && <HeroTab formData={formData} updateField={updateField} />}
          {activeTab === 'stats' && <StatsTab formData={formData} updateField={updateField} />}
          {activeTab === 'experience' && <ExperienceTab formData={formData} setFormData={setFormData} />}
          {activeTab === 'projects' && <ProjectsTab formData={formData} setFormData={setFormData} />}
          {activeTab === 'theme' && <ThemeTab formData={formData} updateField={updateField} />}
        </div>

        <button onClick={handleSave} className="mt-6 px-6 py-3 bg-primary text-background-dark rounded-lg font-bold text-sm hover:bg-[#1fd665] transition-colors">
          Aplicar Cambios
        </button>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', ...props }) {
  return (
    <div>
      <label className="block text-gray-400 text-xs mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
        {...props}
      />
    </div>
  )
}

function Textarea({ label, value, onChange, ...props }) {
  return (
    <div>
      <label className="block text-gray-400 text-xs mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
        rows={4}
        {...props}
      />
    </div>
  )
}

function ProfileTab({ formData, updateField }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input label="Nombre Completo" value={formData.profile.name} onChange={(v) => updateField('profile.name', v)} />
      <Input label="Nombre Corto" value={formData.profile.shortName} onChange={(v) => updateField('profile.shortName', v)} />
      <Input label="Iniciales" value={formData.profile.initials} onChange={(v) => updateField('profile.initials', v)} maxLength={3} />
      <Input label="Email" value={formData.profile.email} onChange={(v) => updateField('profile.email', v)} type="email" />
      <Input label="Rol (Español)" value={formData.profile.role.es} onChange={(v) => updateField('profile.role.es', v)} />
      <Input label="Rol (English)" value={formData.profile.role.en} onChange={(v) => updateField('profile.role.en', v)} />
      <Input label="GitHub URL" value={formData.profile.github} onChange={(v) => updateField('profile.github', v)} />
      <Input label="LinkedIn URL" value={formData.profile.linkedin} onChange={(v) => updateField('profile.linkedin', v)} />
      <Input label="CV URL" value={formData.profile.cvUrl} onChange={(v) => updateField('profile.cvUrl', v)} />
      <div className="md:col-span-2">
        <Input label="Tecnologías (separadas por coma)" value={formData.technologies.join(', ')} onChange={(v) => updateField('technologies', v.split(',').map(t => t.trim()))} />
      </div>
    </div>
  )
}

function HeroTab({ formData, updateField }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input label="Saludo (Español)" value={formData.hero.greeting.es} onChange={(v) => updateField('hero.greeting.es', v)} />
      <Input label="Greeting (English)" value={formData.hero.greeting.en} onChange={(v) => updateField('hero.greeting.en', v)} />
      <Textarea label="Descripción (Español)" value={formData.hero.description.es} onChange={(v) => updateField('hero.description.es', v)} />
      <Textarea label="Description (English)" value={formData.hero.description.en} onChange={(v) => updateField('hero.description.en', v)} />
    </div>
  )
}

function StatsTab({ formData, updateField }) {
  const stats = ['yearsActive', 'projects', 'techStack', 'experience']
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stats.map(key => (
        <Input key={key} label={`${formData.stats[key].label.es} (valor)`} value={formData.stats[key].value} onChange={(v) => updateField(`stats.${key}.value`, v)} />
      ))}
    </div>
  )
}

function ExperienceTab({ formData, setFormData }) {
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        id: `exp-${Date.now()}`,
        icon: 'work',
        title: { es: 'Nuevo', en: 'New' },
        date: '2024',
        description: { es: '', en: '' },
        isCurrent: false
      }]
    }))
  }

  const updateExp = (index, field, value) => {
    setFormData(prev => {
      const newExp = [...prev.experience]
      const keys = field.split('.')
      if (keys.length === 2) {
        newExp[index][keys[0]][keys[1]] = value
      } else {
        newExp[index][field] = value
      }
      return { ...prev, experience: newExp }
    })
  }

  const deleteExp = (index) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="space-y-4">
      {formData.experience.map((exp, i) => (
        <div key={exp.id} className="bg-white/5 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white font-bold">{exp.title.es}</span>
            <button onClick={() => deleteExp(i)} className="text-red-400 hover:text-red-300">
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Título (ES)" value={exp.title.es} onChange={(v) => updateExp(i, 'title.es', v)} />
            <Input label="Title (EN)" value={exp.title.en} onChange={(v) => updateExp(i, 'title.en', v)} />
            <Input label="Fecha" value={exp.date} onChange={(v) => updateExp(i, 'date', v)} />
            <Input label="Icono" value={exp.icon} onChange={(v) => updateExp(i, 'icon', v)} />
          </div>
        </div>
      ))}
      <button onClick={addExperience} className="px-4 py-2 bg-primary/20 text-primary rounded-lg font-medium text-sm hover:bg-primary/30">
        + Agregar Experiencia
      </button>
    </div>
  )
}

function ProjectsTab({ formData, setFormData }) {
  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, {
        id: `proj-${Date.now()}`,
        title: 'Nuevo Proyecto',
        category: 'Web',
        categoryColor: 'primary',
        year: '2024',
        description: { es: '', en: '' },
        technologies: [],
        demoUrl: '',
        repoUrl: '',
        downloadUrl: '',
        icon: 'code',
        gradient: 'from-purple-900/50 to-blue-900/50'
      }]
    }))
  }

  const updateProj = (index, field, value) => {
    setFormData(prev => {
      const newProj = [...prev.projects]
      const keys = field.split('.')
      if (keys.length === 2) {
        newProj[index][keys[0]][keys[1]] = value
      } else {
        newProj[index][field] = value
      }
      return { ...prev, projects: newProj }
    })
  }

  const deleteProj = (index) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="space-y-4">
      {formData.projects.map((proj, i) => (
        <div key={proj.id} className="bg-white/5 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white font-bold">{proj.title}</span>
            <button onClick={() => deleteProj(i)} className="text-red-400 hover:text-red-300">
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Título" value={proj.title} onChange={(v) => updateProj(i, 'title', v)} />
            <Input label="Categoría" value={proj.category} onChange={(v) => updateProj(i, 'category', v)} />
            <Input label="Año" value={proj.year} onChange={(v) => updateProj(i, 'year', v)} />
            <Input label="Icono" value={proj.icon} onChange={(v) => updateProj(i, 'icon', v)} />
            <Input label="Demo URL" value={proj.demoUrl} onChange={(v) => updateProj(i, 'demoUrl', v)} />
            <Input label="Repo URL" value={proj.repoUrl} onChange={(v) => updateProj(i, 'repoUrl', v)} />
            <Input label="Tecnologías (coma)" value={proj.technologies.join(', ')} onChange={(v) => updateProj(i, 'technologies', v.split(',').map(t => t.trim()))} />
          </div>
        </div>
      ))}
      <button onClick={addProject} className="px-4 py-2 bg-primary/20 text-primary rounded-lg font-medium text-sm hover:bg-primary/30">
        + Agregar Proyecto
      </button>
    </div>
  )
}

function ThemeTab({ formData, updateField }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Input label="Color Primario" value={formData.theme.primary} onChange={(v) => updateField('theme.primary', v)} type="color" />
      <Input label="Background Dark" value={formData.theme.backgroundDark} onChange={(v) => updateField('theme.backgroundDark', v)} type="color" />
      <Input label="Surface Dark" value={formData.theme.surfaceDark} onChange={(v) => updateField('theme.surfaceDark', v)} type="color" />
    </div>
  )
}
