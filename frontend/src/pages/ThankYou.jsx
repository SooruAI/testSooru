import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import './Policy.css'

function ThankYou() {
    const navigate = useNavigate()

    useEffect(() => {
        // Optional: Auto-redirect after 10 seconds
        const timer = setTimeout(() => {
            navigate('/')
        }, 10000)

        return () => clearTimeout(timer)
    }, [navigate])

    return (
        <div className="app">

            <div className="thank-you-page">
                <div className="thank-you-container">
                    <div className="thank-you-icon">
                        <CheckCircle size={80} />
                    </div>

                    <h1>Thank You!</h1>

                    <p className="thank-you-message">
                        Your message has been successfully sent.<br />
                        We appreciate you reaching out to us.
                    </p>

                    <p className="thank-you-submessage">
                        Our team will review your message and get back to you as soon as possible,
                        typically within 24-48 hours.
                    </p>

                    <div className="thank-you-actions">
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/')}
                        >
                            Back to Home
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => navigate('/about')}
                        >
                            Learn More About Us
                        </button>
                    </div>

                    <p className="thank-you-redirect">
                        You will be automatically redirected to the homepage in 10 seconds...
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ThankYou