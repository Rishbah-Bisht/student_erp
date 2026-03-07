import React from 'react';
import { X, Download, Printer, Loader2 } from 'lucide-react';

const ReceiptPreviewModal = ({ isOpen, onClose, blobUrl, onDownload, filename }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: '95vw', width: '900px', height: '95vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '16px 24px', background: 'var(--erp-primary)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Printer size={20} />
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Receipt Preview</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-sm btn-outline" style={{ color: '#414141', borderColor: 'rgba(255,255,255,0.3)' }} onClick={onDownload}>
                            <Download size={16} /> Download
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
                            <Loader2 className="spin" size={32} />
                            <p style={{ marginTop: 12 }}>Generating PDF...</p>
                        </div>
                    ) : (
                        <iframe
                            src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                            title="Receipt Preview"
                            style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 24px', background: 'var(--erp-bg2)', display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--erp-border)' }}>
                    <button className="btn btn-outline" onClick={onClose}>Close</button>
                    <button className="btn btn-primary" onClick={onDownload}>
                        <Download size={16} /> Save Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptPreviewModal;
