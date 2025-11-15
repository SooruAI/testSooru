import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Target, Lightbulb, Mail, Phone, Linkedin, Users, Layers, Eye, Sparkles, Lightbulb as LightbulbIcon, UsersRound, Target as TargetIcon } from 'lucide-react'

function AboutUs() {
    const teamMembers = [
        {
            name: 'Brijesh Shivakumar',
            title: 'CEO, Managing Director',
            image: '/images/brijesh.png',
            email: 'brijesh@sooru.ai',
            phone: '+91 97438 10910',
            linkedin: 'https://www.linkedin.com/in/brijeshbs'
        },
        {
            name: 'Chinmay Ravi',
            title: 'CTO, Lead AI Engineer',
            image: '/images/chinmay.png',
            email: 'r.chinmay@sooru.ai',
            phone: '+91 84318 93816',
            linkedin: 'https://www.linkedin.com/in/r-chinmay-b79a60192'
        },
        {
            name: 'Michael Stanley',
            title: 'COO, Head of Business Systems',
            image: '/images/michael.png',
            email: 'mike@sooru.ai',
            phone: '+91 97427 24935',
            linkedin: 'https://www.linkedin.com/in/michaelstanley1988'
        },
        {
            name: 'Ar. Clince Rodrigues',
            title: 'Head of Product Design',
            image: '/images/clince.png',
            email: 'clince.rodrigues@sooru.ai',
            phone: '+971 56 607 4450',
            linkedin: 'https://www.linkedin.com/in/clincerodrigues'
        }
    ]

    const whyChooseFeatures = [
        {
            icon: <Users size={32} />,
            title: 'Seamless Collaboration Between All Stakeholders',
            points: [
                'Unified Workspace',
                'Instant Feedback Loop',
                'Minimized Errors & Delays'
            ]
        },
        {
            icon: <Layers size={32} />,
            title: 'Integrated End-to-End Design Automation',
            points: [
                'Instant AI Generated Plans',
                'Interconnected Disciplines',
                'Seamless Industry Collab'
            ]
        },
        {
            icon: <Eye size={32} />,
            title: 'Enhanced Visualization & Immersive Experience.',
            points: [
                'AI-Driven Realism',
                'Interactive 3D and VR/AR',
                'Vast Customizable Library'
            ]
        }
    ]

    const keyValues = [
        {
            icon: <Sparkles size={28} />,
            title: 'Curiosity',
            description: 'To challenge traditions to build exceptional experiences.',
            color: '#2d3e96',
            color2: '#DFE4FF'
        },
        {
            icon: <LightbulbIcon size={28} />,
            title: 'Innovation',
            description: 'To redefine architecture with cutting-edge technology',
            color: '#C2540B',
            color2: '#FFEDE1'
        },
        {
            icon: <UsersRound size={28} />,
            title: 'Collaboration',
            description: 'To unite multiple stakeholders—architects, clients, and partners.',
            color: '#2d3e96',
            color2: '#DFE4FF'
        },
        {
            icon: <TargetIcon size={28} />,
            title: 'Accountability',
            description: 'To commit to projects with precise execution and total integrity.',
            color: '#C2540B',
            color2: '#FFEDE1'
        }
    ]

    return (
        <div className="app">
            <Navbar />
            
            <div className="about-page">
                {/* Hero Section with gradient */}
                <section className="about-hero">
                    <h1>
                        Built By Designers,<br />
                        <span className="highlight">For Designers.</span>
                    </h1>
                    <p className="about-subtitle">
                        Our AI is trained to eliminate workflow<br />
                        friction, not mentality
                    </p>
                </section>

                {/* Breadcrumb */}
                <div className="breadcrumb">
                    <a href="/">Home</a> / <span>About Us</span>
                </div>

                {/* Who Are We Section */}
                <section className="who-are-we">
                    <h2>Who Are We?</h2>
                    
                    <div className="about-content">
                        <div className="team-image">
                            <img src="/images/team.png" alt="Sooru.AI Team" />
                        </div>
                        
                        <div className="about-text">
                            <h3 className="about-heading">
                                TRANSFORMING ARCHITECTURAL<br />
                                VISION INTO BUILDING REALITY
                            </h3>
                            <p>
                                Sooru.ai is a revolutionary technology company committed 
                                to elevating architectural design. We empower architects, 
                                designers, and construction companies with AI tools that 
                                enhance creativity, improve precision, reduce project timelines, 
                                and guarantee buildable precision.
                            </p>
                            <p>
                                We aim to bridge the technical-creative chasm by using the best 
                                of large language models (LLMs) along with bespoke, fine-tuned 
                                AI that is inspired by decades of architectural firm workflows, allowing you 
                                to focus on the art of design and successfully turn every 
                                vision into a beautifully-crafted, functional architecture
                            </p>
                        </div>
                    </div>
                </section>

                {/* Supported By Section */}
                <section className="supported-by">
                    <h2>Supported By</h2>
                    
                    <div className="supporters">
                        <div className="supporter">
                            <img src="/images/karnataka-govt.png" alt="Government of Karnataka" />
                            <p>Government of Karnataka<br />Department of IT and BT</p>
                        </div>
                        <div className="supporter">
                            <img src="/images/iit-madras.png" alt="IIT Madras" />
                            <p>Indian Institute of Technology<br />Madras, Chennai</p>
                        </div>
                    </div>
                </section>

                {/* Vision & Mission Section with blue background */}
                <section className="vision-mission">
                    <div className="vm-card">
                        <div className="vm-icon">
                            <Target size={32} />
                        </div>
                        <h3>Vision</h3>
                        <p>
                            We aim to revolutionize design and construction by providing accessible, intelligent tools for the 
                            creation and real-time modification of spaces.
                        </p>
                    </div>
                    
                    <div className="vm-card">
                        <div className="vm-icon">
                            <Lightbulb size={32} />
                        </div>
                        <h3>Mission</h3>
                        <p>
                            Our mission is to transform construction by giving architects and builders AI tools for 
                            compliant, creative, and cost-effective design.
                        </p>
                    </div>
                </section>

                {/* The Soorians Team Section */}
                <section className="team-section">
                    <h2>The Soorians</h2>
                    
                    <div className="team-grid">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="team-member-card">
                                <div className="team-member-image">
                                    <img src={member.image} alt={member.name} />
                                </div>
                                <h3 className="team-member-name">{member.name}</h3>
                                <p className="team-member-title">{member.title}</p>
                                <div className="team-member-contact">
                                    <a href={`mailto:${member.email}`} className="contact-icon" aria-label="Email">
                                        <Mail size={18} />
                                    </a>
                                    <a href={`tel:${member.phone}`} className="contact-icon" aria-label="Phone">
                                        <Phone size={18} />
                                    </a>
                                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="contact-icon" aria-label="LinkedIn">
                                        <Linkedin size={18} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Why Choose Sooru.AI Section */}
                <section className="why-choose-section">
                    <h2>Why Choose Sooru.AI?</h2>
                    
                    <div className="why-choose-grid">
                        {whyChooseFeatures.map((feature, index) => (
                            <div key={index} className="why-choose-card">
                                <div className="why-choose-icon">
                                    {feature.icon}
                                </div>
                                <h3>{feature.title}</h3>
                                <ul>
                                    {feature.points.map((point, idx) => (
                                        <li key={idx}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Our Key Values Section */}
                <section className="key-values-section">
                    <h2>Our Key Values</h2>
                    
                    <div className="key-values-grid">
                        {keyValues.map((value, index) => (
                            <div key={index} className="key-value-card">
                                <div className="key-value-icon" style={{ backgroundColor: `${value.color2}` }}>
                                    <span style={{ color: value.color }}>
                                        {value.icon}
                                    </span>
                                </div>
                                <h3 style={{ color: value.color }}>{value.title}</h3>
                                <p style={{ color: value.color }}>{value.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <Footer bgColor="white" />
        </div>
    )
}

export default AboutUs