import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  Users, Plus, Search, Edit2, Trash2, Star, 
  History, CheckCircle, Clock, X, Sparkles, TrendingUp, Camera, Image as ImageIcon
} from 'lucide-react';

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    subject: '',
    qualification: '',
    experience: '',
    speciality: '',
    rating: 5.0,
    isActive: true,
    priorityOrder: ''
  });

  const coreFacultyNames = ['Mr. Ranjan Kumar Soni', 'Mr. Raghuwendra Kumar Soni', 'Mr. Aayush Gupta'];

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await api.get('/faculty/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let sortedFaculty = data.data;

      // Ensure consistent sorting in Admin too
      sortedFaculty.sort((a, b) => {
        // Step 1: Active first
        if (a.isActive !== b.isActive) {
          return b.isActive - a.isActive;
        }

        // Step 2: Priority faculty
        if (a.priorityOrder && b.priorityOrder) {
          return a.priorityOrder - b.priorityOrder;
        }
        if (a.priorityOrder) return -1;
        if (b.priorityOrder) return 1;

        // Step 3: Alphabetical order
        return a.name.localeCompare(b.name);
      });

      setFaculty(sortedFaculty);
    } catch (error) {
      toast.error('Failed to fetch faculty');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('subject', form.subject);
      formData.append('qualification', form.qualification || '');
      formData.append('experience', form.experience);
      formData.append('speciality', form.speciality || '');
      formData.append('rating', form.rating);
      if (form.priorityOrder !== '') {
        formData.append('priorityOrder', form.priorityOrder);
      }
      formData.append('isActive', form.isActive);
      
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const config = {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}` 
        }
      };
      
      if (editingTeacher) {
        await api.put(`/faculty/${editingTeacher._id}`, formData, config);
        toast.success('Teacher updated successfully');
      } else {
        await api.post('/faculty', formData, config);
        toast.success('Teacher added successfully');
      }
      
      setShowModal(false);
      setEditingTeacher(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      setForm({ name: '', subject: '', qualification: '', experience: '', speciality: '', rating: 5.0, isActive: true, priorityOrder: '' });
      fetchFaculty();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (teacher) => {
    if (coreFacultyNames.includes(teacher.name) && teacher.isActive) {
      toast.error('Core faculty members cannot be deactivated');
      return;
    }
    try {
      await api.put(`/faculty/${teacher._id}`, { isActive: !teacher.isActive });
      toast.success(`Teacher ${teacher.isActive ? 'deactivated' : 'activated'}`);
      fetchFaculty();
    } catch (error) {
      toast.error('Status update failed');
    }
  };

  const handleDelete = async (teacher) => {
    if (coreFacultyNames.includes(teacher.name)) {
      toast.error('Core faculty members cannot be deleted');
      return;
    }
    if (!window.confirm(`Move ${teacher.name} to Recycle Bin?`)) return;
    try {
      await api.delete(`/faculty/${teacher._id}`);
      toast.success('Moved to Recycle Bin');
      fetchFaculty();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const openEdit = (teacher) => {
    setEditingTeacher(teacher);
    setForm({
      name: teacher.name,
      subject: teacher.subject,
      qualification: teacher.qualification,
      experience: teacher.experience,
      speciality: teacher.speciality,
      rating: teacher.rating,
      isActive: teacher.isActive,
      priorityOrder: teacher.priorityOrder ?? ''
    });
    setPhotoFile(null);
    setPhotoPreview(teacher.photo?.url || null);
    setShowModal(true);
  };

  const filtered = faculty.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.subject.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-brand-dark">Faculty Management</h2>
          <p className="text-gray-500 text-sm">Add, edit, and manage your teaching staff</p>
        </div>
        <button 
          onClick={() => {
            setEditingTeacher(null);
            setForm({ name: '', subject: '', qualification: '', experience: '', speciality: '', rating: 5.0, isActive: true });
            setPhotoFile(null);
            setPhotoPreview(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2 px-6 py-3 self-start"
        >
          <Plus className="w-5 h-5" /> Add New Teacher
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" placeholder="Search by name or subject..."
            className="input-field pl-12 py-3"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((teacher) => {
          const isCore = coreFacultyNames.includes(teacher.name);
          return (
          <div key={teacher._id} className={`card p-6 border transition-all ${teacher.isActive ? 'border-gray-100' : 'border-red-100 bg-red-50/30 grayscale opacity-75'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-xl overflow-hidden ${teacher.isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                  {teacher.photo?.url ? (
                    <img src={teacher.photo.url} alt={teacher.name} className="w-full h-full object-cover" />
                  ) : (
                    teacher.name[0]
                  )}
                </div>
                {isCore && (
                  <span className="px-2 py-0.5 bg-brand-dark text-white text-[8px] font-bold uppercase rounded-md tracking-wider">Core Faculty</span>
                )}
                {!teacher.isActive && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-bold uppercase rounded-md tracking-wider text-center">Inactive</span>
                )}
                {teacher.priorityOrder && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-bold uppercase rounded-md tracking-wider text-center">Priority: #{teacher.priorityOrder}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(teacher)} className="p-2 hover:bg-primary/5 text-primary rounded-lg transition-colors" title="Edit">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleToggleStatus(teacher)} 
                  disabled={isCore && teacher.isActive}
                  className={`p-2 rounded-lg transition-colors ${isCore && teacher.isActive ? 'opacity-20 cursor-not-allowed' : teacher.isActive ? 'hover:bg-amber-50 text-amber-500' : 'hover:bg-green-50 text-green-500'}`}
                  title={teacher.isActive ? 'Deactivate (Hide from public)' : 'Activate (Show on public)'}
                >
                  {teacher.isActive ? <Clock className="w-4 h-4" /> : <History className="w-4 h-4" />}
                </button>
                {!isCore && (
                  <button 
                    onClick={() => handleDelete(teacher)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                    title="Move to Recycle Bin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <h3 className="font-bold text-brand-dark mb-1">{teacher.name}</h3>
            <p className="text-primary text-xs font-bold uppercase tracking-tight mb-2">{teacher.subject}</p>
            <p className="text-gray-400 text-[10px] mb-4 uppercase tracking-widest font-medium">{teacher.experience}+ Years Experience</p>

            <div className="flex items-center gap-1.5 mb-4 py-1.5 px-3 bg-brand-bg rounded-lg w-fit">
              <div className="flex gap-0.5">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < Math.floor(teacher.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-[11px] font-bold text-brand-dark">{teacher.rating}</span>
            </div>

            {teacher.isActive ? (
              <span className="flex items-center gap-1.5 text-[10px] text-green-600 font-bold uppercase">
                <CheckCircle className="w-3 h-3" /> Live on Website
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] text-red-500 font-bold uppercase">
                <Clock className="w-3 h-3" /> Hidden from Public
              </span>
            )}
          </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-brand-bg">
              <h3 className="font-display font-bold">
                {editingTeacher ? `Edit ${editingTeacher.name}` : 'Add New Teacher'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-black/5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Photo Upload Section */}
              <div className="flex items-center gap-6 p-4 bg-brand-bg rounded-2xl border border-dashed border-primary/20">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-white shadow-md overflow-hidden flex items-center justify-center">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-dark text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary transition-colors">
                    <Plus className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  </label>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-brand-dark mb-1">Teacher Photo</h4>
                  <p className="text-[10px] text-gray-500 leading-tight">Recommended: Square (1:1) facial portrait. Max size: 2MB.</p>
                  {photoFile && (
                    <button 
                      type="button" 
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-2 hover:underline"
                    >
                      Remove Selection
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input-field" placeholder="Mr./Mrs. ..." value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div>
                  <label className="label">Subject(s)</label>
                  <input className="input-field" placeholder="e.g. Mathematics" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Qualification</label>
                  <input className="input-field" placeholder="e.g. M.Sc. Math" value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} />
                </div>
                <div>
                  <label className="label">Speciality</label>
                  <input className="input-field" placeholder="e.g. Concept Expert" value={form.speciality} onChange={e => setForm({...form, speciality: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Experience (Years)</label>
                  <input type="number" className="input-field" placeholder="Number only" value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} required />
                </div>
                <div>
                  <label className="label">Rating (1–5)</label>
                  <input type="number" step="0.1" max="5" min="1" className="input-field" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} required />
                </div>
              </div>

              <div>
                <label className="label">Priority Order (Optional)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="e.g. 1, 2, 3... (Empty for auto-sorting)" 
                  value={form.priorityOrder} 
                  onChange={e => setForm({...form, priorityOrder: e.target.value})} 
                  disabled={editingTeacher && coreFacultyNames.includes(editingTeacher.name)}
                />
                {editingTeacher && coreFacultyNames.includes(editingTeacher.name) && (
                  <p className="text-[10px] text-gray-400 mt-1 italic">* Priority is fixed for core faculty members</p>
                )}
              </div>

              <div className="pt-4">
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {isSubmitting ? 'Uploading...' : editingTeacher ? 'Save Changes' : 'Add Teacher to SRM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
