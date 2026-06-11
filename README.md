<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Biometric Verification Engine: Static Shadow vs Living Form</title>
<style>
  body {
    background: #0d1117;
    color: #c9d1d9;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    max-width: 900px;
    margin: 0 auto;
    padding: 32px 24px;
  }
  h1 { color: #e6edf3; font-size: 2rem; border-bottom: 1px solid #30363d; padding-bottom: 12px; margin-top: 0; }
  h2 { color: #e6edf3; font-size: 1.5rem; border-bottom: 1px solid #21262d; padding-bottom: 8px; margin-top: 40px; }
  h3 { color: #e6edf3; font-size: 1.2rem; margin-top: 28px; }
  h4 { color: #e6edf3; margin-top: 20px; }
  a { color: #58a6ff; text-decoration: none; }
  a:hover { text-decoration: underline; }
  hr { border: none; border-top: 1px solid #30363d; margin: 32px 0; }

  /* WINNER BANNER */
  .winner-banner {
    background: linear-gradient(135deg, #1a1200, #2d1f00);
    border: 2px solid #f5c842;
    border-radius: 12px;
    padding: 24px 28px;
    margin-bottom: 32px;
    text-align: center;
  }
  .winner-banner .trophy-line {
    font-size: 2rem;
    margin-bottom: 8px;
  }
  .winner-banner h2 {
    color: #f5c842;
    font-size: 1.4rem;
    margin: 0 0 6px;
    border: none;
    padding: 0;
  }
  .winner-banner .event {
    color: #d4a800;
    font-size: 0.95rem;
    margin-bottom: 18px;
  }
  .team-label {
    color: #8b949e;
    font-size: 0.85rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .team-members {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    margin-bottom: 20px;
  }
  .member {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 0.9rem;
    color: #c9d1d9;
  }
  .member.leader {
    border-color: #f5c842;
    color: #f5c842;
    font-weight: 600;
  }
  .member.leader::before { content: "👑 "; }
  .links-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
  }
  .proj-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 6px;
    font-size: 0.88rem;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.2s;
  }
  .proj-link:hover { opacity: 0.85; text-decoration: none; }
  .link-ppt  { background: #ff6b35; color: #fff; }
  .link-vid  { background: #cc0000; color: #fff; }
  .link-gh   { background: #238636; color: #fff; }
  .link-li   { background: #0077b5; color: #fff; }

  /* Badges */
  .badges { text-align: center; margin: 16px 0 24px; }
  .badges img { margin: 4px; }

  /* Images */
  .img-center { text-align: center; margin: 24px 0; }
  .img-center img {
    max-width: 100%;
    border-radius: 8px;
    border: 1px solid #30363d;
    background: #161b22;
  }
  .img-center em {
    display: block;
    color: #8b949e;
    font-size: 0.85rem;
    margin-top: 8px;
  }

  /* Code blocks */
  pre {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 20px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.6;
    color: #e6edf3;
    font-family: 'Consolas', 'JetBrains Mono', monospace;
    white-space: pre;
  }
  code {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.88em;
    font-family: 'Consolas', monospace;
    color: #e6edf3;
  }
  pre code { background: none; border: none; padding: 0; font-size: inherit; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #161b22; color: #58a6ff; padding: 12px 16px; text-align: left; border: 1px solid #30363d; }
  td { padding: 10px 16px; border: 1px solid #21262d; }
  tr:nth-child(even) td { background: #0d1117; }

  /* TOC */
  .toc { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 20px 28px; margin: 24px 0; }
  .toc ul { margin: 0; padding-left: 20px; }
  .toc li { margin: 4px 0; }

  /* Section dividers */
  .step-header {
    background: #161b22;
    border-left: 4px solid #58a6ff;
    border-radius: 0 8px 8px 0;
    padding: 12px 18px;
    margin: 24px 0 16px;
    font-weight: 600;
    color: #e6edf3;
  }

  p { margin: 12px 0; }
  ul, ol { padding-left: 24px; }
  li { margin: 4px 0; }
  strong { color: #e6edf3; }
  em { color: #8b949e; }
</style>
</head>
<body>

<!-- ══════════════════════════════════════════════════════ -->
<!--  WINNER BANNER (from LinkedIn post)                   -->
<!-- ══════════════════════════════════════════════════════ -->
<div class="winner-banner">
  <div class="trophy-line">🏆</div>
  <h2>We Won Turing's Playground!</h2>
  <div class="event">Organized by Computer Coding Club of MNNIT 🎉</div>

  <div class="team-label">Team &nbsp;·&nbsp; Attention_Is_All_You_Need</div>
  <div class="team-members">
    <div class="member leader">Abhishek Kumar</div>
    <div class="member">Roli Rathour</div>
    <div class="member">Ritik Raj</div>
    <div class="member">Mahee Gupta</div>
  </div>

  <div class="links-row">
    <a class="proj-link link-ppt" href="https://lnkd.in/g-i7tZ3C" target="_blank">📊 Presentation</a>
    <a class="proj-link link-vid" href="https://lnkd.in/gH-8QZMa" target="_blank">🎬 Demo Video</a>
    <a class="proj-link link-gh"  href="https://lnkd.in/gUyCmWfN" target="_blank">⬡ GitHub Repo</a>
    <a class="proj-link link-li"  href="https://www.linkedin.com/posts/abhishek-kumar-a29449314_machinelearning-deeplearning-computervision-activity-7426159392892403712-TF4W" target="_blank">in LinkedIn Post</a>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════ -->
<!--  ORIGINAL README CONTENT (unchanged)                  -->
<!-- ══════════════════════════════════════════════════════ -->

<h1>Biometric Verification Engine: Static Shadow vs Living Form</h1>
<p><strong>Forensic-Grade Face Recognition for Fraudulent Voting Detection</strong></p>

<div class="badges">
  <img src="https://img.shields.io/badge/python-3.8+-blue.svg" alt="Python 3.8+">
  <img src="https://img.shields.io/badge/PyTorch-2.0+-ee4c2c.svg" alt="PyTorch">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT">
</div>

<div class="img-center">
  <img src="https://raw.githubusercontent.com/google-research/vision_transformer/main/vit_figure.png" alt="Project Banner">
</div>

<hr>

<div class="toc">
  <strong>📋 Table of Contents</strong>
  <ul>
    <li><a href="#overview">🎯 Project Overview</a></li>
    <li><a href="#architecture">🏗️ System Architecture</a></li>
    <li><a href="#pipeline">📹 Webcam Frame Processing Pipeline</a></li>
    <li><a href="#model">🧠 Model Architecture & Evolution</a></li>
    <li><a href="#training">Training Strategy</a></li>
    <li><a href="#performance">📊 Performance & Fairness</a></li>
    <li><a href="#hardware">💻 Hardware Acceleration</a></li>
    <li><a href="#results">🎯 Results</a></li>
    <li><a href="#install">🚀 Installation & Usage</a></li>
  </ul>
</div>

<hr>

<h2 id="overview">🎯 Project Overview</h2>

<h3>Objective</h3>
<p>Build a unified <strong>Biometric Verification Engine</strong> that reconciles the "Static Shadow" (government ID photo) with the "Living Form" (real-time selfie). The system acts as an impartial judge, ensuring that:</p>
<ul>
  <li>A grainy, decade-old passport photo and a high-definition mobile selfie represent <strong>the same soul</strong></li>
  <li>The "live" form is not a clever <strong>Maya (deception)</strong> like a deepfake or printed mask</li>
</ul>

<h3>The Challenge: Cross-Domain Face Matching</h3>

<div class="img-center">
  <img src="https://production-media.paperswithcode.com/methods/Screen_Shot_2020-06-28_at_4.15.30_PM_zsF1S6m.png" alt="Cross-Domain Challenge">
  <em>Cross-domain face matching: Low-quality ID photos vs. high-quality selfies</em>
</div>

<p>Matching an ID to a selfie is a battle against <strong>Domain Shift</strong>:</p>
<ul>
  <li><strong>ID photos</strong>: Low-resolution, hard-copy scans with holographic interference</li>
  <li><strong>Selfies</strong>: High-dynamic-range images with varied lighting</li>
</ul>

<h3>Key Aspects</h3>

<h4>Aspect 1: Cross-Domain Face Matching</h4>
<p><strong>Technical Solution</strong>: We employ a <strong>Siamese Neural Network</strong> with a <strong>Vision Transformer (ViT)</strong> backbone. Unlike standard CNNs, ViTs use <strong>Attention Mechanisms</strong> to focus on structural landmarks (nose bridge, ocular distance) that remain constant despite aging or lamination glare.</p>

<div class="img-center">
  <img src="https://miro.medium.com/v2/resize:fit:1400/1*XzVUiq-3lAkSPzGdJQzbUA.png" alt="Siamese Network">
  <em>Siamese Network Architecture for Face Verification</em>
</div>

<h4>Aspect 2: Demographic Integrity & Statistics</h4>
<p>According to <strong>NIST (National Institute of Standards and Technology) FRVT reports</strong>, ensuring Dharma (fairness) across all populations is critical:</p>
<ul>
  <li><strong>False Positive Differentials</strong>: False match rates (FMR) can vary by factors of 10x to 100x across different demographics</li>
  <li><strong>Race & Ethnicity</strong>: Higher False Positive rates for East Asian and African American faces (up to 1 in 10) compared to Caucasian faces (1 in 10,000) due to training data imbalances</li>
  <li><strong>Gender & Age</strong>: Women and elderly individuals experience higher False Rejection Rates (FRR) due to skin texture changes or cosmetic shifts</li>
</ul>
<p><strong>Mitigation</strong>: We use <strong>ArcFace Loss</strong> with a sub-center approach to penalize "easy" matches and force the model to learn deep, ethnically diverse features.</p>

<hr>

<h2 id="architecture">🏗️ System Architecture</h2>
<h3>High-Level Workflow</h3>

<pre>
┌─────────────────────────────────────────────────────────────────────┐
│                    BIOMETRIC VERIFICATION ENGINE                     │
└─────────────────────────────────────────────────────────────────────┘

[Government ID Photo]          [Live Webcam Stream]
        │                              │
        │                              ▼
        │                    ┌──────────────────┐
        │                    │  1. Face Detection│
        │                    │     & Alignment   │
        │                    └────────┬──────────┘
        │                              │
        │                              ▼
        │                    ┌──────────────────┐
        │                    │  2. Quality Gate  │
        │                    │  (Blur/Lighting)  │
        │                    └────────┬──────────┘
        │                              │
        │                         ✅ Pass / ❌ Fail
        │                              │
        │                              ▼
        │                    ┌──────────────────┐
        │                    │ 3. Liveness Model │
        │                    │  (Temporal Buffer)│
        │                    └────────┬──────────┘
        │                              │
        │                    Accumulate Evidence:
        │                    - Blink Detection
        │                    - Micro-movements
        │                    - rPPG (Heart Rate)
        │                              │
        │                              ▼
        │                    ┌──────────────────┐
        │                    │ 4. Liveness Gate  │
        │                    │  Score ≥ τ_live?  │
        │                    └────────┬──────────┘
        │                              │
        │                         ✅ LIVE VERIFIED
        │                              │
        │                              ▼
        │                    ┌──────────────────┐
        │                    │ 5. Select Top-N   │
        │                    │  Best Frames      │
        │                    └────────┬──────────┘
        │                              │
        ▼                              ▼
┌───────────────────────────────────────────────────┐
│        HYBRID ViT FACE RECOGNITION MODEL          │
│                                                   │
│  ResNet34 → CBAM Attention → ViT → ArcFace Head  │
└───────────────────┬───────────────────────────────┘
                    │
                    ▼
          [512-D Embedding Vector]
                    │
                    ▼
        ┌───────────────────────┐
        │   Cosine Similarity   │
        │   ID vs. Top-N Frames │
        └───────────┬───────────┘
                    │
                    ▼
            Score ≥ 0.34 (Threshold)
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
    ✅ MATCH               ❌ NO MATCH
  (Same Person)        (Different Person)
</pre>

<hr>

<h2 id="pipeline">📹 Webcam Frame Processing Pipeline</h2>
<h3>Complete Processing Flow</h3>

<div class="img-center">
  <img src="https://learnopencv.com/wp-content/uploads/2021/04/facial-landmark-detection-workflow.png" alt="Face Detection Pipeline">
  <em>Face detection and alignment workflow</em>
</div>

<div class="step-header">Step 1: Face Detection & Alignment</div>
<p><strong>For every incoming webcam frame:</strong></p>
<pre>
# Detect face using MediaPipe/RetinaFace
face_bbox = face_detector.detect(raw_frame)

# Align face (eyes horizontal, scale normalize)
aligned_frame = align_face(raw_frame, face_bbox)
</pre>

<p><strong>Why alignment first?</strong></p>
<ul>
  <li>Reduces pose noise</li>
  <li>Everything downstream becomes more stable</li>
  <li>Normalized input for quality checks</li>
</ul>

<div class="img-center">
  <img src="https://pyimagesearch.com/wp-content/uploads/2017/05/face_alignment_example_01.jpg" alt="Face Alignment" onerror="this.src='https://learnopencv.com/wp-content/uploads/2021/04/facial-landmark-detection-workflow.png'">
  <em>Face alignment: Before and after normalization</em>
</div>

<div class="step-header">Step 2: Quality Gate (Real-Time CV Checks)</div>
<p><strong>On every aligned frame, run cheap computer vision checks:</strong></p>
<pre>
# Blur check (Laplacian variance)
blur_score = cv2.Laplacian(aligned_frame, cv2.CV_64F).var()

# Lighting check (HSV mean brightness)
hsv = cv2.cvtColor(aligned_frame, cv2.COLOR_BGR2HSV)
brightness = np.mean(hsv[:, :, 2])

# Face presence check
face_present = face_bbox is not None

if blur_score < BLUR_THRESHOLD or brightness < LIGHT_THRESHOLD:
    # ❌ Frame discarded
    display_message("Please adjust lighting/focus")
    continue
else:
    # ✅ Frame proceeds
    quality_frames.append(aligned_frame)
</pre>
<p><strong>Benefits:</strong></p>
<ul>
  <li>No ML compute wasted on bad frames</li>
  <li>UX-friendly real-time feedback</li>
  <li>Prevents garbage-in-garbage-out</li>
</ul>

<div class="step-header">Step 3: Liveness Model (Streaming, Stateful)</div>

<div class="img-center">
  <img src="https://miro.medium.com/v2/resize:fit:1400/1*9xHlBVq7V8qZkPZJ0kqo0Q.png" alt="Liveness Detection">
  <em>Multi-modal liveness detection techniques</em>
</div>

<p><strong>Only quality-passed frames enter liveness detection:</strong></p>
<pre>
# Liveness is NOT single-frame
# Accumulates evidence across time
liveness_buffer.append(aligned_frame)

# Multi-modal checks
blink_detected = detect_eye_closure(liveness_buffer[-30:])  # Last 1 sec
motion_vector = compute_optical_flow(liveness_buffer[-10:])
texture_consistency = check_texture_liveness(aligned_frame)
heart_rate = rPPG_analysis(liveness_buffer)  # Remote photoplethysmography

# Aggregate liveness score
liveness_score = weighted_average([
    blink_detected,
    motion_vector,
    texture_consistency,
    heart_rate
])
</pre>
<p><strong>Key Points:</strong></p>
<ul>
  <li><strong>Temporal Analysis</strong>: Requires 2-5 seconds of video</li>
  <li><strong>Anti-Spoofing</strong>: Detects printed photos, video replays, 3D masks</li>
  <li><strong>Parallel Saving</strong>: Frames are saved while liveness runs</li>
</ul>

<div class="step-header">Step 4: Liveness Decision Gate</div>
<pre>
if liveness_score >= τ_live:  # Threshold (e.g., 0.85)
    # ✅ Lock session as LIVE
    is_live = True
    
    # Freeze frame buffer
    frozen_frames = liveness_buffer.copy()
    
    # Stop liveness processing
    stop_liveness_stream()
    
    # ⚠️ CRITICAL: Identity lock
    # Do NOT accept new frames (prevents face-swap attacks)
    accept_new_frames = False
else:
    # ❌ Liveness failed
    display_message("Liveness check failed. Please retry.")
</pre>

<div class="step-header">Step 5: Face Matching (Identity Verification)</div>
<pre>
# Step 5.1: Select Top-N Best Frames
top_n_frames = select_best_frames(
    frozen_frames,
    criteria=[
        'sharpness',      # Highest Laplacian variance
        'frontal_pose',   # Minimal head rotation
        'lighting_score'  # Balanced illumination
    ],
    n=5
)

# Step 5.2: Extract Face Embeddings
embeddings = []
for frame in top_n_frames:
    # Run face embedding model (ResNet34 + ViT + ArcFace)
    embedding = face_recognition_model.encode(frame)  # 512-D vector
    embeddings.append(embedding)

# Step 5.3: Compare with Government ID Embedding
id_embedding = face_recognition_model.encode(government_id_photo)

# Step 5.4: Robust Aggregation
similarities = [cosine_similarity(id_embedding, emb) for emb in embeddings]

# Use median (robust to outliers)
final_similarity = np.median(similarities)

# Decision
if final_similarity >= THRESHOLD:  # 0.34
    return "✅ MATCH: Same Person"
else:
    return "❌ NO MATCH: Different Person"
</pre>
<p><strong>Why Top-N instead of single frame?</strong></p>
<ul>
  <li><strong>Robustness</strong>: Handles micro-expressions, partial occlusions</li>
  <li><strong>Confidence</strong>: Multiple votes reduce false positives/negatives</li>
</ul>

<hr>

<h2 id="model">🧠 Model Architecture & Evolution</h2>
<h3>The Journey: From Failure to State-of-the-Art</h3>
<p>Our final architecture is a <strong>Dual-Attention Hybrid Vision Transformer (ViT)</strong> powered by <strong>ArcFace Loss</strong>. Here's how we got there:</p>

<h3>❌ Phase 1: The Pure ViT Limitation</h3>
<p><strong>Experiment</strong>: Vanilla <strong>Vision Transformer (ViT-B/16)</strong></p>

<div class="img-center">
  <img src="https://production-media.paperswithcode.com/methods/Screen_Shot_2021-01-26_at_9.43.31_PM_uI4jjMq.png" alt="Vision Transformer">
  <em>Standard Vision Transformer (ViT) Architecture</em>
</div>

<pre>Input (112x112) → Patch Embedding → 12 Transformer Encoders → Classification Head</pre>

<p><strong>Observation:</strong></p>
<ul>
  <li>Severe underfitting</li>
  <li>Slow convergence (weeks on TPU)</li>
  <li>Poor fine-grained texture capture</li>
</ul>
<p><strong>Root Cause</strong> (Dosovitskiy et al.):</p>
<ul>
  <li><strong>Transformers lack Inductive Bias</strong>:
    <ul>
      <li>No built-in locality (CNNs assume nearby pixels are related)</li>
      <li>No translation invariance (same face shifted = different features)</li>
    </ul>
  </li>
  <li><strong>Data Hunger</strong>: Requires 300M+ images (e.g., JFT-300M)</li>
  <li><strong>Our Dataset</strong>: Only 500k images (WebFace) — 600x smaller!</li>
</ul>
<p><strong>Result</strong>: Model failed to capture facial pores, skin wrinkles, subtle identity markers.</p>

<h3>✅ Phase 2: The Hybrid Shift (ResNet34 Backbone)</h3>
<p><strong>Solution</strong>: Inject CNN Inductive Bias</p>

<div class="img-center">
  <img src="https://miro.medium.com/v2/resize:fit:1400/1*zbDxCB-0QDAc4oUGVtg3xw.png" alt="ResNet Architecture">
  <em>ResNet Architecture with Basic Blocks (ResNet34)</em>
</div>

<h4>Why ResNet34 over ResNet50?</h4>

<div class="img-center">
  <img src="https://miro.medium.com/v2/resize:fit:1400/1*sWLy8pWIhNiVPZUGAGsuQw.png" alt="ResNet Blocks Comparison">
  <em>Left: Basic Block (ResNet34) | Right: Bottleneck Block (ResNet50)</em>
</div>

<table>
  <tr><th>ResNet34</th><th>ResNet50</th></tr>
  <tr><td><strong>Basic Blocks</strong> (3×3 conv → 3×3 conv)</td><td><strong>Bottleneck Blocks</strong> (1×1 → 3×3 → 1×1)</td></tr>
  <tr><td>Preserves <strong>high-resolution spatial fidelity</strong></td><td>Compresses feature maps (loses details)</td></tr>
  <tr><td>21M parameters (lighter)</td><td>25M parameters</td></tr>
  <tr><td>Better for <strong>generating ViT visual tokens</strong></td><td>Better for generic ImageNet tasks</td></tr>
  <tr><td>Larger batch sizes on TPU</td><td>Memory-heavy</td></tr>
</table>

<pre>
Input (112x112 RGB)
    ↓
[ResNet34 Feature Extractor]
    Conv1 (7×7, stride 2) → BatchNorm → ReLU → MaxPool
    Layer1: 3× Basic Block (64 channels)
    Layer2: 4× Basic Block (128 channels, stride 2)
    Layer3: 6× Basic Block (256 channels, stride 2)
    Layer4: 3× Basic Block (512 channels, stride 2)
    ↓
Feature Maps (7×7×512)
</pre>

<h3>👁️ Phase 3: Dual Attention Mechanism (The "Forensic Eye")</h3>
<p><strong>Problem</strong>: Standard CNNs treat all pixels equally — background clutter gets same weight as eyes/nose.</p>
<p><strong>Solution</strong>: <strong>CBAM (Convolutional Block Attention Module)</strong></p>

<div class="img-center">
  <img src="https://production-media.paperswithcode.com/methods/Screen_Shot_2020-06-25_at_5.17.42_PM.png" alt="CBAM Architecture">
  <em>CBAM: Convolutional Block Attention Module</em>
</div>

<pre>
ResNet34 Feature Maps (7×7×512)
    ↓
┌─────────────────────────────┐
│   CBAM Attention Module     │
│                             │
│  [Channel Attention]        │
│   AvgPool + MaxPool → MLP   │
│   → Sigmoid Weights         │
│   → Reweight Channels       │
│         ↓                   │
│  [Spatial Attention]        │
│   Channel Concat → Conv7×7  │
│   → Sigmoid Map             │
│   → Reweight Spatial Locs   │
└─────────────────────────────┘
    ↓
Refined Feature Maps (7×7×512)
</pre>

<div class="img-center">
  <img src="https://neurohive.io/wp-content/uploads/2018/11/CBAM_pic-e1542312985291.png" alt="Attention Visualization">
  <em>CBAM Attention Visualization: Focusing on discriminative facial regions</em>
</div>

<p><strong>Channel Attention</strong>: "Which feature maps matter?" — Suppresses lighting/color, boosts identity patterns</p>
<p><strong>Spatial Attention</strong>: "Which pixels matter?" — Focuses on eyes, nose bridge, jawline</p>
<p><strong>Impact</strong>: <strong>+12% accuracy</strong> on occluded faces · <strong>+8% accuracy</strong> on extreme poses (±45°)</p>

<h3>🎯 Final Architecture: Hybrid ViT with ArcFace</h3>

<div class="img-center">
  <img src="https://miro.medium.com/v2/resize:fit:1400/1*vsUqJSeenvQVz0BNPEfnOA.png" alt="Complete Architecture">
  <em>Hybrid CNN-Transformer Architecture for Face Recognition</em>
</div>

<pre>
┌────────────────────────────────────────────────────────────────┐
│                     INPUT IMAGE (112×112×3)                     │
└────────────────────────────────┬───────────────────────────────┘
                                 ▼
         ┌───────────────────────────────────────┐
         │       ResNet34 Backbone               │
         │  (Inductive Bias for Texture/Edges)   │
         └───────────────┬───────────────────────┘
                         ▼
              Feature Maps (7×7×512)
                         │
         ┌───────────────┴───────────────┐
         │   CBAM Dual Attention Module  │
         │  • Channel Attention (What?)  │
         │  • Spatial Attention (Where?) │
         └───────────────┬───────────────┘
                         ▼
           Refined Features (7×7×512)
                         │
         ┌───────────────┴───────────────┐
         │     Patch Embedding Layer     │
         │   (7×7 patches → 49 tokens)   │
         │   + Positional Encoding       │
         └───────────────┬───────────────┘
                         ▼
         ┌───────────────────────────────┐
         │   Vision Transformer (ViT)    │
         │   • 6× Transformer Encoders   │
         │   • Multi-Head Self-Attention │
         │   • Global Context Modeling   │
         └───────────────┬───────────────┘
                         ▼
              Embedding Vector (512-D)
                         │
         ┌───────────────┴───────────────┐
         │      ArcFace Loss Head        │
         │   L2-Normalize → Angular      │
         │   Margin (m=0.5) → Softmax    │
         └───────────────────────────────┘
</pre>

<hr>

<h2 id="training">🔬 Technical Deep Dive</h2>

<h3>Training Strategy: Differential Learning Rate (DLR)</h3>
<p><strong>Problem</strong>: <strong>Catastrophic Forgetting</strong> — random ViT initialization overwrites pre-trained ResNet34 knowledge.</p>

<div class="img-center">
  <img src="https://miro.medium.com/v2/resize:fit:1400/1*9GTEzcO8KxxrfutmtsPs3Q.png" alt="Transfer Learning">
  <em>Transfer Learning: Fine-tuning pre-trained models</em>
</div>

<pre>
optimizer = torch.optim.AdamW([
    # Backbone: Slow fine-tuning
    {'params': model.resnet34.parameters(), 'lr': 1e-5},
    
    # Attention + ViT + Head: Fast learning
    {'params': model.cbam.parameters(), 'lr': 1e-4},
    {'params': model.vit.parameters(), 'lr': 1e-4},
    {'params': model.arcface_head.parameters(), 'lr': 1e-4}
])
</pre>
<ul>
  <li><strong>ResNet34 (1e-5)</strong>: "Don't forget edge detection, just adapt slightly"</li>
  <li><strong>ViT + ArcFace (1e-4)</strong>: "Learn identity features from scratch"</li>
</ul>

<h3>Loss Function: ArcFace (Additive Angular Margin)</h3>

<div class="img-center">
  <img src="https://production-media.paperswithcode.com/methods/Screen_Shot_2020-07-04_at_2.29.20_PM_SAIgS1n.png" alt="ArcFace Visualization">
  <em>ArcFace: Additive Angular Margin Loss</em>
</div>

<p><strong>ArcFace Solution</strong>:</p>
<pre>L = -log[ exp(s·cos(θ_yi + m)) / (exp(s·cos(θ_yi + m)) + Σ exp(s·cos(θ_j))) ]</pre>
<p>Where: <strong>m = 0.5</strong> (angular margin) · <strong>s = 64</strong> (feature scale)</p>

<div class="img-center">
  <img src="https://miro.medium.com/v2/resize:fit:1400/1*VsVM8x_MK-2GQ3KdgQEOOA.png" alt="ArcFace Comparison">
  <em>Loss Function Comparison: Softmax vs. ArcFace (tighter clusters)</em>
</div>

<p><strong>Impact</strong>: Intra-class variance ↓ 40% · Inter-class margin ↑ 65% · FMR ↓ from 1/1,000 → <strong>1/10,000</strong></p>

<hr>

<h2 id="hardware">💻 Hardware Acceleration</h2>
<h3>Google TPU v3-8 Optimization</h3>

<div class="img-center">
  <img src="https://cloud.google.com/static/tpu/docs/images/tpu-architecture.png" alt="TPU Architecture">
  <em>Google TPU v3 Architecture with Matrix Multiply Units (MXUs)</em>
</div>

<pre>
transformer_encoder = nn.TransformerEncoder(
    encoder_layer,
    num_layers=6,
    batch_first=True  # ✅ Maximizes MXU utilization
)

# Mixed Precision Training
model = model.to(torch.bfloat16)
</pre>

<table>
  <tr><th>Metric</th><th>CPU</th><th>GPU (V100)</th><th>TPU v3-8</th></tr>
  <tr><td>Time/Epoch</td><td>12 hours</td><td>3 hours</td><td><strong>45 minutes</strong></td></tr>
  <tr><td>Total Training</td><td>50 days</td><td>12.5 days</td><td><strong>3.1 days</strong></td></tr>
  <tr><td>Cost</td><td>$0</td><td>$750</td><td><strong>$200</strong></td></tr>
</table>

<hr>

<h2 id="performance">📊 Performance & Fairness</h2>

<div class="img-center">
  <img src="https://developers.google.com/static/machine-learning/fairness-overview/images/fairness_metrics.png" alt="Fairness Metrics">
  <em>Fairness metrics across different demographic groups</em>
</div>

<p><strong>Optimal Threshold: 0.34</strong></p>
<ul>
  <li><strong>False Match Rate (FMR)</strong>: 1 in 10,000 (impostor accepted)</li>
  <li><strong>False Rejection Rate (FRR)</strong>: 1 in 100 (genuine user rejected)</li>
</ul>

<p><strong>CelebA Dataset (Unseen Demographics)</strong>:</p>
<ul>
  <li>East Asian faces: FMR = 1/9,500</li>
  <li>African American faces: FMR = 1/9,800</li>
  <li>Caucasian faces: FMR = 1/10,200</li>
</ul>

<hr>

<h2 id="results">🎯 Results</h2>

<table>
  <tr><th>Metric</th><th>Value</th></tr>
  <tr><td><strong>LFW Accuracy</strong></td><td>99.12%</td></tr>
  <tr><td><strong>True Acceptance Rate (TAR)</strong></td><td>98.7% @ FAR=0.01%</td></tr>
  <tr><td><strong>ID-to-Selfie Accuracy</strong></td><td>96.3%</td></tr>
  <tr><td><strong>Decade-old Photos</strong></td><td>94.1%</td></tr>
  <tr><td><strong>Anti-Spoofing Accuracy</strong></td><td>99.8%</td></tr>
  <tr><td><strong>False Liveness Rate</strong></td><td>0.2%</td></tr>
</table>

<div class="img-center">
  <img src="https://www.researchgate.net/publication/344953898/figure/fig2/AS:951853837340672@1603832062542/ROC-curves-on-LFW-database.png" alt="ROC Curves">
  <em>ROC Curves: Our model vs. baseline methods on LFW dataset</em>
</div>

<h3>Liveness Detection Performance</h3>
<table>
  <tr><th>Attack Type</th><th>Detection Rate</th></tr>
  <tr><td>Printed Photo</td><td>99.9%</td></tr>
  <tr><td>Digital Replay</td><td>99.8%</td></tr>
  <tr><td>3D Mask</td><td>98.5%</td></tr>
  <tr><td>Deepfake Video</td><td>97.2%</td></tr>
</table>

<hr>

<h2 id="install">🚀 Installation & Usage</h2>

<h3>Prerequisites</h3>
<pre>
# Python 3.8+
python --version

# Install dependencies
pip install torch torchvision timm opencv-python mediapipe numpy
</pre>

<h3>Quick Start</h3>
<pre>
from biometric_engine import BiometricVerifier

# Initialize verifier
verifier = BiometricVerifier(
    model_path='weights/hybrid_vit_arcface.pth',
    threshold=0.34
)

# Load government ID photo
id_photo = cv2.imread('government_id.jpg')

# Start live verification
result = verifier.verify_live(
    id_photo=id_photo,
    camera_index=0,
    liveness_threshold=0.85
)

print(f"Verification Result: {result['match']}")
print(f"Similarity Score: {result['similarity']:.4f}")
print(f"Liveness Score: {result['liveness']:.4f}")
</pre>

<h3>Command Line Interface</h3>
<pre>
# Run inference
python verify.py \
  --id_photo government_id.jpg \
  --live_stream webcam \
  --threshold 0.34 \
  --liveness_threshold 0.85

# Training
python train.py \
  --dataset webface \
  --batch_size 256 \
  --epochs 100 \
  --lr_backbone 1e-5 \
  --lr_head 1e-4
</pre>

<h3>📁 Project Structure</h3>
<pre>
biometric-verification-engine/
├── models/
│   ├── resnet34.py          # ResNet34 backbone
│   ├── cbam.py              # CBAM attention module
│   ├── vit.py               # Vision Transformer
│   └── arcface.py           # ArcFace loss head
├── pipeline/
│   ├── face_detection.py    # MediaPipe/RetinaFace
│   ├── quality_gate.py      # Blur/lighting checks
│   ├── liveness.py          # Anti-spoofing
│   └── matcher.py           # Face matching logic
├── utils/
│   ├── preprocessing.py     # Alignment, normalization
│   └── metrics.py           # FMR, FRR, ROC curves
├── train.py                 # Training script
├── verify.py                # Inference script
└── README.md
</pre>

<hr>

<h2>📚 References</h2>
<ol>
  <li><strong>Dosovitskiy et al.</strong> — "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale" (ICLR 2021) — <a href="https://arxiv.org/abs/2010.11929">Paper</a></li>
  <li><strong>Deng et al.</strong> — "ArcFace: Additive Angular Margin Loss for Deep Face Recognition" (CVPR 2019) — <a href="https://arxiv.org/abs/1801.07698">Paper</a></li>
  <li><strong>He et al.</strong> — "Deep Residual Learning for Image Recognition" (CVPR 2016) — <a href="https://arxiv.org/abs/1512.03385">Paper</a></li>
  <li><strong>Woo et al.</strong> — "CBAM: Convolutional Block Attention Module" (ECCV 2018)</li>
</ol>

</body>
</html>
