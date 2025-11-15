import React, { useState, useRef, useEffect } from 'react';
import { Package, ChevronDown, ChevronUp, Search, ArrowLeft, Sofa, Bed, Armchair, Lamp, Monitor, Coffee, Car, TreePine, Flower, Home, Camera, Palette } from 'lucide-react';
import './ObjectPanel.css';

interface ObjectPanelProps {
    onClose: () => void;
    onObjectPlace?: (modelPath: string, modelData: any) => void;
    cameraMode: string;
    placedObjects?: Array<{
        id: string;
        name: string;
        modelPath: string;
        imagePath: string;
        description: string;
        author: string;
        license: string;
        position: any;
    }>;
    onObjectSelect?: (objectId: string) => void;
    selectedObjectId?: string;
}

// Collapsible Section Component
function CollapsibleSection({
    title,
    children,
    defaultExpanded = true
}: {
    title: string,
    children: React.ReactNode,
    defaultExpanded?: boolean
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className="section-collapsible">
            <button
                className="section-collapsible__header-btn"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="section-collapsible__title-text">{title}</span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {isExpanded && (
                <div className="section-collapsible__body-content">
                    {children}
                </div>
            )}
        </div>
    );
}

const ObjectPanel: React.FC<ObjectPanelProps> = ({
    onClose,
    onObjectPlace,
    cameraMode,
    placedObjects = [],
    onObjectSelect,
    selectedObjectId
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [selectedModel, setSelectedModel] = useState<any>(null);
    const [showModelDetails, setShowModelDetails] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Object Categories with models
    const OBJECT_CATEGORIES = {
        sofa: {
            name: 'Sofas',
            icon: Sofa,
            models: [
                {
                    id: 'sofa-1',
                    name: 'Dark Gray Classic Sofa',
                    modelPath: '/model/model/sofa-1.glb',
                    imagePath: '/Objects/image-view/sofa-1.png',
                    description: 'Classic dark gray two-seater sofa with patterned throw pillows',
                    author: 'katjagricishina - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-2',
                    name: 'Brown Chesterfield Sofa',
                    modelPath: '/model/model/sofa-2.glb',
                    imagePath: '/Objects/image-view/sofa-2.png',
                    description: 'Elegant brown leather Chesterfield sofa with deep button tufting and rolled arms.',
                    author: 'afernandezdelara - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-3',
                    name: 'White Slipcover Sofa',
                    modelPath: '/model/model/sofa-3.glb',
                    imagePath: '/Objects/image-view/sofa-3.png',
                    description: 'Casual white slipcover sofa with plush cushions and a relaxed silhouette.',
                    author: 'vasycrukov - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-4',
                    name: 'White Slipcover Sofa',
                    modelPath: '/model/model/sofa-4.glb',
                    imagePath: '/Objects/image-view/sofa-4.png',
                    description: 'Casual white slipcover sofa with plush cushions and a relaxed silhouette.',
                    author: '3dimentionalben - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-5',
                    name: 'Brown Recliner Armchair',
                    modelPath: '/model/model/sofa-5.glb',
                    imagePath: '/Objects/image-view/sofa-5.png',
                    description: 'Plush brown leather recliner armchair with padded armrests and back.',
                    author: 'Serious Black 19 - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-6',
                    name: 'Dark Fabric Modern Sofa',
                    modelPath: '/model/model/sofa-6.glb',
                    imagePath: '/Objects/image-view/sofa-6.png',
                    description: 'Modern dark gray fabric sofa with slender arms and loose back cushions.',
                    author: 'Filipe.Soares - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-7',
                    name: 'Traditional Wood Settee',
                    modelPath: '/model/model/sofa-7.glb',
                    imagePath: '/Objects/image-view/sofa-7.png',
                    description: 'Traditional dark wood settee with striped upholstered cushions and ornate arms.',
                    author: 'Mehdi Shahsavan - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-8',
                    name: 'Brown Tufted Sofa',
                    modelPath: '/model/model/sofa-8.glb',
                    imagePath: '/Objects/image-view/sofa-8.png',
                    description: 'Brown upholstered sofa with button tufting on the backrest and rounded arms.',
                    author: 'Siba Santosh Das - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-9',
                    name: 'Gray Modern Sofa',
                    modelPath: '/model/model/sofa-9.glb',
                    imagePath: '/Objects/image-view/sofa-9.png',
                    description: 'Contemporary gray sofa with clean lines and a minimalist design.',
                    author: 'MaX3Dd - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-10',
                    name: 'Brown Loveseat',
                    modelPath: '/model/model/sofa-10.glb',
                    imagePath: '/Objects/image-view/sofa-10.png',
                    description: 'Compact brown loveseat with rounded back and arms, accented by a single throw pillow.',
                    author: 'AK STUDIO - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-11',
                    name: 'Blue Victorian Chaise',
                    modelPath: '/model/model/sofa-11.glb',
                    imagePath: '/Objects/image-view/sofa-11.png',
                    description: 'Elegant blue upholstered chaise lounge with dark wood frame and bolster pillows.',
                    author: 'ryankentpaule - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-12',
                    name: 'White L-Shape Sectional',
                    modelPath: '/model/model/sofa-12.glb',
                    imagePath: '/Objects/image-view/sofa-12.png',
                    description: 'Modern white L-shaped sectional sofa with multiple back cushions and a low profile.',
                    author: 'Medhatelo - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-13',
                    name: 'White L-Shape Sectional 2',
                    modelPath: '/model/model/sofa-13.glb',
                    imagePath: '/Objects/image-view/sofa-13.png',
                    description: 'Modern white L-shaped sectional sofa with multiple back cushions and a low profile on a dark base.',
                    author: 'Augusto.Angulo - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-14',
                    name: 'Green Sectional Sofa',
                    modelPath: '/model/model/sofa-14.glb',
                    imagePath: '/Objects/image-view/sofa-14.png',
                    description: 'Modern green sectional sofa with an ottoman, adorned with various throw pillows and a plaid blanket.',
                    author: 'GreenG - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-15',
                    name: 'Brown Armless Chair',
                    modelPath: '/model/model/sofa-15.glb',
                    imagePath: '/Objects/image-view/sofa-15.png',
                    description: 'Plush brown armless chair with loose, oversized cushions and three dark throw pillows.',
                    author: 'Naira - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-16',
                    name: 'Gray Futon Sofa',
                    modelPath: '/model/model/sofa-16.glb',
                    imagePath: '/Objects/image-view/sofa-16.png',
                    description: 'Minimalist gray futon sofa with an open back design and dark wood legs.',
                    author: 'Augusto.Angulo - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-17',
                    name: 'Brown Minimalist Sofa',
                    modelPath: '/model/model/sofa-17.glb',
                    imagePath: '/Objects/image-view/sofa-17.png',
                    description: 'Sleek brown leather sofa with a minimalist design, floating armrests, and a dark metal frame.',
                    author: 'uday - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-18',
                    name: 'Black Fabric Bench',
                    modelPath: '/model/model/sofa-18.glb',
                    imagePath: '/Objects/image-view/sofa-18.png',
                    description: 'Simple black fabric bench-style sofa with a low back and tapered wood legs.',
                    author: 'Mehdi Shahsavan - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-19',
                    name: 'Black Modern Sofa',
                    modelPath: '/model/model/sofa-19.glb',
                    imagePath: '/Objects/image-view/sofa-19.png',
                    description: 'Modern black sofa with wide arms, tufted seat, and two light gray throw pillows.',
                    author: 'AK STUDIO - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-20',
                    name: 'Bubble Sofa',
                    modelPath: '/model/model/sofa-20.glb',
                    imagePath: '/Objects/image-view/sofa-20.png',
                    description: 'Unique blue sofa composed of numerous rounded, bubble-like forms.',
                    author: '5th Dimension - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-21',
                    name: 'Blue Fabric Chaise Sofa',
                    modelPath: '/model/model/sofa-21.glb',
                    imagePath: '/Objects/image-view/sofa-21.png',
                    description: 'Modern blue fabric sofa with a left-hand chaise, supported by a light wood frame and legs.',
                    author: 'Heliona - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-22',
                    name: 'Sculptural Chaise',
                    modelPath: '/model/model/sofa-22.glb',
                    imagePath: '/Objects/image-view/sofa-22.png',
                    description: 'Curved blue and pink sculptural chaise lounge with two accent pillows.',
                    author: 'Mustafa Özgen - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-23',
                    name: 'Tufted Daybed',
                    modelPath: '/model/model/sofa-23.glb',
                    imagePath: '/Objects/image-view/sofa-23.png',
                    description: 'Light gray tufted daybed with three detachable back cushions and two bolster pillows.',
                    author: 'ynechaev - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-24',
                    name: 'Mid-Century Modern Sofa',
                    modelPath: '/model/model/sofa-24.glb',
                    imagePath: '/Objects/image-view/sofa-24.png',
                    description: 'Mid-century modern sofa with cream tufted upholstery, wooden arms, and metal legs.',
                    author: 'JohnnyP - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-25',
                    name: 'Teal Button-Tufted Sofa',
                    modelPath: '/model/model/sofa-25.glb',
                    imagePath: '/Objects/image-view/sofa-25.png',
                    description: 'Mid-century style teal sofa with button-tufted backrest and angled wooden legs.',
                    author: 'Siba Santosh Das - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-26',
                    name: 'Gray Minimalist Loveseat',
                    modelPath: '/model/model/sofa-26.glb',
                    imagePath: '/Objects/image-view/sofa-26.png',
                    description: 'Minimalist gray loveseat with a distinctive curved wooden frame and white metal legs.',
                    author: 'd-luX - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-27',
                    name: 'Beige Modular Sofa',
                    modelPath: '/model/model/sofa-27.glb',
                    imagePath: '/Objects/image-view/sofa-27.png',
                    description: 'Modern beige modular sofa with rectangular armrests topped with dark wood.',
                    author: 'primavera - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-28',
                    name: 'Industrial Wood Sofa',
                    modelPath: '/model/model/sofa-28.glb',
                    imagePath: '/Objects/image-view/sofa-28.png',
                    description: 'Industrial-style sofa with dark gray cushions, distressed wood side panels, and black metal legs.',
                    author: 'Sandipan.Chakraborty - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-29',
                    name: 'Black and White Sectional',
                    modelPath: '/model/model/sofa-29.glb',
                    imagePath: '/Objects/image-view/sofa-29.png',
                    description: 'Modern black-framed sectional sofa with white cushions and gray throw pillows.',
                    author: 'dylanheyes - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-30',
                    name: 'Diamond Tufted Sofa Set',
                    modelPath: '/model/model/sofa-30.glb',
                    imagePath: '/Objects/image-view/sofa-30.png',
                    description: 'Brown sofa with a geometric diamond-tufted backrest and a matching ottoman.',
                    author: 'X 3D STUDIO - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-31',
                    name: 'Gray Modern Sofa',
                    modelPath: '/model/model/sofa-31.glb',
                    imagePath: '/Objects/image-view/sofa-31.png',
                    description: 'Modern gray sofa with a low profile and wide arms, featuring two light gray throw pillows.',
                    author: 'easysheasy - CGTrader',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'sofa-32',
                    name: 'White Curved Sofa',
                    modelPath: '/model/model/sofa-32.glb',
                    imagePath: '/Objects/image-view/sofa-32.png',
                    description: 'Contemporary white curved sofa with a unique dark brown base and scrolled arms.',
                    author: '3D SHARE 2 - Sketchfab',
                    license: 'CC BY 4.0'
                },
            ]
        },
        chair: {
            name: 'Chairs',
            icon: Armchair,
            models: [
                {
                    id: 'chair-1',
                    name: 'Classic Cane Chairr',
                    modelPath: '/model/model/chair-1.glb',
                    imagePath: '/Objects/image-view/chair-1.png',
                    description: 'Traditional dark wood dining chair with a cane seat and spindle backrest.',
                    author: 'shuvalov.di - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-2',
                    name: 'Rustic Wood Chair',
                    modelPath: '/model/model/chair-2.glb',
                    imagePath: '/Objects/image-view/chair-2.png',
                    description: 'Simple rustic wooden chair with a slatted backrest and distressed seat.',
                    author: 'vUv - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-3',
                    name: 'Black Mesh Office Chair',
                    modelPath: '/model/model/chair-3.glb',
                    imagePath: '/Objects/image-view/chair-3.png',
                    description: 'Standard black office chair with a mesh backrest, padded seat, and rolling base.',
                    author: 'j.a.m - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-4',
                    name: 'Blue Office Chair',
                    modelPath: '/model/model/chair-4.glb',
                    imagePath: '/Objects/image-view/chair-4.png',
                    description: 'Basic blue upholstered task chair with a black rolling base and fixed armrests.',
                    author: '3D SHARE 2 - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-5',
                    name: 'Tufted Wingback Chair',
                    modelPath: '/model/model/chair-5.glb',
                    imagePath: '/Objects/image-view/chair-5.png',
                    description: 'Ornate black leather wingback armchair with diamond tufting and decorative studs.',
                    author: 'Dirtrock - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-6',
                    name: 'Black Office Chair',
                    modelPath: '/model/model/chair-6.glb',
                    imagePath: '/Objects/image-view/chair-6.png',
                    description: 'Ergonomic black office chair with a high back, padded seat, and rolling base.',
                    author: 'artvolodskikh - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-7',
                    name: 'Modern Swivel Chairs',
                    modelPath: '/model/model/chair-7.glb',
                    imagePath: '/Objects/image-view/chair-7.png',
                    description: 'Pair of modern swivel chairs, one light gray and one black, with unique four-star bases.',
                    author: 'Aliosa - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-8',
                    name: 'Cantilever Dining Chair',
                    modelPath: '/model/model/chair-8.glb',
                    imagePath: '/Objects/image-view/chair-8.png',
                    description: 'Minimalist black dining chair with a padded seat and backrest on a cantilevered frame.',
                    author: '3D SHARE 2 - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-9',
                    name: 'Dark Wood Spindle Chair',
                    modelPath: '/model/model/chair-9.glb',
                    imagePath: '/Objects/image-view/chair-9.png',
                    description: 'Traditional dark wood dining chair with a spindle back and contoured seat.',
                    author: 'Araon - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-10',
                    name: 'Blue Folding Chair',
                    modelPath: '/model/model/chair-10.glb',
                    imagePath: '/Objects/image-view/chair-10.png',
                    description: 'Simple blue padded folding chair with a black metal frame.',
                    author: 'Francesco Coldesina - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-11',
                    name: 'Executive Office Chair',
                    modelPath: '/model/model/chair-11.glb',
                    imagePath: '/Objects/image-view/chair-11.png',
                    description: 'Large black executive office chair with a high back, padded arms, and rolling base.',
                    author: 'Pricey1600 - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-12',
                    name: 'Wooden Armchair',
                    modelPath: '/model/model/chair-12.glb',
                    imagePath: '/Objects/image-view/chair-12.png',
                    description: 'Contemporary black dining chair with a molded plastic seat and wooden legs.',
                    author: 'rfinterior - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-13',
                    name: 'Dark Wood Panel Chair',
                    modelPath: '/model/model/chair-13.glb',
                    imagePath: '/Objects/image-view/chair-13.png',
                    description: 'Traditional dark wood dining chair with a high panel back and a rustic seat.',
                    author: 'Erika Dejnes [YuYuna Art] - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-14',
                    name: 'Green Wingback Chair',
                    modelPath: '/model/model/chair-14.glb',
                    imagePath: '/Objects/image-view/chair-14.png',
                    description: 'Classic green wingback armchair with wooden arm accents and tapered legs.',
                    author: 'A18K - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-15',
                    name: 'Upholstered Dining Chair',
                    modelPath: '/model/model/chair-15.glb',
                    imagePath: '/Objects/image-view/chair-15.png',
                    description: 'Traditional dining chair with a wooden frame, upholstered seat, and a curved backrest.',
                    author: 'shuvalov.di - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-16',
                    name: 'Brown Captain Chair',
                    modelPath: '/model/model/chair-16.glb',
                    imagePath: '/Objects/image-view/chair-16.png',
                    description: 'Traditional brown captain chair with a round seat, spindle back, and small rolling casters.',
                    author: 'Matthew Collings - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-17',
                    name: 'Black & White Gaming Chair',
                    modelPath: '/model/model/chair-17.glb',
                    imagePath: '/Objects/image-view/chair-17.png',
                    description: 'Stylish black and white gaming chair with a high back, contoured design, and rolling base.',
                    author: 'snjvsngh_negi - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-18',
                    name: 'Ornate Dining Chair',
                    modelPath: '/model/model/chair-18.glb',
                    imagePath: '/Objects/image-view/chair-18.png',
                    description: 'Dark wood dining chair with a high, intricately carved back and a patterned upholstered seat.',
                    author: 'Abdullah Mohammed - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-19',
                    name: 'Black Blue Hanging Chair',
                    modelPath: '/model/model/chair-19.glb',
                    imagePath: '/Objects/image-view/chair-19.png',
                    description: 'Black metal hanging chair with a geometric pattern, suspended from a stand, and featuring blue cushions.',
                    author: 'a.shevchuk - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-20',
                    name: 'Black Swivel Stool',
                    modelPath: '/model/model/chair-20.glb',
                    imagePath: '/Objects/image-view/chair-20.png',
                    description: 'Simple black swivel stool with a padded round seat and a five-star rolling base.',
                    author: 'Giimann - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-21',
                    name: 'Futuristic Pod Chair',
                    modelPath: '/model/model/chair-21.glb',
                    imagePath: '/Objects/image-view/chair-21.png',
                    description: 'Futuristic pod chair in gray and red, with a unique spherical design and a padded interior.',
                    author: 'CGulia - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-22',
                    name: 'Gray Plastic Patio Chair',
                    modelPath: '/model/model/chair-22.glb',
                    imagePath: '/Objects/image-view/chair-22.png',
                    description: 'Simple gray plastic patio chair with a slatted back and seat, and integrated armrests.',
                    author: 'Kuutti Siitonen - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-23',
                    name: 'Blue Striped Deck Chair',
                    modelPath: '/model/model/chair-23.glb',
                    imagePath: '/Objects/image-view/chair-23.png',
                    description: 'Classic wooden deck chair with blue and white striped fabric.',
                    author: 'Helsingr - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-24',
                    name: 'Antique Banker Chair',
                    modelPath: '/model/model/chair-24.glb',
                    imagePath: '/Objects/image-view/chair-24.png',
                    description: 'Antique wooden banker chair with a green upholstered seat and back, on a rolling swivel base.',
                    author: 'hoschu - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-25',
                    name: 'Wooden Dining Chair',
                    modelPath: '/model/model/chair-25.glb',
                    imagePath: '/Objects/image-view/chair-25.png',
                    description: 'Wood dining chair with a curved backrest and a green upholstered seat.',
                    author: 'shuvalov.di - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-26',
                    name: 'Mid-Century Modern Chair',
                    modelPath: '/model/model/chair-26.glb',
                    imagePath: '/Objects/image-view/chair-26.png',
                    description: 'Mid-century modern chair with a light gray molded plastic seat and a dark wire and wood base.',
                    author: 'furnny - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-27',
                    name: 'Black Office Chair',
                    modelPath: '/model/model/chair-27.glb',
                    imagePath: '/Objects/image-view/chair-27.png',
                    description: 'Contemporary black office chair with a low back, padded seat, and a five-star rolling base.',
                    author: 'thethieme - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-28',
                    name: 'Blue Sling Chaise Lounge',
                    modelPath: '/model/model/chair-28.glb',
                    imagePath: '/Objects/image-view/chair-28.png',
                    description: 'Blue sling chaise lounge with a black metal frame, suitable for outdoor relaxation and pools.',
                    author: 'AleixoAlonso - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-29',
                    name: 'Red Plastic Stool',
                    modelPath: '/model/model/chair-29.glb',
                    imagePath: '/Objects/image-view/chair-29.png',
                    description: 'Simple red plastic stool with a square top and four sturdy legs.',
                    author: 'iperbole - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'chair-30',
                    name: 'Green Barrel Chair',
                    modelPath: '/model/model/chair-30.glb',
                    imagePath: '/Objects/image-view/chair-30.png',
                    description: 'Modern green barrel chair with black legs and a white accent pillow.',
                    author: 'PatelDev - Sketchfab',
                    license: 'CC BY 4.0'
                }
            ]
        },
        bed: {
            name: 'Beds',
            icon: Bed,
            models: [
                {
                    id: 'bed-1',
                    name: 'Metal Frame Single Bed',
                    modelPath: '/model/model/bed-1.glb',
                    imagePath: '/Objects/image-view/bed-1.png',
                    description: 'Traditional single bed with a black metal frame featuring ornate finials, a gray pillow, and dark brown and light gray bedding.',
                    author: 'Znyth Technologies - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-2',
                    name: 'Modern Platform Bed',
                    modelPath: '/model/model/bed-2.glb',
                    imagePath: '/Objects/image-view/bed-2.png',
                    description: 'Modern platform bed with a dark headboard and light gray and white bedding.',
                    author: 'hectopod - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-3',
                    name: 'Wooden Platform Bed',
                    modelPath: '/model/model/bed-3.glb',
                    imagePath: '/Objects/image-view/bed-3.png',
                    description: 'Simple wooden platform bed with a dark frame, white pillows, and black and red-grid accent pillows.',
                    author: 'Ankledot - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-4',
                    name: 'Minimalist Double Bed',
                    modelPath: '/model/model/bed-4.glb',
                    imagePath: '/Objects/image-view/bed-4.png',
                    description: 'Minimalist double bed with a dark headboard and frame, featuring white sheets and two white pillows, accompanied by a matching dark brown nightstand.',
                    author: 'Render - City - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-5',
                    name: 'Wooden Frame Bed',
                    modelPath: '/model/model/bed-5.glb',
                    imagePath: '/Objects/image-view/bed-5.png',
                    description: 'Simple wooden bed frame with light gray pillows and bedding.',
                    author: 'Susidko Studio - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-6',
                    name: 'Ornate Carved Bed',
                    modelPath: '/model/model/bed-6.glb',
                    imagePath: '/Objects/image-view/bed-6.png',
                    description: 'Traditional wood bed with intricate carvings on the headboard and footboard, and simple white bedding.',
                    author: 'Maxmalow - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-7',
                    name: 'Blue Upholstered Bed',
                    modelPath: '/model/model/bed-7.glb',
                    imagePath: '/Objects/image-view/bed-7.png',
                    description: 'Modern blue upholstered bed with a slightly angled headboard, white and gray bedding, two minimalist white lamps, and a dark brown nightstand on the left.',
                    author: 'Doaa Sheha - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-8',
                    name: 'Ornate Canopy Bed',
                    modelPath: '/model/model/bed-8.glb',
                    imagePath: '/Objects/image-view/bed-8.png',
                    description: 'Dark wood four-poster canopy bed with intricate carvings, white mattress, and draped light gray fabric.',
                    author: 'JmCVoyager - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-9',
                    name: 'Red Pixelated Bed',
                    modelPath: '/model/model/bed-9.glb',
                    imagePath: '/Objects/image-view/bed-9.png',
                    description: 'A low-resolution red and white pixelated bed with a dark brown frame.',
                    author: 'JDanielhes - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-10',
                    name: 'Minimalist Double Bed',
                    modelPath: '/model/model/bed-10.glb',
                    imagePath: '/Objects/image-view/bed-10.png',
                    description: 'Minimalist double bed with a dark gray frame, white headboard accents, two striped pillows, and a blue duvet.',
                    author: 'thethieme - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-11',
                    name: 'Black Upholstered Bed',
                    modelPath: '/model/model/bed-11.glb',
                    imagePath: '/Objects/image-view/bed-11.png',
                    description: 'Black upholstered bed with a slightly curved headboard, two white pillows, and a gray duvet.',
                    author: 'rickmaolly - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-12',
                    name: 'Traditional Wood Victorian Bed',
                    modelPath: '/model/model/bed-12.glb',
                    imagePath: '/Objects/image-view/bed-12.png',
                    description: 'Traditional wood bed with a classic curved headboard and footboard, featuring a light gray patterned mattress and two gray pillows.',
                    author: 'Abdullah Mohammed - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-13',
                    name: 'Wooden Platform Bed',
                    modelPath: '/model/model/bed-13.glb',
                    imagePath: '/Objects/image-view/bed-13.png',
                    description: 'A wood platform bed with a matching headboard and footboard, a gray duvet, and two red and black checkered pillows.',
                    author: 'rerwandi - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-14',
                    name: 'Modern Upholstered Bed',
                    modelPath: '/model/model/bed-14.glb',
                    imagePath: '/Objects/image-view/bed-14.png',
                    description: 'A modern bed with a tall, light gray ribbed upholstered headboard featuring two integrated wooden and metallic sconces. The bed frame is made of wood, and it has light gray bedding with two white pillows.',
                    author: '5th Dimension - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-15',
                    name: 'Gray Upholstered Bed',
                    modelPath: '/model/model/bed-15.glb',
                    imagePath: '/Objects/image-view/bed-15.png',
                    description: 'A gray upholstered bed with a tall, paneled headboard and light gray bedding.',
                    author: 'Eduard - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-16',
                    name: 'Ornate Metal Bed',
                    modelPath: '/model/model/bed-16.glb',
                    imagePath: '/Objects/image-view/bed-16.png',
                    description: 'An ornate white metal bed frame with a heart motif and a pink mattress.',
                    author: 'cebraVFX - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-17',
                    name: 'Hospital Bed',
                    modelPath: '/model/model/bed-17.glb',
                    imagePath: '/Objects/image-view/bed-17.png',
                    description: 'A modern hospital bed with a blue mattress, light gray blanket, and gray pillow, featuring adjustable gray head and footboards, and rolling wheels.',
                    author: 'Ansh_Singla - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-18',
                    name: 'Wooden Bunk Beds',
                    modelPath: '/model/model/bed-18.glb',
                    imagePath: '/Objects/image-view/bed-18.png',
                    description: 'A set of wooden bunk beds with simple frames. The top bunk has a mattress with a blue and white plaid blanket, and the bottom bunk has a mattress with dark blue and gray bedding.',
                    author: 'Blender3D - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-19',
                    name: 'Classic Sleigh Bed',
                    modelPath: '/model/model/bed-19.glb',
                    imagePath: '/Objects/image-view/bed-19.png',
                    description: 'A dark wood sleigh bed with a curved headboard and footboard, featuring four turned posts and simple white bedding with three pillows.',
                    author: '3DDomino - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-20',
                    name: 'Bed Mattress',
                    modelPath: '/model/model/bed-20.glb',
                    imagePath: '/Objects/image-view/bed-20.png',
                    description: 'A white mattress with a quilted top, dark gray side panels, and a subtle blue stripe.',
                    author: '3DWORLD.cbi - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-21',
                    name: 'Wooden Bunk Beds',
                    modelPath: '/model/model/bed-21.glb',
                    imagePath: '/Objects/image-view/bed-21.png',
                    description: 'A set of wooden bunk beds with simple frames, featuring mattresses with patterned light gray and dark gray bedding.',
                    author: 'Francesco Coldesina - Sketchfab',
                    license: 'CC BY 4.0'
                },
                {
                    id: 'bed-22',
                    name: 'Wooden Bunk Beds',
                    modelPath: '/model/model/bed-22.glb',
                    imagePath: '/Objects/image-view/bed-22.png',
                    description: 'A set of wooden bunk beds with a simple design, featuring a light wood frame and white bedding.',
                    author: '3D SHARE 2 - Sketchfab',
                    license: 'CC BY 4.0'
                },
            ]
        },
        lighting: {
            name: 'Lighting',
            icon: Lamp,
            models: [
                {
                    id: 'lamp-1',
                    name: 'Floor Lamp',
                    modelPath: '/model/model/lamp-1.glb',
                    imagePath: '/Objects/image-view/lamp-1.png',
                    description: 'Modern floor lamp with fabric shade',
                    author: 'Light Studio',
                    license: 'CC BY 4.0'
                }
            ]
        },
        electronics: {
            name: 'Electronics',
            icon: Monitor,
            models: [
            ]
        },
        table: {
            name: 'Tables',
            icon: Coffee,
            models: [
            ]
        },
        decoration: {
            name: 'Decorations',
            icon: Flower,
            models: [
                {
                    id: 'decoration-1',
                    name: 'Aston Martin AMR23',
                    modelPath: '/model/model/deco-1.glb',
                    imagePath: '/Objects/image-view/deco-1.png',
                    description: 'Aston Martin AMR23 Formula 1 car model.',
                    author: 'Redgrund',
                    license: 'CC BY 4.0'
                }
            ]
        }
    };

    const blockAllEvents = (e: React.MouseEvent | React.WheelEvent) => {
        e.stopPropagation();
    };

    useEffect(() => {
        const panel = panelRef.current;
        if (!panel) return;

        const handleWheel = (e: WheelEvent) => {
            e.stopPropagation();
            e.preventDefault();
        };

        panel.addEventListener('wheel', handleWheel, { passive: false });
        return () => panel.removeEventListener('wheel', handleWheel);
    }, []);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const handleModelClick = (model: any) => {
        if (cameraMode === 'orbit') {
            if (onObjectPlace) {
                onObjectPlace(model.modelPath, model);
            }
        } else {
            setSelectedModel(model);
            setShowModelDetails(true);
        }
    };

    const handlePlacedObjectClick = (objectId: string) => {
        if (onObjectSelect) {
            onObjectSelect(objectId);
        }
    };

    const filteredModels = (categoryModels: any[]) => {
        return categoryModels.filter(model =>
            model.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const getAllModels = () => {
        return Object.values(OBJECT_CATEGORIES).flatMap(category => category.models);
    };

    const getSearchResults = () => {
        if (!searchTerm) return [];
        return getAllModels().filter(model =>
            model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            model.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    if (showModelDetails && selectedModel) {
        return (
            <div
                ref={panelRef}
                className="panel-objects-browser"
                onMouseDown={blockAllEvents}
                onMouseMove={blockAllEvents}
                onMouseUp={blockAllEvents}
                onClick={blockAllEvents}
                onDoubleClick={blockAllEvents}
                onWheel={blockAllEvents}
            >
                <div className="panel-objects-browser__header-section">
                    <div className="panel-objects-browser__header-content-wrapper">
                        <Package size={20} className="panel-objects-browser__header-icon-main" />
                        <h2 className="panel-objects-browser__title-heading">Object Details</h2>
                    </div>
                    <button onClick={() => setShowModelDetails(false)} className="panel-objects-browser__close-btn">
                        ×
                    </button>
                </div>

                <div className="panel-objects-browser__content-area">
                    <div className="details-object-view">
                        <img
                            src={selectedModel.imagePath}
                            alt={selectedModel.name}
                            className="details-object-view__image-preview"
                        />
                        <h3 className="details-object-view__title-text">{selectedModel.name}</h3>
                        <p className="details-object-view__description-text">{selectedModel.description}</p>
                        <div className="details-object-view__meta-info">
                            <p><strong>Author:</strong> {selectedModel.author}</p>
                            <p><strong>License:</strong> {selectedModel.license}</p>
                        </div>
                        {cameraMode === 'orbit' && (
                            <button
                                className="details-object-view__place-action-btn"
                                onClick={() => {
                                    if (onObjectPlace) {
                                        onObjectPlace(selectedModel.modelPath, selectedModel);
                                    }
                                    setShowModelDetails(false);
                                }}
                            >
                                <Package size={16} />
                                Place Object
                            </button>
                        )}
                        <button
                            className="details-object-view__back-nav-btn"
                            onClick={() => setShowModelDetails(false)}
                        >
                            <ArrowLeft size={16} />
                            Back to Objects
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={panelRef}
            className="panel-objects-browser"
            onMouseDown={blockAllEvents}
            onMouseMove={blockAllEvents}
            onMouseUp={blockAllEvents}
            onClick={blockAllEvents}
            onDoubleClick={blockAllEvents}
            onWheel={blockAllEvents}
        >
            <div className="panel-objects-browser__header-section">
                <div className="panel-objects-browser__header-content-wrapper">
                    <Package size={20} className="panel-objects-browser__header-icon-main" />
                    <h2 className="panel-objects-browser__title-heading">Objects</h2>
                </div>
                <button onClick={onClose} className="panel-objects-browser__close-btn">
                    ×
                </button>
            </div>

            <div className="panel-objects-browser__content-area">
                {/* Search */}
                <div className="search-input-container">
                    <div className="search-input-container__wrapper">
                        <Search size={16} className="search-input-container__icon" />
                        <input
                            type="text"
                            placeholder="Search objects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input-container__field"
                        />
                    </div>
                </div>

                {/* Search Results */}
                {searchTerm && (
                    <CollapsibleSection title={`Search Results (${getSearchResults().length})`} defaultExpanded={true}>
                        <div className="grid-models-list">
                            {getSearchResults().map((model) => (
                                <div
                                    key={model.id}
                                    className="item-model-card"
                                    onClick={() => handleModelClick(model)}
                                >
                                    <img
                                        src={model.imagePath}
                                        alt={model.name}
                                        className="item-model-card__image"
                                    />
                                    <div className="item-model-card__info">
                                        <span className="item-model-card__name">{model.name}</span>
                                        <span className="item-model-card__description">{model.description}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Object Categories */}
                {!searchTerm && (
                    <CollapsibleSection title="Categories" defaultExpanded={true}>
                        {Object.entries(OBJECT_CATEGORIES).map(([categoryKey, category]) => (
                            <div key={categoryKey} className="section-category-group">
                                <button
                                    className="section-category-group__header-btn"
                                    data-category={categoryKey} // Add this data attribute for CSS targeting
                                    onClick={() => toggleCategory(categoryKey)}
                                >
                                    <div className="section-category-group__header-content">
                                        <category.icon size={16} className="section-category-group__icon" />
                                        <span>{category.name}</span>
                                        <span className="section-category-group__count">({category.models.length})</span>
                                    </div>
                                    {expandedCategories[categoryKey] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {expandedCategories[categoryKey] && (
                                    <div className="section-category-group__content-body">
                                        <div className="grid-models-list">
                                            {filteredModels(category.models).map((model) => (
                                                <div
                                                    key={model.id}
                                                    className="item-model-card"
                                                    onClick={() => handleModelClick(model)}
                                                >
                                                    <img
                                                        src={model.imagePath}
                                                        alt={model.name}
                                                        className="item-model-card__image"
                                                    />
                                                    <div className="item-model-card__info">
                                                        <span className="item-model-card__name">{model.name}</span>
                                                        <span className="item-model-card__description">{model.description}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </CollapsibleSection>
                )}

                {/* Placed Objects */}
                {placedObjects.length > 0 && (
                    <CollapsibleSection title={`Placed Objects (${placedObjects.length})`} defaultExpanded={false}>
                        <div className="list-placed-objects">
                            {placedObjects.map((obj) => (
                                <div
                                    key={obj.id}
                                    className={`item-placed-object ${selectedObjectId === obj.id ? 'selected' : ''}`}
                                    onClick={() => handlePlacedObjectClick(obj.id)}
                                >
                                    <img
                                        src={obj.imagePath}
                                        alt={obj.name}
                                        className="item-placed-object__image"
                                    />
                                    <span className="item-placed-object__name">{obj.name}</span>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>
                )}
            </div>
        </div>
    );
};

export default ObjectPanel;