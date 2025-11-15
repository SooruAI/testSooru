import React, { useState, useRef, useEffect } from 'react';
import { Share2, Download, Link, Users, ChevronDown, ChevronUp, Camera, Box } from 'lucide-react';
import * as THREE from 'three';

interface ShareButtonProps {
    onExport: (format: string) => Promise<void>;
    onShare: (method: string) => Promise<void>;
    scene?: THREE.Scene;
    camera?: THREE.Camera;
    renderer?: THREE.WebGLRenderer;
    isExporting?: boolean;
    exportProgress?: {
        progress: number;
        stage: string;
    } | null;
}

const ShareButton: React.FC<ShareButtonProps> = ({
    onExport,
    onShare,
    scene,
    camera,
    renderer,
    isExporting = false,
    exportProgress
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        screenshot: false,
        model: false,
        share: false
    });
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Screenshot options
    const screenshotFormats = [
        {
            id: 'png',
            name: 'PNG Image',
            description: 'High-quality lossless image format',
            icon: <Download size={16} />
        },
        {
            id: 'jpeg',
            name: 'JPEG Image',
            description: 'Compressed image format, smaller file size',
            icon: <Download size={16} />
        },
        {
            id: 'pdf',
            name: 'PDF Document',
            description: 'Portable document with your design',
            icon: <Download size={16} />
        }
    ];

    // 3D Model export options
    const modelFormats = [
        {
            id: 'obj',
            name: 'OBJ Model',
            description: 'Wavefront OBJ 3D model file',
            icon: <Download size={16} />
        },
        {
            id: 'glb',
            name: 'GLB Model',
            description: 'Binary GLTF 3D model with textures',
            icon: <Download size={16} />
        },
        {
            id: 'gltf',
            name: 'GLTF Model',
            description: 'Standard 3D model format with animations',
            icon: <Download size={16} />
        }
    ];

    // Share options
    const shareOptions = [
        {
            id: 'link',
            name: 'Copy Link',
            description: 'Copy shareable link to clipboard',
            icon: <Link size={16} />
        },
        {
            id: 'social',
            name: 'Social Media',
            description: 'Share on social platforms',
            icon: <Users size={16} />
        }
    ];

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isMenuOpen]);

    // Close menu on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isMenuOpen]);

    const getCurrentExportingFormat = () => {
        const allFormats = [...screenshotFormats, ...modelFormats];
        return allFormats.find(format => 
            exportProgress?.stage?.toLowerCase().includes(format.name.toLowerCase())
        );
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const showSuccessAnimation = () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 600);
    };

    const handleExport = async (format: string) => {
        try {
            // Handle screenshot formats directly
            if (['png', 'jpeg', 'pdf'].includes(format)) {
                if (!renderer || !scene || !camera) {
                    throw new Error('Missing required components for screenshot export');
                }
                
                await handleScreenshotExport(format);
            } else {
                // For 3D model formats, delegate to parent handler
                await onExport(format);
            }
            showSuccessAnimation();
        } catch (error) {
            console.error('Export failed:', error);
            alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsMenuOpen(false);
        }
    };

    const handleScreenshotExport = async (format: string) => {
        if (!renderer || !scene || !camera) return;
        
        const originalSize = renderer.getSize(new THREE.Vector2());
        const exportWidth = 1920;
        const exportHeight = 1080;

        // Set render size for high quality export
        renderer.setSize(exportWidth, exportHeight);
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.aspect = exportWidth / exportHeight;
            camera.updateProjectionMatrix();
        }

        renderer.render(scene, camera);
        const canvas = renderer.domElement;

        let dataURL: string;
        let filename: string;

        switch (format) {
            case 'png':
                dataURL = canvas.toDataURL('image/png', 1.0);
                filename = 'floor-plan-3d.png';
                break;
            case 'jpeg':
                dataURL = canvas.toDataURL('image/jpeg', 0.95);
                filename = 'floor-plan-3d.jpeg';
                break;
            case 'pdf':
                // For PDF, we'll need to import jsPDF dynamically or handle it differently
                dataURL = canvas.toDataURL('image/jpeg', 0.95);
                filename = 'floor-plan-3d.pdf';
                // Note: PDF creation would need additional library
                alert('PDF export requires additional setup. Using JPEG instead.');
                filename = 'floor-plan-3d.jpeg';
                break;
            default:
                throw new Error(`Unsupported format: ${format}`);
        }

        // Restore original size
        renderer.setSize(originalSize.x, originalSize.y);
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.aspect = originalSize.x / originalSize.y;
            camera.updateProjectionMatrix();
        }

        // Download the image
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async (method: string) => {
        try {
            await onShare(method);
            showSuccessAnimation();
        } catch (error) {
            console.error('Share failed:', error);
            alert('Share failed. Please try again.');
        } finally {
            setIsMenuOpen(false);
        }
    };

    return (
        <div className="modern-share-container" ref={menuRef}>
            <button
                ref={buttonRef}
                className={`modern-share-button ${showSuccess ? 'success' : ''}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                title="Export & Share"
                aria-label="Export and share options"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                disabled={isExporting}
            >
                <Share2 size={20} className="share-icon" />
                {isExporting && (
                    <div className="loading-overlay">
                        <div className="loading-spinner" />
                    </div>
                )}
            </button>

            {isMenuOpen && (
                <div className="modern-share-menu" role="menu">
                    {/* Export Progress Indicator */}
                    {isExporting && exportProgress && (
                        <div className="export-progress">
                            <div className="export-progress-bar">
                                <div 
                                    className="export-progress-fill"
                                    style={{ width: `${exportProgress.progress}%` }}
                                />
                            </div>
                            <div className="export-progress-text">
                                {exportProgress.progress}% - {exportProgress.stage}
                            </div>
                        </div>
                    )}

                    {/* Screenshot Section */}
                    <div className="share-menu-section">
                        <button 
                            className="collapsible-header"
                            onClick={() => toggleSection('screenshot')}
                        >
                            <div className="collapsible-header-content">
                                <Camera size={16} />
                                <span>Screenshot</span>
                            </div>
                            {expandedSections.screenshot ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        
                        {expandedSections.screenshot && (
                            <div className="collapsible-content">
                                <div className="share-menu-items">
                                    {screenshotFormats.map((format) => (
                                        <button
                                            key={format.id}
                                            className="modern-share-menu-item"
                                            onClick={() => handleExport(format.id)}
                                            disabled={isExporting}
                                            data-format={format.id}
                                            title={format.description}
                                            role="menuitem"
                                        >
                                            <span className="share-menu-icon">{format.icon}</span>
                                            <div className="share-menu-content">
                                                <span className="share-menu-text">{format.name}</span>
                                                <span className="share-menu-description">{format.description}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3D Model Export Section */}
                    <div className="share-menu-section">
                        <button 
                            className="collapsible-header"
                            onClick={() => toggleSection('model')}
                        >
                            <div className="collapsible-header-content">
                                <Box size={16} />
                                <span>Export 3D Model</span>
                            </div>
                            {expandedSections.model ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        
                        {expandedSections.model && (
                            <div className="collapsible-content">
                                <div className="share-menu-items">
                                    {modelFormats.map((format) => (
                                        <button
                                            key={format.id}
                                            className="modern-share-menu-item"
                                            onClick={() => handleExport(format.id)}
                                            disabled={isExporting}
                                            data-format={format.id}
                                            title={format.description}
                                            role="menuitem"
                                        >
                                            <span className="share-menu-icon">{format.icon}</span>
                                            <div className="share-menu-content">
                                                <span className="share-menu-text">{format.name}</span>
                                                <span className="share-menu-description">{format.description}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Share Section */}
                    <div className="share-menu-section">
                        <button 
                            className="collapsible-header"
                            onClick={() => toggleSection('share')}
                        >
                            <div className="collapsible-header-content">
                                <Users size={16} />
                                <span>Share</span>
                            </div>
                            {expandedSections.share ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        
                        {expandedSections.share && (
                            <div className="collapsible-content">
                                <div className="share-menu-items">
                                    {shareOptions.map((option) => (
                                        <button
                                            key={option.id}
                                            className="modern-share-menu-item"
                                            onClick={() => handleShare(option.id)}
                                            disabled={isExporting}
                                            data-share={option.id}
                                            role="menuitem"
                                            title={option.description}
                                        >
                                            <span className="share-menu-icon">{option.icon}</span>
                                            <div className="share-menu-content">
                                                <span className="share-menu-text">{option.name}</span>
                                                <span className="share-menu-description">{option.description}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                /* Modern Share Button Container */
                .modern-share-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1001;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* Modern Share Button */
                .modern-share-button {
                    width: 54px;
                    height: 54px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(224, 231, 255, 0.8);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    user-select: none;
                    position: relative;
                    overflow: hidden;
                }

                .modern-share-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .modern-share-button:hover {
                    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                    border-color: #3b82f6;
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
                    color: #3b82f6;
                }

                .modern-share-button:hover::before {
                    opacity: 1;
                }

                .modern-share-button:active {
                    transform: translateY(-1px) scale(0.98);
                }

                .modern-share-button.success {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    animation: successPulse 0.6s ease;
                }

                @keyframes successPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }

                .share-icon {
                    transition: transform 0.3s ease;
                    z-index: 2;
                }

                .modern-share-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }

                .modern-share-button:disabled:hover {
                    transform: none;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
                    color: #64748b;
                    border-color: rgba(224, 231, 255, 0.8);
                }

                /* Loading Overlay */
                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(59, 130, 246, 0.9);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(4px);
                }

                .loading-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Modern Share Menu */
                .modern-share-menu {
                    position: absolute;
                    top: 64px;
                    right: 0;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(224, 231, 255, 0.8);
                    border-radius: 20px;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                    min-width: 280px;
                    animation: menuSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: hidden;
                }

                @keyframes menuSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                /* Menu Sections */
                .share-menu-section {
                    border-bottom: 1px solid rgba(224, 231, 255, 0.2);
                }

                .share-menu-section:last-child {
                    border-bottom: none;
                }
                .collapsible-header {
                    width: 100%;
                    background: none;
                    border: none;
                    padding: 16px 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                    border-bottom: 1px solid rgba(224, 231, 255, 0.3);
                }

                .collapsible-header:hover {
                    background: rgba(59, 130, 246, 0.05);
                    border-radius: 8px;
                }

                .collapsible-header-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 15px;
                    font-weight: 600;
                    color: #1e293b;
                    letter-spacing: -0.025em;
                }

                .collapsible-content {
                    padding: 12px 0 0 0;
                    animation: slideDown 0.3s ease;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .share-menu-items {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .modern-share-menu-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 14px;
                    border: none;
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: left;
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid rgba(224, 231, 255, 0.3);
                }

                .modern-share-menu-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .modern-share-menu-item:hover {
                    background: rgba(255, 255, 255, 0.8);
                    border-color: #3b82f6;
                    transform: translateX(4px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
                }

                .modern-share-menu-item:hover::before {
                    opacity: 1;
                }

                .modern-share-menu-item:active {
                    transform: translateY(-1px) scale(0.98);
                }

                .modern-share-menu-item:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                    pointer-events: none;
                }

                .share-menu-icon {
                    font-size: 18px;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s ease;
                    flex-shrink: 0;
                    z-index: 2;
                }

                .modern-share-menu-item:hover .share-menu-icon {
                    transform: scale(1.1);
                }

                .share-menu-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    z-index: 2;
                }

                .share-menu-text {
                    font-size: 14px;
                    color: #1e293b;
                    font-weight: 500;
                    line-height: 1.2;
                }

                .share-menu-description {
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.3;
                }

                .share-menu-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, rgba(224, 231, 255, 0.5) 50%, transparent 100%);
                    margin: 16px 0;
                    border: none;
                }

                /* Export Progress */
                .export-progress {
                    padding: 16px;
                    margin-bottom: 16px;
                    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                    border-radius: 12px;
                    border: 1px solid #bfdbfe;
                }

                .export-progress-bar {
                    width: 100%;
                    height: 6px;
                    background-color: #e0e7ff;
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }

                .export-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
                    transition: width 0.3s ease;
                    border-radius: 3px;
                }

                .export-progress-text {
                    font-size: 12px;
                    color: #1e40af;
                    text-align: center;
                    font-weight: 500;
                }

                /* Format-specific icon colors */
                .modern-share-menu-item[data-format="png"] .share-menu-icon,
                .modern-share-menu-item[data-format="jpeg"] .share-menu-icon,
                .modern-share-menu-item[data-format="pdf"] .share-menu-icon {
                    color: #3b82f6;
                }

                .modern-share-menu-item[data-format="obj"] .share-menu-icon {
                    color: #f59e0b;
                }

                .modern-share-menu-item[data-format="glb"] .share-menu-icon,
                .modern-share-menu-item[data-format="gltf"] .share-menu-icon {
                    color: #10b981;
                }

                .modern-share-menu-item[data-share="link"] .share-menu-icon {
                    color: #06b6d4;
                }

                .modern-share-menu-item[data-share="social"] .share-menu-icon {
                    color: #ec4899;
                }

                /* Mobile Responsiveness */
                @media (max-width: 768px) {
                    .modern-share-container {
                        top: 25px;
                        right: 15px;
                    }

                    // .modern-share-button {
                    //     width: 48px;
                    //     height: 48px;
                    // }

                    .modern-share-menu {
                        min-width: 260px;
                        padding: 16px;
                        top: 58px;
                    }

                    .modern-share-menu-item {
                        padding: 12px 14px;
                    }

                    .share-menu-icon {
                        font-size: 16px;
                        width: 20px;
                        height: 20px;
                    }

                    .share-menu-text {
                        font-size: 13px;
                    }

                    .share-menu-description {
                        font-size: 11px;
                    }
                }

                @media (max-width: 480px) {
                    .modern-share-button {
                        // width: 44px;
                        // height: 44px;
                    }

                    .modern-share-menu {
                        right: -10px;
                        min-width: 240px;
                        top: 54px;
                    }

                    .share-menu-title {
                        font-size: 13px;
                    }

                    .modern-share-menu-item {
                        padding: 10px 12px;
                    }

                    .share-menu-text {
                        font-size: 12px;
                    }

                    .share-menu-description {
                        font-size: 10px;
                    }
                }

                /* Accessibility */
                .modern-share-button:focus {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }

                .modern-share-menu-item:focus {
                    outline: 2px solid #3b82f6;
                    outline-offset: -2px;
                    background: rgba(59, 130, 246, 0.1);
                }
            `}</style>
        </div>
    );
};

export default ShareButton;