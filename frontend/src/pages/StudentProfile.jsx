import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    User, Mail, Calendar, MapPin,
    Lock, RefreshCcw, AlertTriangle,
    CheckCircle2, Users, Home, GraduationCap,
    Phone, CreditCard, School, ExternalLink,
    ChevronRight, Award
} from 'lucide-react';

const InfoCard = ({ icon: Icon, label, value, colorClass = "bg-blue-50 text-blue-600" }) => (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${colorClass}`}>
            <Icon size={20} />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-sm font-bold text-gray-800 truncate">{value || '—'}</p>
        </div>
    </div>
);

const BatchDetailModal = ({ isOpen, onClose, batch, room }) => {
    if (!isOpen || !batch) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-md w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                <div className="p-8 bg-gray-900 text-white flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Assigned Batch Details</p>
                        <h3 className="text-2xl font-black">{batch.name}</h3>
                    </div>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Classroom</p>
                            <p className="text-sm font-bold text-gray-800">{room || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Course Type</p>
                            <p className="text-sm font-bold text-gray-800">{batch.course || 'Academic'}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Batch Subjects</p>
                        <div className="flex flex-wrap gap-2">
                            {batch.subjects?.map(s => (
                                <span key={s} className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100">{s}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all">Close Details</button>
                </div>
            </div>
        </div>
    );
};

const StudentProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

    // Password Reset State
    const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwdLoading, setPwdLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('studentToken');
        if (!token) {
            navigate('/student/login');
            return;
        }

        api.get('/api/student/me')
            .then(res => {
                if (res.data.success) {
                    setStudent(res.data.student);
                }
            })
            .catch(err => {
                console.error('Error fetching profile:', err);
                setError('Failed to load profile data.');
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    const handlePwdChange = (e) => {
        setPwdData({ ...pwdData, [e.target.name]: e.target.value });
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (pwdData.newPassword !== pwdData.confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        setPwdLoading(true);
        try {
            const res = await api.post('/api/student/reset-password', {
                currentPassword: pwdData.currentPassword,
                newPassword: pwdData.newPassword
            });
            if (res.data.success) {
                setSuccess('Password updated successfully.');
                setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setPwdLoading(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout title="Student Profile">
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <RefreshCcw className="animate-spin text-blue-600" size={32} />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Synchronizing Identity...</p>
                </div>
            </StudentLayout>
        );
    }

    if (!student) return null;

    return (
        <StudentLayout title="Academic Identity">
            <div className="max-w-7xl mx-auto space-y-8 px-0 sm:px-0 pb-20 pt-8 animate-in fade-in duration-500">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: Enrollment Hub (Sticky Info) */}
                    <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
                        <div className="bg-white rounded-md border border-gray-100 p-8 shadow-sm space-y-8">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="h-24 w-24 rounded-md bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-4xl font-black shadow-xl shadow-blue-200">
                                    {student.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{student.name}</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{student.rollNo}</p>
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-gray-50">
                                <div className="flex items-center gap-3">
                                    <School size={18} className="text-blue-500" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enrollment Hub</span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Class / Level</p>
                                        <p className="text-sm font-bold text-gray-800">{student.className || 'Not Assigned'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Batch</p>
                                        <div
                                            onClick={() => setIsBatchModalOpen(true)}
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors group"
                                        >
                                            <p className="text-sm font-black underline decoration-2 underline-offset-4">{student.batchName}</p>
                                            <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Admission Date</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            <p className="text-sm font-bold text-gray-800">{student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB') : '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column: Identity & Family */}
                    <div className="lg:col-span-9 space-y-8">

                        {/* Identity & Family Grid */}
                        <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/20">
                                <User size={20} className="text-blue-500" />
                                <h3 className="text-xs font-black text-gray-800 uppercase tracking-[0.2em]">Identity & Family Context</h3>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InfoCard icon={Calendar} label="Date of Birth" value={student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '—'} colorClass="bg-blue-50 text-blue-500" />
                                <InfoCard icon={User} label="Gender" value={student.gender} colorClass="bg-indigo-50 text-indigo-500" />
                                <InfoCard icon={Phone} label="Primary Contact" value={student.contact} colorClass="bg-emerald-50 text-emerald-500" />
                                <InfoCard icon={Mail} label="Email Address" value={student.email} colorClass="bg-sky-50 text-sky-500" />
                                <InfoCard icon={Users} label="Father's Name" value={student.fatherName} colorClass="bg-slate-50 text-slate-500" />
                                <InfoCard icon={Users} label="Mother's Name" value={student.motherName} colorClass="bg-slate-50 text-slate-500" />
                                <InfoCard icon={CreditCard} label="Registration Fee" value={`₹${student.registrationFee || 0}`} colorClass="bg-violet-50 text-violet-500" />
                                <InfoCard icon={MapPin} label="Residence" value={student.address} colorClass="bg-rose-50 text-rose-500" />
                            </div>
                        </div>

                        {/* Subject Allocations & Rooms */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Academic Allocations */}
                            <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                                    <div className="flex items-center gap-3">
                                        <Home size={20} className="text-indigo-500" />
                                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-[0.2em]">Academic Workspace</h3>
                                    </div>
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg border border-indigo-100">ROOM: {student.roomAllocation || 'N/A'}</span>
                                </div>
                                <div className="p-8 flex-1">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <GraduationCap size={14} /> Subject Specialists
                                        </p>
                                        <div className="space-y-3">
                                            {student.subjectTeachers && student.subjectTeachers.length > 0 ? (
                                                student.subjectTeachers.map((st, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-white hover:shadow-sm transition-all group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-xs font-black text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                                {st.subject[0].toUpperCase()}
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-700">{st.subject}</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-400">{st.teacher}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-6 text-gray-400 italic text-xs">No allocations recorded.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Security / Password Reset */}
                            <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/20">
                                    <Lock size={20} className="text-rose-500" />
                                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-[0.2em]">Security Access</h3>
                                </div>
                                <div className="p-8">
                                    {(error || success) && (
                                        <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 animate-in slide-in-from-top-2 ${error ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                            {error ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                                            <span className="text-xs font-bold">{error || success}</span>
                                        </div>
                                    )}
                                    <form onSubmit={handleResetPassword} className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                                            <input
                                                type="password" name="currentPassword" required
                                                value={pwdData.currentPassword} onChange={handlePwdChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:bg-white outline-none transition-all text-sm font-bold"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                                            <input
                                                type="password" name="newPassword" required
                                                value={pwdData.newPassword} onChange={handlePwdChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:bg-white outline-none transition-all text-sm font-bold"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <button
                                            type="submit" disabled={pwdLoading}
                                            className="w-full py-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-gray-100"
                                        >
                                            {pwdLoading ? 'Validating...' : 'Update Credentials'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <BatchDetailModal
                    isOpen={isBatchModalOpen}
                    onClose={() => setIsBatchModalOpen(false)}
                    batch={student.fullBatchData}
                    room={student.roomAllocation}
                />
            </div>
        </StudentLayout>
    );
};

export default StudentProfile;
