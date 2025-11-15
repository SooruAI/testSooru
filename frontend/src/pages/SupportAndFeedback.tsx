import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Rating from '@mui/material/Rating';
import { Button, Stack, Chip, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import './SupportAndFeedback.css';
import { API_URL } from '../config';

const API_BASE_URL = API_URL;

interface FormData {
  subject: string;
  message: string;
  image: File | null;
}

interface FeedbackData {
  name: string;
  email: string;
  rating: number;
  category: string;
  feedback: string;
}

interface SectionTitleProps {
  children: React.ReactNode;
  delay?: number;
}


const SupportAndFeedback: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  useEffect(() => {
    const checkTheme = () => {
      const savedTheme = localStorage.getItem("theme");
      const newIsDarkMode = savedTheme === "dark";
      setIsDarkMode(newIsDarkMode);
      document.body.classList.toggle("dark", newIsDarkMode);
    };

    checkTheme();
    window.addEventListener("storage", checkTheme);
    const interval = setInterval(checkTheme, 100);

    return () => {
      window.removeEventListener("storage", checkTheme);
      clearInterval(interval);
    };
  }, []);

  const [supportForm, setSupportForm] = useState<FormData>({
    subject: '',
    message: '',
    image: null
  });

  const [feedbackForm, setFeedbackForm] = useState<FeedbackData>({
    name: '',
    email: '',
    rating: 0,
    category: '',
    feedback: ''
  });

  const [isSubmittingSupport, setIsSubmittingSupport] = useState<boolean>(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [supportSuccess, setSupportSuccess] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  // Keep existing JS dark-mode fallback, but styles are now isolated to .sf-* classes
  useEffect(() => {
    const applyDarkModeStyles = () => {
      if (isDarkMode) {
        document.querySelectorAll('.sf-container').forEach(container => {
          (container as HTMLElement).style.backgroundColor = '#000000';
        });

        document.querySelectorAll('.sf-card').forEach(card => {
          (card as HTMLElement).style.background = 'rgba(29, 29, 31, 0.8)';
          (card as HTMLElement).style.backdropFilter = 'blur(20px)';
          (card as HTMLElement).style.border = '1px solid rgba(255, 255, 255, 0.1)';
          (card as HTMLElement).style.color = '#ffffff';
        });

        document.querySelectorAll('.sf-input, .sf-textarea, .sf-select').forEach(input => {
          (input as HTMLElement).style.background = 'rgba(29, 29, 31, 0.9)';
          (input as HTMLElement).style.border = '1px solid rgba(255, 255, 255, 0.2)';
          (input as HTMLElement).style.color = '#ffffff';
        });

        document.querySelectorAll('.sf-label').forEach(label => {
          (label as HTMLElement).style.color = '#ffffff';
        });
      } else {
        document.querySelectorAll('.sf-container').forEach(container => {
          (container as HTMLElement).style.backgroundColor = '';
        });

        document.querySelectorAll('.sf-card').forEach(card => {
          (card as HTMLElement).style.background = '';
          (card as HTMLElement).style.backdropFilter = '';
          (card as HTMLElement).style.border = '';
          (card as HTMLElement).style.color = '';
        });

        document.querySelectorAll('.sf-input, .sf-textarea, .sf-select').forEach(input => {
          (input as HTMLElement).style.background = '';
          (input as HTMLElement).style.border = '';
          (input as HTMLElement).style.color = '';
        });

        document.querySelectorAll('.sf-label').forEach(label => {
          (label as HTMLElement).style.color = '';
        });
      }
    };

    applyDarkModeStyles();
  }, [isDarkMode]);

  const handleSupportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingSupport(true);

    try {
      const userProfileRaw = localStorage.getItem("userProfile");
      if (!userProfileRaw) {
        window.location.href = "/login";
        return;
      }

      const userProfile = JSON.parse(userProfileRaw);
      const formData = new FormData();

      formData.append("subject", supportForm.subject);
      formData.append("message", supportForm.message);
      if (supportForm.image) {
        const imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(supportForm.image as File);
        });
        formData.append("image", imageBase64);
      }
      formData.append("name", `${userProfile.first_name || ""} ${userProfile.last_name || ""}`);
      formData.append("email", userProfile.email || "");
      const response = await fetch(`${API_BASE_URL}/support`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to submit support request");

      setSupportSuccess(true);
      setSupportForm({ subject: "", message: "", image: null });
    } catch (err) {
      console.error(err);
      alert("There was an error submitting your request.");
    } finally {
      setIsSubmittingSupport(false);
      setTimeout(() => setSupportSuccess(false), 3000);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);

    try {
      const userProfileRaw = localStorage.getItem("userProfile");
      if (!userProfileRaw) {
        window.location.href = "/login";
        return;
      }

      const userProfile = JSON.parse(userProfileRaw);
      const payload = {
        name: `${userProfile.first_name || ""} ${userProfile.last_name || ""}`,
        email: userProfile.email || "",
        rating: feedbackForm.rating,
        category: feedbackForm.category,
        feedback: feedbackForm.feedback,
      };

      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to submit feedback");

      setFeedbackSuccess(true);
      setFeedbackForm({ name: "", email: "", rating: 0, category: "", feedback: "" });
    } catch (err) {
      console.error(err);
      alert("There was an error submitting your feedback.");
    } finally {
      setIsSubmittingFeedback(false);
      setTimeout(() => setFeedbackSuccess(false), 3000);
    }
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSupportForm(prev => ({ ...prev, image: file }));
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} sf-container`}>
      <main className="sf-content">
        {/* Support Section */}
        <section className="sf-section">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="sf-card"
            style={{ maxWidth: '90vw', margin: '30px auto 0 auto' }}
          >
            <div className="sf-card-header">
              <img
                src="/i10.png"
                alt="Support Icon"
                style={{ width: '50px', height: '50px' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <h3 className="sf-card-title">Get Help & Support</h3>
              <p className="sf-card-description" style={{ marginBottom: '2rem' }}>
                Need assistance? Our support team is here to help you with any technical issues,
                questions about our platform, or guidance on using Sooru.AI effectively.
              </p>
            </div>

            {supportSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sf-success"
              >
                Support request submitted successfully! We'll get back to you soon.
              </motion.div>
            )}

            <form onSubmit={handleSupportSubmit}>
              <div className="sf-field">
                <label htmlFor="support-subject" className="sf-label">
                  Subject *
                </label>
                <input
                  id="support-subject"
                  type="text"
                  required
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="sf-input"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div className="sf-field">
                <label htmlFor="support-message" className="sf-label">
                  Message *
                </label>
                <textarea
                  id="support-message"
                  required
                  rows={6}
                  value={supportForm.message}
                  onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                  className="sf-textarea"
                  placeholder="Please provide detailed information about your issue or question..."
                />
              </div>

              <div className="sf-field">
                <Stack spacing={1.5}>
                  <Typography component="label" htmlFor="support-image" className="sf-label"
                    sx={{ display: 'block', color: '#ffffff' }}>
                    Attach Screenshot (Optional)
                  </Typography>

                  <Button variant="outlined" startIcon={<UploadFileIcon />} component="label">
                    Choose image
                    <input
                      id="support-image"
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>

                  {supportForm.image && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={supportForm.image.name}
                        sx={{ color: '#ffffff' }}
                        onDelete={() => setSupportForm(prev => ({ ...prev, image: null }))}
                      />
                      <Typography variant="caption" className="sf-hint">
                        {Math.round((supportForm.image.size || 0) / 1024)} KB
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </div>


              <button
                type="submit"
                disabled={isSubmittingSupport}
                className={`sf-btn ${isSubmittingSupport ? 'sf-btn-disabled' : ''}`}
              >
                {isSubmittingSupport ? 'Submitting...' : 'Submit Support Request'}
              </button>
            </form>
          </motion.div>
        </section>
        {/* Feedback Section */}
        <section className="sf-section" style={{ marginTop: '4rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="sf-card"
            style={{ maxWidth: '90vw', margin: '0 auto' }}
          >
            <div className="sf-card-header">
              <img
                src="/i11.png"
                alt="Feedback Icon"
                style={{ width: '50px', height: '50px' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <h3 className="sf-card-title">We Value Your Opinion</h3>
              <p className="sf-card-description" style={{ marginBottom: '2rem' }}>
                Help us improve Sooru.AI by sharing your experience, suggestions, and ideas.
                Your feedback drives our innovation and helps us serve you better.
              </p>
            </div>

            {feedbackSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sf-success"
              >
                Thank you for your valuable feedback! We appreciate your input.
              </motion.div>
            )}

            <form onSubmit={handleFeedbackSubmit}>
              <div className="sf-field">
                <label htmlFor="feedback-category" className="sf-label">Category *</label>
                <select
                  id="feedback-category"
                  required
                  value={feedbackForm.category}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, category: e.target.value }))}
                  className="sf-select"
                >
                  <option value="">Select a category</option>
                  <option value="user-experience">User Experience</option>
                  <option value="features">Features & Functionality</option>
                  <option value="performance">Performance</option>
                  <option value="bug-report">Bug Report</option>
                  <option value="feature-request">Feature Request</option>
                  <option value="general">General Feedback</option>
                </select>
              </div>
              <div className="sf-field">
                <label className="sf-label">Overall Rating *</label>
                <Rating
                  name="feedback-rating"
                  value={feedbackForm.rating}
                  onChange={(_, newValue) => {
                    setFeedbackForm(prev => ({ ...prev, rating: newValue || 0 }));
                  }}
                  size="large"
                  sx={{
                    '& .MuiRating-iconEmpty': {
                      color: isDarkMode ? '#ffffff' : '#000000', // white in dark, black in light
                    },
                    '& .MuiRating-iconFilled': {
                      color: '#facc15', // yellow-400
                    },
                    '& .MuiRating-iconHover': {
                      color: '#facc15',
                    },
                  }}
                />
              </div>

              <div className="sf-field">
                <label htmlFor="feedback-message" className="sf-label">Your Feedback *</label>
                <textarea
                  id="feedback-message"
                  required
                  rows={6}
                  value={feedbackForm.feedback}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, feedback: e.target.value }))}
                  className="sf-textarea"
                  placeholder="Share your thoughts, suggestions, or experiences with Sooru.AI..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingFeedback || feedbackForm.rating === 0}
                className={`sf-btn ${isSubmittingFeedback || feedbackForm.rating === 0 ? 'sf-btn-disabled' : ''}`}
              >
                {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </motion.div>
        </section>
      </main>
    </div>
  );
};

export default SupportAndFeedback;
