import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UploadPlanModal.css";
import { UploadIcon } from "lucide-react";
import { API_URL } from "../../../config";
import { FloorPlan } from "../../Proposals";

interface Project {
  id: string;
  project_name: string;
  plans?: Plan[];
  plans_count?: number;
}

interface Plan {
  id: string;
  name?: string;
  [key: string]: any;
}

const API_BASE_URL = API_URL;

const FEET_TO_UNITS = 10;

function scalePlanGeometryForRender<T = any>(plan: T, scale = FEET_TO_UNITS): T {
  const isPoint = (v: any) =>
    v && typeof v === "object" && typeof v.x === "number" && typeof v.z === "number";

  const visit = (node: any): any => {
    if (Array.isArray(node)) return node.map(visit);
    if (node && typeof node === "object") {
      if (isPoint(node)) return { x: node.x * scale, z: node.z * scale };
      const out: any = {};
      for (const k of Object.keys(node)) out[k] = visit(node[k]);
      return out;
    }
    return node;
  };

  return visit(plan);
}

const fileToDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const pdfToImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = async () => {
      try {
        // @ts-ignore - pdfjsLib is loaded from CDN
        const pdfjsLib = window.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
};

const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}> = ({ open, onClose, children, title = "Upload an image" }) => {
  if (!open) return null;
  return (
    <div className="pg-modal-root">
      <div className="pg-modal-backdrop" onClick={onClose} />
      <div className="pg-modal-card">
        <div className="pg-modal-header">
          <h2 className="pg-modal-title">{title}</h2>
          <button onClick={onClose} className="pg-icon-btn">✕</button>
        </div>
        <div className="pg-modal-body">{children}</div>
      </div>
    </div>
  );
};

const DropZone: React.FC<{
  onFile: (file: File) => void;
  previewURL?: string | null;
  isProcessing?: boolean;
}> = ({ onFile, previewURL, isProcessing }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setDragging] = useState(false);

  const isValidFile = (file: File) => {
    return file.type.startsWith("image/") || file.type === "application/pdf";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && isValidFile(file)) onFile(file);
  };

  return (
    <div
      className={`pg-dropzone ${isDragging ? "pg-dropzone--dragging" : ""} ${isProcessing ? "pg-dropzone--processing" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !isProcessing && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="pg-hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && isValidFile(f)) onFile(f);
        }}
      />
      <div className="pg-dropzone-icon">
        <UploadIcon />
      </div>
      {isProcessing ? (
        <>
          <p className="pg-dropzone-title">Processing PDF...</p>
          <p className="pg-dropzone-sub">Converting first page to image</p>
        </>
      ) : (
        <>
          <p className="pg-dropzone-title">Drop a file here</p>
          <p className="pg-dropzone-sub">or click to browse</p>
          <p className="pg-dropzone-formats">Accepted formats: Images (JPG, PNG, etc.) and PDF files</p>
        </>
      )}
      {previewURL && (
        <div className="pg-preview">
          <img src={previewURL} alt="Preview" className="pg-preview-img" />
        </div>
      )}
    </div>
  );
};

export type UploadPlanModalProps = {
  uploadPlan?: boolean;
  onClose?: () => void;
  projectId: string;
  useServerRoute?: boolean;
};

const UploadPlanModal: React.FC<UploadPlanModalProps> = ({
  projectId,
  uploadPlan = false,
  onClose
}) => {
  const [open, setOpen] = useState(uploadPlan);
  const [imageDataURL, setImageDataURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [processingPdf, setProcessingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planAvailable, setPlanAvailable] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();
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

  useEffect(() => setOpen(uploadPlan), [uploadPlan]);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const handleFile = async (file: File) => {
    try {
      setError(null);

      if (file.type === "application/pdf") {
        setProcessingPdf(true);
        try {
          const imageDataURL = await pdfToImage(file);
          setImageDataURL(imageDataURL);
        } catch (pdfError) {
          setError("Failed to convert PDF to image. Please try with an image file instead.");
          console.error("PDF conversion error:", pdfError);
        } finally {
          setProcessingPdf(false);
        }
      } else if (file.type.startsWith("image/")) {
        const url = await fileToDataURL(file);
        setImageDataURL(url);
      } else {
        setError("Please upload a valid image file or PDF.");
      }
    } catch (err) {
      setError("Failed to process file. Please try again.");
      setProcessingPdf(false);
      console.error("File processing error:", err);
    }
  };

  const handleSubmitPrompt = async () => {
    if (!prompt.trim()) {
      setError("Please enter your desired changes");
      return;
    }

    if (!plan) {
      setError("No plan data available");
      return;
    }

    setPromptLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        window.location.href = '/LoginPage';
        return;
      }

      // Send plan details and prompt to backend for modifications
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/plans/modify-blueprint/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_data: plan.coordinates,
            prompt: prompt.trim()
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Backend error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      console.log("Modified plans response data:", data);

      // Scale the floor plans for rendering (same as AI generation)
      const floorPlans = data.floor_plans || data;
      const floorPlansForRender = floorPlans.map((plan: any) =>
        scalePlanGeometryForRender(plan, 10)
      );

      // Close modal before navigation
      setOpen(false);

      // Navigate to proposals page with the same structure as AI generation
      navigate("/proposals", {
        state: {
          projectData: {
            id: projectId,
            name: "Current Project",
            budget: "200",
            currency: "USD",
          },
          roomData: null,
          aiGeneratedPlans: floorPlansForRender,
          aiMode: true,
        },
      });

    } catch (err) {
      setError((err as Error).message);
      console.error("Blueprint modification error:", err);
    } finally {
      setPromptLoading(false);
    }
  };


  // Function to handle continuing without changes
  const handleContinue = async () => {
    if (!plan) {
      setError("No plan data available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        window.location.href = '/LoginPage';
        return;
      }

      // Create the plan in the project
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/plans/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_name: `Uploaded Plan - ${new Date().toLocaleDateString()}`,
            coordinates: plan.coordinates
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create plan');
      }

      const newPlan = await response.json();
      console.log("Plan created successfully:", newPlan);

      // Update local cache
      const cachedProjects = localStorage.getItem("userProjects");
      const currentProjects = cachedProjects ? JSON.parse(cachedProjects) : [];
      const updatedProjects = currentProjects.map((proj: Project) => {
        if (proj.id.toString() === projectId) {
          console.log("Adding uploaded plan to cached project:", proj);
          return {
            ...proj,
            plans: proj.plans ? [...proj.plans, newPlan] : [newPlan],
            plans_count: (proj.plans_count || 0) + 1
          };
        } else {
          return proj;
        }
      });

      console.log("Updated userProjects cache after blueprint upload:", updatedProjects);
      localStorage.setItem("userProjects", JSON.stringify(updatedProjects));

      // Close modal and redirect to playground
      handleClose();
      window.location.href = `/playground/${projectId}/${newPlan.id}`;

    } catch (err) {
      setError((err as Error).message);
      console.error("Plan creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!imageDataURL) return;
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        window.location.href = '/LoginPage';
        return;
      }

      // Send image to backend for processing
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/plans/upload-blueprint/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_data: imageDataURL
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process blueprint');
      }

      const responseData = await response.json();
      console.log("Blueprint upload response data:", responseData);
      setPlanAvailable(true);
      setPlan(responseData);
      // const planId = responseData.id;

      // // Update local cache
      // const cachedProjects = localStorage.getItem("userProjects");
      // const currentProjects = cachedProjects ? JSON.parse(cachedProjects) : [];
      // const updatedProjects = currentProjects.map((proj: Project) => {
      //   if (proj.id == projectId) {
      //     console.log("Adding blueprint plan to cached project:", proj);
      //     return {
      //       ...proj,
      //       plans: proj.plans ? [...proj.plans, responseData] : [responseData]
      //     };
      //   } else {
      //     return proj;
      //   }
      // });

      // console.log("Updated userProjects cache after blueprint upload:", updatedProjects);
      // localStorage.setItem("userProjects", JSON.stringify(updatedProjects));

      // // Redirect to playground
      // window.location.href = `/playground/${projectId}/${planId}`;

    } catch (err) {
      setError((err as Error).message);
      console.error("Blueprint upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Upload Plan">
      {planAvailable && plan ? (
        <div className="pg-floor-plan-card">
          {/* <h2 className="pg-card-title">Floor Plan Review</h2> */}

          <div className="pg-svg-container">
            <FloorPlan
              floorPlanData={plan.coordinates}
              width={450}
              height={250}
              viewBox="0 0 300 200"
              className="pg-floor-plan-svg"
              showRoomType={true}
            />
          </div>

          <div className="pg-form-container">
            {/* Prompt Input */}
            <div>
              <label
                htmlFor="prompt"
                className="pg-prompt-label"
              >
                Want to make a change?
              </label>
              <textarea
                id="prompt"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Make the kitchen bigger' or 'Add a window to the master bedroom'"
                className="pg-prompt-textarea"
              />
            </div>

            {/* Buttons */}
            <div className="pg-button-container">
              <button
                type="button"
                onClick={handleSubmitPrompt}
                disabled={loading || promptLoading}
                className="pg-btn pg-btn--submit"
              >
                {promptLoading ? "Processing..." : "Modify With AI"}
              </button>

              <button
                type="button"
                onClick={handleContinue}
                disabled={loading || promptLoading}
                className="pg-btn pg-btn--continue"
              >
                {loading ? "Processing..." : "Continue Without Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <DropZone
            onFile={handleFile}
            previewURL={imageDataURL}
            isProcessing={processingPdf}
          />
          <div className="pg-actions">
            <button onClick={handleClose} className="pg-btn pg-btn--ghost">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!imageDataURL || loading || processingPdf}
              className="pg-btn pg-btn--primary"
            >
              {loading ? "Processing..." : processingPdf ? "Converting..." : "Submit"}
            </button>
          </div>
          {error && (
            <div className="pg-alert">
              Error: {error}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default UploadPlanModal;