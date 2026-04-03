# 🧑‍🎓 Studentious - Next-Gen Educational Platform

<p align="center">
  A comprehensive full-stack educational platform built with Next.js and MongoDB. Studentious goes beyond a traditional LMS by integrating AI-driven course summarization, text-to-speech functionality, and real-time video/text collaboration.
</p>

## 📱 Screenshots & Demo

<p align="center">
  A visual tour of the Studentious platform, from AI summaries to live collaboration.
</p>

<table border="0">
  <tr>
    <td align="center" valign="top" colspan="2">
      <h3>📚 Dashboard & Course Management</h3>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="./screenshots/dashboard.jpg" width="220" alt="User Dashboard">
      <br><em>Custom User Dashboard (Role-based)</em>
    </td>
    <td align="center">
      <img src="./screenshots/courses.jpg" width="220" alt="Course Materials">
      <br><em>Document & Material Uploads</em>
    </td>
  </tr>

  <tr>
    <td align="center" valign="top" colspan="2">
      <br><h3>🧠 AI Summarization & Text-to-Speech</h3>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="./screenshots/ai_summary.jpg" width="220" alt="AI Summary">
      <br><em>Automated Course Summaries & Translation</em>
    </td>
    <td align="center">
      <img src="./screenshots/audio.jpg" width="220" alt="ElevenLabs Audio">
      <br><em>Listen to Summaries (ElevenLabs API)</em>
    </td>
  </tr>

  <tr>
    <td align="center" valign="top" colspan="2">
      <br><h3>🗣️ Real-Time Collaboration</h3>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="./screenshots/chat.jpg" width="220" alt="Live Chatrooms">
      <br><em>Live Community Chatrooms</em>
    </td>
    <td align="center">
      <img src="./screenshots/video.jpg" width="220" alt="Agora Video Chat">
      <br><em>Video Conferencing via Agora</em>
    </td>
  </tr>
</table>


## **🚀 Key Features**

* **Custom Authentication & Roles:** Cookie-based session management with distinct access levels for students and teachers.  
* **AI Content Pipeline:** Automatically generates summaries for uploaded course documents (PDF/Word) and translates them into multiple languages.  
* **Text-to-Speech (ElevenLabs):** Converts AI summaries into high-quality audio files for on-the-go listening.  
* **Real-Time Video & Chat:** Features community chatrooms powered by WebSockets/MongoDB and live video conferencing integrated via Agora.  
* **Smart Notifications:** Automated email notifications and recommendations handled by background cron jobs (node-cron).  
* **Performance Optimized:** Includes session caching and API endpoint protection (AuthGuard).

## **🛠️ Tech Stack**

* **Framework:** Next.js (Pages Router)  
* **Frontend:** React, Tailwind CSS  
* **Backend:** Node.js API Routes, custom useAuth() hook  
* **Database:** MongoDB (with Mongoose/clientPromise)  
* **Real-Time & Video:** Socket.IO (planned/alternative), Agora.io (Video Chat)  
* **AI & External APIs:** Google Generative AI (Summarization), ElevenLabs API (Audio), Translation API  
* **Other Tools:** pdf-lib (Document handling), node-cron (Schedulers)

## **⚙️ Getting Started**

Follow these steps to run the project locally.

### **1\. Clone the repository**

git clone \[https://github.com/PetricaZPC/studentious.git\](https://github.com/PetricaZPC/studentious.git)  
cd studentious

### **2\. Install dependencies**

npm install

### **3\. Set up Environment Variables**

Create a .env.local file in the root of the project and add the necessary API keys and database URIs:  
\# Database  
MONGODB\_URI=your\_mongodb\_connection\_string

\# Authentication & Sessions  
JWT\_SECRET=your\_jwt\_secret\_key

\# External APIs  
ELEVENLABS\_API\_KEY=your\_elevenlabs\_key  
AGORA\_APP\_ID=your\_agora\_app\_id  
AGORA\_APP\_CERTIFICATE=your\_agora\_certificate  
AI\_API\_KEY=your\_ai\_translation\_and\_summary\_key

### **4\. Run the development server**

npm run dev

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser to see the result.
