import React from 'react';
import { MessageSquare, Phone, Mail, ShieldAlert, ChevronRight } from 'lucide-react';
import StudentLayout from '../components/StudentLayout';

const ContactSupport = () => {
    return (
        <StudentLayout title="Contact & Support">
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
                {/* Header Card */}
                <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-md p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="p-5 bg-white/10 backdrop-blur-md rounded-md">
                            <ShieldAlert size={40} className="text-blue-400" />
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-black tracking-tight mb-2">Need Help or Found a Bug?</h1>
                            <p className="text-blue-100/70 font-medium text-lg lg:max-w-md">
                                We're committed to providing you with a seamless experience. If something isn't working, let us know!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Instruction Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-md p-8 border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-600">
                                <MessageSquare size={24} />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">How to Report</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-md border border-gray-100">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-black text-blue-600 shadow-sm flex-shrink-0">1</div>
                                <p className="text-gray-600 font-medium leading-relaxed">
                                    Take a <span className="text-blue-600 font-bold">screenshot</span> of the issue or the bug you've found.
                                </p>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-md border border-gray-100">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-black text-blue-600 shadow-sm flex-shrink-0">2</div>
                                <p className="text-gray-600 font-medium leading-relaxed">
                                    Send that screenshot along with a brief description to the support number below.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-md p-8 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center space-y-6">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-2">
                            <Phone size={32} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">WhatsApp / Call Support</p>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight">+91 - 7906639729</h3>
                        </div>
                        <a
                            href="https://wa.me/917906639729"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-600/20 group"
                        >
                            Send on WhatsApp
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>

                {/* Additional Channels */}
                <div className="bg-white rounded-md p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                        <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                        Direct Support Channels
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-md border border-gray-50 bg-gray-50/50 flex items-center gap-4">
                            <div className="p-3 bg-white rounded-md text-blue-600 shadow-sm">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Call Support</p>
                                <p className="font-black text-gray-800">7906639729</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-md border border-gray-50 bg-gray-50/50 flex items-center gap-4">
                            <div className="p-3 bg-white rounded-md text-blue-600 shadow-sm">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Email Us</p>
                                <p className="font-black text-gray-800">rishabhbisht69@gmail.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default ContactSupport;
