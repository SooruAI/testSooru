import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import './Contact.css';

interface FormData {
    firstName: string;
    lastName: string;
    companyName: string;
    email: string;
    phone: string;
    message: string;
}

interface Errors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
}

const Contact: React.FC = () => {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        const savedTheme = localStorage.getItem("theme");
        return savedTheme === "dark";
    });

    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        companyName: '',
        email: '',
        phone: '',
        message: ''
    });

    const [errors, setErrors] = useState<Errors>({});

    // Sync with theme changes
    useEffect(() => {
        const checkTheme = () => {
            const savedTheme = localStorage.getItem("theme");
            setIsDarkMode(savedTheme === "dark");
        };

        checkTheme();
        window.addEventListener("storage", checkTheme);
        const interval = setInterval(checkTheme, 100);

        return () => {
            window.removeEventListener("storage", checkTheme);
            clearInterval(interval);
        };
    }, []);

    const validateForm = (): boolean => {
        const newErrors: Errors = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            newErrors.email = 'Valid email is required';
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!formData.phone || !phoneRegex.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name as keyof Errors]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 10) {
            setFormData(prev => ({
                ...prev,
                phone: value
            }));
            if (errors.phone) {
                setErrors(prev => ({
                    ...prev,
                    phone: ''
                }));
            }
        }
    };

    const handleSubmit = (e: FormEvent) => {
        // Validate before submission
        if (!validateForm()) {
            e.preventDefault();
        }
        // If validation passes, form will submit normally to FormSubmit.co
    };

    return (
        <div className={`contact-page ${isDarkMode ? 'dark-mode' : ''}`}>
            {/* Hero Section */}
            <section className="contact-hero">
                <div className="contact-hero-content">
                    <h1>Ready to get started?</h1>
                    <p>
                        Creating floor plans for your home is<br />
                        now as easy as thinking
                    </p>
                    <button className="hero-cta-btn" onClick={() => navigate('/')}>
                        Get Started
                    </button>
                </div>
            </section>

            {/* Contact Content */}
            <div className="contact-content-wrapper">
                {/* Contact Information */}
                <div className="contact-info-section">
                    <div className="contact-info-card">
                        <div className="contact-icon">
                            <Mail size={24} />
                        </div>
                        <div className="contact-info-text">
                            <h3>Email</h3>
                            <a href="mailto:info@sooru.ai">info@sooru.ai</a>
                        </div>
                    </div>

                    <div className="contact-info-card">
                        <div className="contact-icon">
                            <Phone size={24} />
                        </div>
                        <div className="contact-info-text">
                            <h3>Phone</h3>
                            <a href="tel:+919743810910">+91 97438 10910</a>
                        </div>
                    </div>

                    <div className="contact-info-card">
                        <div className="contact-icon">
                            <MapPin size={24} />
                        </div>
                        <div className="contact-info-text">
                            <h3>Location</h3>
                            <p>
                                No. 816, 27th Main Road,<br />
                                Sector - 1, H S R Layout,<br />
                                Bengaluru 560 102
                            </p>
                        </div>
                    </div>

                    <div className="contact-social-links">
                        <a href="https://instagram.com/sooru.ai" target="_blank" rel="noopener noreferrer" className="social-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                        </a>
                        <a href="https://x.com/Sooru_AI" target="_blank" rel="noopener noreferrer" className="social-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                        <a href="https://www.linkedin.com/company/sooruai/" target="_blank" rel="noopener noreferrer" className="social-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11.75 20h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.25 12.268h-3v-5.604c0-1.337-.026-3.061-1.866-3.061-1.867 0-2.154 1.459-2.154 2.968v5.697h-3v-11h2.881v1.5h.041c.401-.761 1.381-1.562 2.844-1.562 3.042 0 3.604 2.002 3.604 4.604v6.458z" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="contact-form-section">
                    <h2>Contact Us</h2>
                    <form 
                        action="https://formsubmit.co/info@sooru.ai" 
                        method="POST"
                        onSubmit={handleSubmit}
                        className="contact-form"
                    >
                        {/* FormSubmit.co Configuration */}
                        <input type="hidden" name="_subject" value="New Contact Form Submission from Sooru.AI" />
                        <input type="hidden" name="_template" value="table" />
                        <input type="hidden" name="_next" value={`${window.location.origin}/thank-you`} />
                        <input type="hidden" name="_captcha" value="false" />

                        <div className="form-row">
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="First Name*"
                                    className={errors.firstName ? 'error' : ''}
                                    required
                                />
                                {errors.firstName && (
                                    <span className="error-message">{errors.firstName}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Last Name"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                placeholder="Company Name"
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email*"
                                className={errors.email ? 'error' : ''}
                                required
                            />
                            {errors.email && (
                                <span className="error-message">{errors.email}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                placeholder="Phone Number*"
                                maxLength={10}
                                className={errors.phone ? 'error' : ''}
                                required
                            />
                            {errors.phone && (
                                <span className="error-message">{errors.phone}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={5}
                                placeholder="Message"
                            />
                        </div>

                        <button type="submit" className="submit-btn">
                            Submit
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;