import React, { useState, useEffect } from "react";
import "./Profile.css";
import { API_URL } from "../config";

interface SocialMedia {
  id: number;
  platform_name: string;
  profile_url: string;
}

interface UserProfile {
  id: number;
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  occupation: string | null;
  about_self: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  address_line_3: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  social_media: SocialMedia[];
  website: string | null;
  projects_done: number;
  projects_deleted: number;
  projects_shared: number;
  projects_got_shared: number;
  display_picture: string | null;
  date_joined: string;
}

interface CompanyProfile {
  company_id: number;
  company_name: string;
  created_date: string;
  address_line_1: string | null;
  address_line_2: string | null;
  address_line_3: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  company_website: string | null;
  gst_number: string | null;
  company_type: string | null;
  number_of_people: number | null;
  admin_status: string;
  admin_email: string;
  social_media: SocialMedia[];
}

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"personal" | "company">("personal");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [userFormData, setUserFormData] = useState<any>({});
  const [companyFormData, setCompanyFormData] = useState<any>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const backendURL = `${API_URL}/auth`;

  const shouldShowCompanySection = (): boolean => {
    const userCompanyName = userProfile?.company_name?.trim();
    const companyName = companyProfile?.company_name?.trim();

    return !!(
      userCompanyName &&
      userCompanyName !== "" &&
      companyProfile &&
      companyName &&
      companyName !== ""
    );
  };

  useEffect(() => {
    const cachedProfile = localStorage.getItem("userProfile");
    const cachedCompany = localStorage.getItem("companyProfile");

    if (cachedProfile) {
      const profileData = JSON.parse(cachedProfile);
      const companyData = cachedCompany ? JSON.parse(cachedCompany) : null;

      setUserProfile(profileData);
      setCompanyProfile(companyData);

      const userFormWithSocial = {
        ...profileData,
        social_media_data:
          profileData.social_media?.map((sm: any) => ({
            ...sm,
            isExisting: true,
          })) || [],
      };

      const companyFormWithSocial = companyData
        ? {
          ...companyData,
          social_media_data:
            companyData.social_media?.map((sm: any) => ({
              ...sm,
              isExisting: true,
            })) || [],
        }
        : {};

      setUserFormData(userFormWithSocial);
      setCompanyFormData(companyFormWithSocial);
      setImagePreview(profileData.display_picture);
    } else {
      fetchProfile();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${backendURL}/profile/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
        setCompanyProfile(data.company);

        const userFormWithSocial = {
          ...data.profile,
          social_media_data:
            data.profile.social_media?.map((sm: any) => ({
              ...sm,
              isExisting: true,
            })) || [],
        };

        const companyFormWithSocial = data.company
          ? {
            ...data.company,
            social_media_data:
              data.company.social_media?.map((sm: any) => ({
                ...sm,
                isExisting: true,
              })) || [],
          }
          : {};

        setUserFormData(userFormWithSocial);
        setCompanyFormData(companyFormWithSocial);
        setImagePreview(data.profile.display_picture);

        if (
          !data.profile.company_name?.trim() ||
          !data.company?.company_name?.trim()
        ) {
          setActiveTab("personal");
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setImagePreview(base64String);
        setUserFormData({ ...userFormData, display_picture: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserInputChange = (field: string, value: string) => {
    setUserFormData({ ...userFormData, [field]: value });
  };

  const handleCompanyInputChange = (field: string, value: string) => {
    setCompanyFormData({ ...companyFormData, [field]: value });
  };

  const handleSocialMediaChange = (
    index: number,
    field: string,
    value: string,
    isUser: boolean
  ) => {
    const formData = isUser ? userFormData : companyFormData;
    const setFormData = isUser ? setUserFormData : setCompanyFormData;

    const socialMedia = [...(formData.social_media_data || [])];
    if (!socialMedia[index]) {
      socialMedia[index] = {
        platform_name: "",
        profile_url: "",
        isExisting: false,
      };
    }
    socialMedia[index][field] = value;

    setFormData({ ...formData, social_media_data: socialMedia });
  };

  const addSocialMedia = (isUser: boolean) => {
    const formData = isUser ? userFormData : companyFormData;
    const setFormData = isUser ? setUserFormData : setCompanyFormData;

    const socialMedia = [...(formData.social_media_data || [])];
    socialMedia.push({ platform_name: "", profile_url: "", isExisting: false });

    setFormData({ ...formData, social_media_data: socialMedia });
  };

  const removeSocialMedia = (index: number, isUser: boolean) => {
    const formData = isUser ? userFormData : companyFormData;
    const setFormData = isUser ? setUserFormData : setCompanyFormData;

    const socialMedia = [...(formData.social_media_data || [])];
    socialMedia.splice(index, 1);

    setFormData({ ...formData, social_media_data: socialMedia });
  };

  const updateUserProfile = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("access_token");

      const cleanedSocialMedia =
        userFormData.social_media_data
          ?.filter((sm: any) => sm.platform_name && sm.profile_url)
          ?.map((sm: any) => ({
            platform_name: sm.platform_name,
            profile_url: sm.profile_url,
          })) || [];

      const cleanedFormData = {
        ...userFormData,
        social_media_data: cleanedSocialMedia,
      };

      const response = await fetch(`${backendURL}/profile/update/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedFormData),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);

        const updatedFormData = {
          ...data.profile,
          social_media_data:
            data.profile.social_media?.map((sm: any) => ({
              ...sm,
              isExisting: true,
            })) || [],
        };
        setUserFormData(updatedFormData);

        localStorage.setItem("userProfile", JSON.stringify(data.profile));

        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile");
    } finally {
      setUpdating(false);
    }
  };

  const updateCompanyProfile = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("access_token");

      const cleanedSocialMedia =
        companyFormData.social_media_data
          ?.filter((sm: any) => sm.platform_name && sm.profile_url)
          ?.map((sm: any) => ({
            platform_name: sm.platform_name,
            profile_url: sm.profile_url,
          })) || [];

      const cleanedFormData = {
        ...companyFormData,
        social_media_data: cleanedSocialMedia,
      };

      const response = await fetch(`${backendURL}/company/update/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedFormData),
      });

      if (response.ok) {
        const data = await response.json();
        setCompanyProfile(data.company);

        const updatedFormData = {
          ...data.company,
          social_media_data:
            data.company.social_media?.map((sm: any) => ({
              ...sm,
              isExisting: true,
            })) || [],
        };
        setCompanyFormData(updatedFormData);

        localStorage.setItem("companyProfile", JSON.stringify(data.company));

        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating company profile:", error);
      alert("Error updating company profile");
    } finally {
      setUpdating(false);
    }
  };

  const getProfileCompletion = (profile: any): number => {
    if (!profile) return 0;
    const fields = Object.values(profile).filter(
      (value) => value !== null && value !== ""
    );
    return Math.round((fields.length / Object.keys(profile).length) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  // SVG Icons as components
  const CameraIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const BuildingIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21H21M5 21V7L12 3L19 7V21M9 9H10M14 9H15M9 13H10M14 13H15M9 17H10M14 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const MailIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const PhoneIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 16.92V19.92C22 20.52 21.52 21 20.92 21C9.4 21 0 11.6 0 0.08C0 -0.52 0.48 -1 1.08 -1H4.08C4.68 -1 5.16 -0.52 5.16 0.08V3.08L3.24 4.24C5.36 8.72 8.28 11.64 12.76 13.76L13.92 11.84H16.92C17.52 11.84 18 12.32 18 12.92V15.92" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const CompanyIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21H21M5 21V7L12 3L19 7V21M9 9H10M14 9H15M9 13H10M14 13H15M9 17H10M14 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const CalendarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
    </svg>
  );

  const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" />
      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" />
    </svg>
  );

  const XIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" />
      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
    </svg>
  );

  return (
    <div className="modern-profile-container">
      <div className="modern-profile-wrapper">
        {/* Enhanced Navigation Tabs */}
        <div className="modern-tab-container">
          <button
            className={
              activeTab === "personal"
                ? "modern-tab-active"
                : "modern-tab-inactive"
            }
            onClick={() => setActiveTab("personal")}
          >
            Personal Profile
          </button>
          {shouldShowCompanySection() && (
            <button
              className={
                activeTab === "company"
                  ? "modern-tab-active"
                  : "modern-tab-inactive"
              }
              onClick={() => setActiveTab("company")}
            >
              Company Profile
            </button>
          )}
        </div>

        {activeTab === "personal" && (
          <div className="modern-profile-layout">
            {/* Enhanced Hero Section */}
            <div className="modern-hero-section">
              <div className="modern-hero-content">
                {/* Larger Profile Image */}
                <div className="modern-image-container">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="modern-profile-image"
                    />
                  ) : (
                    <div className="modern-image-placeholder">
                      {userProfile?.first_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="modern-image-input"
                    id="modern-profile-upload"
                  />
                  <label
                    htmlFor="modern-profile-upload"
                    className="modern-image-edit-btn"
                  >
                    <CameraIcon />
                  </label>
                </div>

                {/* Enhanced Basic Info */}
                <div className="modern-basic-info">
                  <h1 className="modern-profile-name">
                    {userProfile?.first_name} {userProfile?.last_name}
                  </h1>
                  <p className="modern-profile-occupation">
                    {userProfile?.occupation}
                  </p>

                  <div className="modern-contact-grid">
                    <div className="modern-contact-item">
                      <MailIcon />
                      <span>{userProfile?.email}</span>
                    </div>
                    <div className="modern-contact-item">
                      <PhoneIcon />
                      <span>{userProfile?.phone_number}</span>
                    </div>
                    {userProfile?.company_name && (
                      <div className="modern-contact-item">
                        <CompanyIcon />
                        <span>{userProfile.company_name}</span>
                      </div>
                    )}

                  </div>
                </div>

                {/* Enhanced Progress Circle */}
                <div className="modern-completion-container">
                  <div className="modern-progress-ring">
                    <svg className="modern-progress-svg" viewBox="0 0 120 120">
                      <circle
                        className="modern-progress-bg"
                        cx="60"
                        cy="60"
                        r="54"
                      />
                      <circle
                        className="modern-progress-fill"
                        cx="60"
                        cy="60"
                        r="54"
                        style={{
                          strokeDasharray: `${getProfileCompletion(userProfile) * 3.39} 339`,
                        }}
                      />
                    </svg>
                    <div className="modern-progress-text">
                      <span className="modern-progress-number">
                        {getProfileCompletion(userProfile)}%
                      </span>
                      <span className="modern-progress-label">Complete</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="modern-content-grid">
              {/* Left Column */}
              <div className="modern-main-content">
                {/* Personal Information */}
                <div className="modern-card">
                  <h2 className="modern-card-title">Personal Information</h2>
                  <div className="modern-form-grid">
                    <div className="modern-input-group">
                      <label className="modern-label">First Name</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={userFormData.first_name || ""}
                        onChange={(e) =>
                          handleUserInputChange("first_name", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Last Name</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={userFormData.last_name || ""}
                        onChange={(e) =>
                          handleUserInputChange("last_name", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Occupation</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={userFormData.occupation || ""}
                        onChange={(e) =>
                          handleUserInputChange("occupation", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Website</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={userFormData.website || ""}
                        onChange={(e) =>
                          handleUserInputChange("website", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
                {/* About Section */}
                <div className="modern-card">
                  <div className="modern-card-header">
                    <h2 className="modern-card-title">About Me</h2>
                  </div>
                  <textarea
                    className="modern-textarea"
                    rows={4}
                    placeholder="Tell us about yourself..."
                    value={userFormData.about_self || ""}
                    onChange={(e) =>
                      handleUserInputChange("about_self", e.target.value)
                    }
                  />
                </div>

                {/* Social Media */}
                <div className="modern-card">
                  <div className="modern-card-header">
                    <h3 className="modern-card-title">Social Media</h3>
                    <button
                      onClick={() => addSocialMedia(true)}
                      className="modern-add-btn"
                    >
                      <PlusIcon />
                      Add
                    </button>
                  </div>
                  <div className="modern-social-list">
                    {(userFormData.social_media_data || []).map(
                      (social: any, index: number) => (
                        <div key={index} className="modern-social-row">
                          {social.isExisting ? (
                            <div className="modern-social-platform">
                              <strong>{social.platform_name}</strong>
                            </div>
                          ) : (
                            <select
                              className="modern-select"
                              value={social.platform_name || ""}
                              onChange={(e) =>
                                handleSocialMediaChange(
                                  index,
                                  "platform_name",
                                  e.target.value,
                                  true
                                )
                              }
                            >
                              <option value="">Platform</option>
                              <option value="LinkedIn">LinkedIn</option>
                              <option value="Instagram">Instagram</option>
                              <option value="Twitter">Twitter</option>
                              <option value="Facebook">Facebook</option>
                              <option value="YouTube">YouTube</option>
                            </select>
                          )}
                          <input
                            type="text"
                            placeholder="Profile URL"
                            className="modern-input modern-social-input"
                            value={social.profile_url || ""}
                            onChange={(e) =>
                              handleSocialMediaChange(
                                index,
                                "profile_url",
                                e.target.value,
                                true
                              )
                            }
                          />
                          {!social.isExisting && (
                            <button
                              onClick={() => removeSocialMedia(index, true)}
                              className="modern-remove-btn"
                            >
                              <XIcon />
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>




                {/* Address Section */}
                <div className="modern-card">
                  <h2 className="modern-card-title">Address</h2>
                  <div className="modern-address-grid">
                    <div className="modern-input-group">
                      <label className="modern-label">Address Line 1</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={userFormData.address_line_1 || ""}
                        onChange={(e) =>
                          handleUserInputChange("address_line_1", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Address Line 2</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={userFormData.address_line_2 || ""}
                        onChange={(e) =>
                          handleUserInputChange("address_line_2", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Address Line 3</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={userFormData.address_line_3 || ""}
                        onChange={(e) =>
                          handleUserInputChange("address_line_3", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">City</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={userFormData.city || ""}
                        onChange={(e) =>
                          handleUserInputChange("city", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">State</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={userFormData.state || ""}
                        onChange={(e) =>
                          handleUserInputChange("state", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Country</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={userFormData.country || ""}
                        onChange={(e) =>
                          handleUserInputChange("country", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Postal Code</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={userFormData.postal_code || ""}
                        onChange={(e) =>
                          handleUserInputChange("postal_code", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="modern-sidebar">

              </div>
            </div>

            {/* Update Button */}
            <div className="modern-update-container">
              <button
                className="modern-update-btn"
                onClick={updateUserProfile}
                disabled={updating}
              >
                {updating ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </div>
        )}

        {/* Company Profile Tab */}
        {activeTab === "company" && shouldShowCompanySection() && (
          <div className="modern-profile-layout">
            {/* Company Hero Section */}
            <div className="modern-hero-section modern-company-hero">
              <div className="modern-hero-content">
                {/* Company Icon */}
                <div className="modern-company-icon-container">
                  <div className="modern-company-icon">
                    <BuildingIcon />
                  </div>
                </div>

                {/* Company Info */}
                <div className="modern-basic-info">
                  <h1 className="modern-profile-name">
                    {companyProfile?.company_name || "Company Name"}
                  </h1>
                  <p className="modern-profile-occupation">
                    {companyProfile?.company_type}
                  </p>

                  <div className="modern-contact-grid">
                    <div className="modern-contact-item">
                      <MailIcon />
                      <span>{companyProfile?.admin_email}</span>
                    </div>
                    <div className="modern-contact-item">
                      <CompanyIcon />
                      <span>{companyProfile?.number_of_people} employees</span>
                    </div>
                    <div className="modern-contact-item">
                      <CalendarIcon />
                      <span>Founded {formatDate(companyProfile?.created_date || "")}</span>
                    </div>
                  </div>
                </div>

                {/* Company Progress Circle */}
                <div className="modern-completion-container">
                  <div className="modern-progress-ring">
                    <svg className="modern-progress-svg" viewBox="0 0 120 120">
                      <circle
                        className="modern-progress-bg"
                        cx="60"
                        cy="60"
                        r="54"
                      />
                      <circle
                        className="modern-progress-fill"
                        cx="60"
                        cy="60"
                        r="54"
                        style={{
                          strokeDasharray: `${getProfileCompletion(companyProfile) * 3.39} 339`,
                        }}
                      />
                    </svg>
                    <div className="modern-progress-text">
                      <span className="modern-progress-number">
                        {getProfileCompletion(companyProfile)}%
                      </span>
                      <span className="modern-progress-label">Complete</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Main Content */}
            <div className="modern-content-grid">
              {/* Left Column */}
              <div className="modern-main-content">
                {/* Company Information */}
                <div className="modern-card">
                  <h2 className="modern-card-title">Company Information</h2>
                  <div className="modern-form-grid">
                    <div className="modern-input-group">
                      <label className="modern-label">Company Name</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={companyFormData.company_name || ""}
                        onChange={(e) =>
                          handleCompanyInputChange("company_name", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Company Type</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={companyFormData.company_type || ""}
                        onChange={(e) =>
                          handleCompanyInputChange("company_type", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Website</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={companyFormData.company_website || ""}
                        onChange={(e) =>
                          handleCompanyInputChange("company_website", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">GST Number</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={companyFormData.gst_number || ""}
                        onChange={(e) =>
                          handleCompanyInputChange("gst_number", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Number of People</label>
                      <input
                        type="number"
                        className="modern-input"
                        value={companyFormData.number_of_people || ""}
                        onChange={(e) =>
                          handleCompanyInputChange("number_of_people", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Company Social Media */}
                <div className="modern-card">
                  <div className="modern-card-header">
                    <h3 className="modern-card-title">Social Media</h3>
                    <button
                      onClick={() => addSocialMedia(false)}
                      className="modern-add-btn"
                    >
                      <PlusIcon />
                      Add
                    </button>
                  </div>
                  <div className="modern-social-list">
                    {(companyFormData.social_media_data || []).map(
                      (social: any, index: number) => (
                        <div key={index} className="modern-social-row">
                          {social.isExisting ? (
                            <div className="modern-social-platform">
                              <strong>{social.platform_name}</strong>
                            </div>
                          ) : (
                            <select
                              className="modern-select"
                              value={social.platform_name || ""}
                              onChange={(e) =>
                                handleSocialMediaChange(
                                  index,
                                  "platform_name",
                                  e.target.value,
                                  false
                                )
                              }
                            >
                              <option value="">Platform</option>
                              <option value="LinkedIn">LinkedIn</option>
                              <option value="Instagram">Instagram</option>
                              <option value="Twitter">Twitter</option>
                              <option value="Facebook">Facebook</option>
                              <option value="YouTube">YouTube</option>
                            </select>
                          )}
                          <input
                            type="text"
                            placeholder="Profile URL"
                            className="modern-input modern-social-input"
                            value={social.profile_url || ""}
                            onChange={(e) =>
                              handleSocialMediaChange(
                                index,
                                "profile_url",
                                e.target.value,
                                false
                              )
                            }
                          />
                          {!social.isExisting && (
                            <button
                              onClick={() => removeSocialMedia(index, false)}
                              className="modern-remove-btn"
                            >
                              <XIcon />
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Company Address Section */}
                <div className="modern-card">
                  <h2 className="modern-card-title">Company Address</h2>
                  <div className="modern-address-grid">
                    <div className="modern-input-group">
                      <label className="modern-label">Address Line 1</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={companyFormData.address_line_1 || ""}
                        onChange={(e) =>
                          handleCompanyInputChange("address_line_1", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Address Line 2</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={companyFormData.address_line_2 || ""}
                        onChange={(e) =>
                          handleCompanyInputChange("address_line_2", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Address Line 3</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={companyFormData.address_line_3 || ""}
                        onChange={(e) =>
                          handleCompanyInputChange("address_line_3", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">City</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={companyFormData.city || ""}
                        onChange={(e) =>
                          handleCompanyInputChange("city", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">State</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={companyFormData.state || ""}
                        onChange={(e) =>
                          handleCompanyInputChange("state", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Country</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={companyFormData.country || ""}
                        onChange={(e) =>
                          handleCompanyInputChange("country", e.target.value)
                        }
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Postal Code</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={companyFormData.postal_code || ""}
                        onChange={(e) =>
                          handleCompanyInputChange("postal_code", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Admin Details */}
                <div className="modern-card">
                  <h2 className="modern-card-title">Admin Details</h2>
                  <div className="modern-form-grid">
                    <div className="modern-input-group">
                      <label className="modern-label">Admin Status</label>
                      <input
                        type="text"
                        className="modern-input modern-readonly"
                        value={companyFormData.admin_status || ""}
                        readOnly
                      />
                    </div>
                    <div className="modern-input-group">
                      <label className="modern-label">Admin Email</label>
                      <input
                        type="email"
                        className="modern-input modern-readonly"
                        value={companyFormData.admin_email || ""}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Update Button */}
            <div className="modern-update-container" >
              <button
                className="modern-update-btn"
                onClick={updateCompanyProfile}
                disabled={updating}
              >
                {updating ? "Updating..." : "Update Company"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;