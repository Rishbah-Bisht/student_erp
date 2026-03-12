import React from 'react';
import { X, Download, Printer, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ReceiptPreviewModal = ({ isOpen, onClose, blobUrl, onDownload, filename }) => {
    const { t } = useLanguage();
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: '95vw', width: '900px', height: '95vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '16px 24px', background: 'var(--erp-primary)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Printer size={20} />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{t('Receipt Preview')}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-sm btn-outline" style={{ color: '#414141', borderColor: 'rgba(255,255,255,0.3)' }} onClick={onDownload}>
                            <Download size={16} /> {t('Download')}
                        </button>
                        <button
                            onClick={onClose}
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', color: '#fff', padding: 6, cursor: 'pointer' }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div style={{ flex: 1, background: '#525659', position: 'relative', overflow: 'hidden' }}>
                    {!blobUrl ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <Loader2 className="animate-spin" size={32} />
                            <p style={{ marginTop: 12 }}>{t('Generating PDF...')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop/Tablet Iframe */}
                            <div className="hidden md:block" style={{ width: '100%', height: '100%' }}>
                                <iframe
                                    src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                    title="Receipt Preview"
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                />
                            </div>

                            {/* Mobile Placeholder (Android/iOS often fail to show PDF in iframe) */}
                            <div className="block md:hidden" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 20, textAlign: 'center' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: 24, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.2)' }}>
                                    <Download size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>{t('Ready to Save')}</h3>
                                    <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: 24, maxWidth: 280 }}>
                                        {t('PDF preview is limited on mobile device. Please save the receipt to view it.')}
                                    </p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={onDownload}
                                        style={{ width: '100%', padding: '12px 24px' }}
                                    >
                                        <Download size={18} /> {t('Save Receipt')}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 24px', background: 'var(--erp-bg2)', display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--erp-border)' }}>
                    <button className="btn btn-outline" onClick={onClose}>{t('Close')}</button>
                    <button className="btn btn-primary" onClick={onDownload}>
                        <Download size={16} /> {t('Save Receipt')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptPreviewModal;
