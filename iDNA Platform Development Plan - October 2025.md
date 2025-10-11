# **iDNA Platform Development Plan \- October 2025**

**80 Working Hours Available**

---

## **Overview**

This plan outlines what we can deliver in October for the iDNA student profile platform. To meet the timeline, we're taking a **simplified approach**: building the user interface first with sample data, then connecting it to a working database.

---

## **Development Approach & Trade-offs**

### **Key Simplifications for October:**

1. **No built-in assessment tests** \- Students will complete tests on external websites and upload screenshots of their results. Our team will manually enter the data from these images.

   * *Why:* Each psychological assessment requires custom integration work (15-20 hours per test). By using external tests and manual data entry, we save approximately 60-80 hours while still collecting all necessary information.  
   * *Student experience:* They'll click a link to an external assessment site, complete it there, take a screenshot of results, and upload it back to our platform.  
2. **Frontend first** \- We'll build and approve the visual design with sample data before connecting to the database.

   * *Why:* This lets you and the team see and approve how everything looks and works before we commit to database structures that are harder to change later.  
   * *Benefit:* We can demo the complete user journey to stakeholders by mid-October, even while backend work continues.  
3. **Manual data processing** \- Assessment results uploaded by students will be reviewed and entered by staff, not automatically processed.

   * *Why:* Building image recognition and automated data extraction would require 30-40 additional hours and specialized AI tools.  
   * *Process:* Your team will review uploaded screenshots and enter key scores directly into the database using admin tools.

### **Why this approach:**

* **Faster delivery** \- We can show working screens within the first 2 weeks instead of waiting until the end  
* **Lower complexity** \- Reduces technical risk and potential debugging time by 40%  
* **Flexibility** \- Design changes take 2-3 hours instead of 10-15 hours once the database is built

---

## **Feature Breakdown & Time Estimates**

### **PHASE 1: User Interface Development (44 hours)**

*Building screens with sample data for approval*

#### **Story 2: Student Journey Dashboard (8 hours)**

**What students will see:**

* A homepage showing their progress through 5 steps:  
  1. Complete basic profile information  
  2. Upload assessment results  
  3. Write life story snippets  
  4. Upload supporting documents  
  5. Review complete iDNA dashboard  
* Clear visual indicators: green checkmarks for completed steps, orange circles for in-progress, grey for not started  
* Quick action buttons that take them directly to incomplete tasks  
* Percentage completion indicator (e.g., "Your iDNA is 60% complete")

**Deliverables:**

* **Progress tracker visual** \- A step-by-step timeline or circular progress indicator showing exactly where the student is in their journey  
* **Links to each section** \- Clickable cards or buttons that navigate to the relevant task (e.g., "Upload Assessment Results" button goes to upload page)  
* **Sample data display** \- Pre-populated examples showing what a completed profile looks like, helping students understand what's expected

**Why this matters:** Students can see at a glance what they've completed and what's left, reducing confusion and support requests.

---

#### **Story 4: Life Story Writing Tool (6 hours)**

**What students can do:**

* Write personal stories using guided prompts such as:  
  * "Describe a moment you're most proud of"  
  * "What challenge have you overcome and what did you learn?"  
  * "What are your aspirations for the next 3-5 years?"  
* Format their text with bold, italics, bullet points, and paragraphs  
* Save multiple separate story entries (not limited to one). I.e. “Save all” button  
* View a list of all their saved stories with dates and prompt titles  
* Edit or delete previously written stories  
* Optional: save drafts as they write (auto-saves every 30 seconds)

**Deliverables:**

* **Text editing interface** \- A clean writing area similar to Microsoft Word or Google Docs with basic formatting buttons (bold, italic, bullet lists)  
* **Pre-written prompt questions** \- 5-7 structured questions that guide students in sharing meaningful stories. Students select a prompt from a dropdown before writing  
* **Story list display** \- A page showing all saved stories with preview text, allowing students to click to view the full story

**Why this matters:** Provides a psychology team with rich qualitative data to understand each student's experiences and personality beyond test scores.

---

#### **Story 5: Document Upload System (6 hours)**

**What students can do:**

* Upload important files by either:  
  * Dragging files directly from their computer onto the screen  
  * Clicking a button to select files from their device  
* Choose what type of document it is (Certificate, Academic Results, Award, Reference Letter, Other)  
* Add an optional note describing what the document is (e.g., "GCSE Maths Certificate \- Grade 8")  
* See a complete list of everything they've uploaded including:  
  * File name and type (PDF, JPG, PNG, etc.)  
  * Category they assigned it to  
  * Upload date  
  * File size  
* Remove documents if uploaded by mistake

**Deliverables:**

* **Drag-and-drop file upload** \- Modern upload interface where students can drag files from their desktop directly onto the browser window  
* **Category selection (certificates, results, other)** \- Dropdown menu with 5-6 common document types to keep things organized  
* **Uploaded files list** \- Clean table or card view showing all documents with thumbnail previews for images, allowing students to download or delete items

**Why this matters:** Creates a centralized repository of important student documents that coaches and the psychology team can reference during sessions.

---

#### **Story 3: Assessment Results Submission (6 hours)**

**What students can do:**

* View a list of recommended psychological assessments with:  
  * Assessment name (e.g., "Big Five Personality Test")  
  * Brief description of what it measures  
  * Estimated completion time  
  * Direct link to the external test website  
* Follow clear instructions for each assessment:  
  * How to take the test  
  * How to capture their results (screenshot instructions)  
  * What specific information to include in the screenshot  
* Upload their completed assessment screenshots or PDF reports  
* Mark assessments as "Completed" once uploaded  
* Track which assessments are pending, in progress, or completed  
* See how many assessments they've finished out of the recommended total

**Deliverables:**

* **External assessment links and instructions** \- A list of 5-8 recommended assessments with clickable links and step-by-step guidance. Each assessment card shows whether it's required or optional.  
* **Image/PDF upload interface** \- Simple upload button for each assessment that accepts screenshots (JPG, PNG) or downloaded reports (PDF). Shows preview of uploaded image.  
* **Submission tracking list** \- Visual dashboard showing status of all assessments with color coding (green \= completed, amber \= in progress, red \= not started)

**Why this matters:** Ensures students complete all necessary assessments while maintaining flexibility to add or remove tests without development work.

---

#### **Story 7: Student iDNA Dashboard (14 hours)**

**What students will see:**

* **Assessment Results Section** \- Cards or tiles displaying key scores from each completed assessment  
  * Example: "16 Personalities test: **Architect**  
  * **INTJ-A**" with an architect cartoon image  
  * Color-coded indicators showing high/medium/low ranges  
  * Brief interpretation text (e.g., "You score highly in creative thinking")  
* **Life Stories Highlights** \- Featured excerpts from their most impactful story entries  
  * Shows 2-3 key stories with previews  
  * "Read More" links to view full stories  
* **Documents Panel** \- Quick access list of their uploaded documents  
  * Shows most recent 5 uploads with thumbnails  
  * "View All" button to see complete document library  
* **Next Steps Section** \- Recommendations or pending tasks  
  * Example: "Complete your Career Values assessment" or "Schedule a coaching session"  
* **Overall Profile Completion** \- Visual indicator showing how complete their iDNA is (e.g., "85% Complete")

**Deliverables:**

* **Dashboard layout with multiple sections** \- Single-page view organized into clear zones (assessment results at top, pillars in center, stories and documents below). Responsive design that works on tablets and computers.  
* **Charts and visual displays** \- Bar charts for individual test scores, radar/spider chart for 5 pillars, progress rings for completion percentages. Uses a consistent color scheme aligned with the brand.  
* **All components integrated in one view** \- Everything loads on one scrollable page so students see their complete profile without clicking through multiple pages. Includes smooth scrolling navigation menu.

**Why this matters:** This is the "wow" page that brings everything together \- students see their complete psychological profile in an engaging, visual format that's easy to understand and share with coaches.

---

#### **Story 10: Coach Dashboard View (4 hours)**

**What coaches can do:**

* Access any assigned student's iDNA dashboard through a secure link or coach portal  
* View exactly what the student sees: all assessment results, life stories, uploaded documents, and visualizations  
* See when the student last updated their profile  
* View coach-specific notes or flags (if any have been added by the psychology team)  
* Print or export a PDF summary of the student's iDNA for session preparation

**What coaches CANNOT do:**

* Edit the student's information directly  
* Change assessment scores  
* Delete or modify student stories  
* Access students they're not assigned to

**Deliverables:**

* **Read-only version of student dashboard** \- Identical visual layout to student view but with editing capabilities removed. All data displays but buttons for uploading or editing are hidden.  
* **Coach-specific header** \- Top banner showing "Coach View: \[Student Name\]" with coach's name, session date/time if scheduled, and last profile update timestamp.  
* **Access control interface** \- Backend system that checks coach permissions before loading student data. Students or admins can revoke access if needed.

**Why this matters:** Enables coaches to prepare for sessions by reviewing student profiles in advance and facilitates productive discussions during coaching sessions using shared visual reference points.

---

### **PHASE 2: Database & Backend Development (20 hours)**

*Making the interface work with real data*

#### **Story 1: Database Setup & API Creation (20 hours)**

**What this enables:**

* **Permanent data storage** \- Everything students enter is saved securely and persists across sessions. Students can log out and return weeks later to find their data intact.  
* **Data sharing with AI** \- Structured data format that can be easily accessed by AI coaching tools to provide personalized recommendations. I.e. provide Function Calling endpoints for AIs.  
* **Security and privacy** \- Data is encrypted, access-controlled by user roles (student/coach/admin), and compliant with data protection requirements.

**Deliverables:**

* **Database structure for all iDNA data** \- Organized tables/collections for:

  * User accounts (students, coaches) with encrypted passwords  
  * Life story entries linked to specific prompts  
  * Assessment scores and results metadata  
  * Document metadata (file location, category, upload date)  
  * User progress tracking (which steps completed)  
  * Coach assignments (which coaches can view which students)  
* **Connection between website and database** \- Technical bridge that allows the website to request data (e.g., "show me all stories for student ID 123") and receive formatted responses in milliseconds.

* **Secure file storage for uploads** \- Cloud storage system for images and PDFs with:

  * Virus scanning on upload  
  * Access restrictions (students only see their own files)  
  * Efficient retrieval when coaches or students view documents  
* **API endpoints for data access** \- 15-20 secure connection points that handle specific requests:

  * "Get student profile summary"  
  * "Save new life story"  
  * "Upload assessment result"  
  * "Get coach assigned students list"  
  * "Fetch student dashboard data for AI coach"  
* **User login system** \- Registration and authentication that:

  * Creates new student accounts with email verification  
  * Allows secure login with password  
  * Manages password resets  
  * Maintains session so users stay logged in  
  * Logs out after 2 hours of inactivity for security

**Data we'll store:**

* **Student basic information** \- Name, email, date of birth, school/institution, contact preferences, account creation date  
* **Life story text entries** \- Full text of each story, which prompt was used, creation date, last edited date, word count, publish status (draft vs. final)  
* **Uploaded files and images** \- File location in cloud storage, original filename, file type, size, category, upload timestamp, optional student notes  
* **Assessment results** \- Assessment name, completion date, key scores entered by staff, reliability indicators, external test provider name

**Why this matters:** This is the "engine" that makes everything work. Without this, the website is just pretty screens with fake data. This phase transforms the prototype into a real, working system that can handle actual users and real data.

---

### **PHASE 3: Connection & Deployment (16 hours)\*\***

*Putting it all together and making it live*

**What happens:**

1. **Replace sample data with real database connections**

   * Remove all placeholder/dummy data from frontend  
   * Connect each screen to appropriate database endpoint  
   * Test that data flows correctly: student enters information → saves to database → displays correctly when retrieved  
   * Verify that changes in one place (e.g., editing a story) update everywhere it's displayed  
2. **Launch website on hosting platform**

   * Deploy frontend to AWS Amplify (publicly accessible URL)  
   * Configure custom domain if available (e.g., idna.yourcompany.com)  
   * Set up automatic deployments so future updates can be pushed quickly  
   * Configure HTTPS security certificate for encrypted connections  
3. **Launch backend system on server**

   * Deploy backend to AWS Elastic Beanstalk  
   * Configure environment variables (database connections, API keys, etc.)  
   * Set up monitoring to track system health and performance  
   * Configure automatic scaling if user numbers grow  
4. **Test complete student journey**

   * Create test accounts for different user types (student, coach, admin)  
   * Walk through entire process: registration → profile completion → dashboard viewing → coach access  
   * Test edge cases: What happens if a student uploads the wrong file type? What if they try to access another student's data?  
5. **Enable user registration and login**

   * Enable logging with Google accounts

**Deliverables:**

* **Fully functional website** \- Live URL that anyone can visit, register, and use. All buttons work, all forms save data, all pages load correctly.

* **Working data flow from user → database → display** \- Complete circle of data:

  * Student types story → saves to database → appears in their dashboard → coach can view it → AI system can access it via API  
  * Every interaction tested and confirmed working  
* **Live system accessible online** \- Not just on developer's computer but available 24/7 from any internet-connected device. No downtime during normal use.

**What "live and deployed" means:**

* Students can register and start using the platform immediately  
* Data is being saved to real database, not temporary storage  
* Multiple users can work simultaneously without issues

**Why this matters:** This is the difference between a demo and a product. After Phase 3, you have a real system that students and coaches can actually use to create and view iDNA profiles.

---

## **What We'll Deliver by End of October**

✅ **Complete student experience** \- A new student can register, complete their profile, upload assessments, write stories, upload documents, and view their finished iDNA dashboard \- all within one session or across multiple visits.

✅ **Working upload systems** \- Students can drag-and-drop or select files for both assessment results (screenshots/PDFs) and supporting documents (certificates, etc.). Files are stored securely and can be viewed anytime.

✅ **Life story collection** \- Students can respond to 5-7 guided prompts with rich text, save multiple stories, edit drafts, and see all their entries in one place. The psychology team can access these for analysis.

✅ **Coach viewing capability** \- Coaches log in with their credentials, see a list of assigned students, click on any student to view their complete iDNA dashboard in read-only mode, and access session preparation materials.

✅ **AI-ready data** \- All student data is structured and accessible through secure API endpoints, ready to feed into AI coaching tools. Data format designed for easy integration with third-party AI systems.

✅ **Live, accessible platform** \- System hosted on reliable cloud infrastructure (AWS), accessible from any browser, secured with HTTPS encryption, with 99.9% uptime and daily backups.

**Additional benefits:**

* Responsive design works on desktop, tablet, and laptop screens  
* Clean, modern interface that's intuitive for 16-18 year old students  
* Admin panel for managing users and viewing system statistics  
* Automated email notifications for account verification and password resets

---

## **What's NOT Included (To Keep Within 80 Hours)**

❌ **Built-in assessment tests** \- Students use external websites (e.g., 16personalities.com, truity.com) instead of completing tests directly in our platform. This saves 60-80 hours of complex integration work per assessment.

❌ **Automatic processing of uploaded assessment images** \- Staff will manually review screenshots and enter key scores into the database. Building AI image recognition would require an additional 30-40 hours plus ongoing AI service costs (approximately £150-300/month).

❌ **Advanced text editing features** \- The story editor will have basic formatting (bold, italic, lists) but not advanced features like:

* Tables or charts  
* Image embedding within text  
* Multiple font sizes or colors  
* Collaboration or commenting features  
* Version history or change tracking

❌ **Mobile app optimization** \- The website will work on tablets and computers but is not optimized for smartphones. A mobile-responsive version would require an additional 20-30 hours.

❌ **Complex data analytics** \- No automated insights, trend analysis, or comparative statistics (e.g., "You score higher than 75% of students in Openness"). This would require 15-20 hours plus specialized charting libraries.

❌ **Automated assessment scoring** \- Test results from external platforms must be uploaded as images/PDFs and manually entered. Direct integration with external assessment APIs would require 15-20 hours per assessment plus recurring API fees.

❌ **Limited login methods** \- Students can only sign in using their Google Account. Creating accounts with email/password or logging in with other services (Apple ID, Microsoft, Facebook) is not supported. Adding multiple authentication methods would require an additional 10-15 hours of integration work per provider.

❌ **Advanced security features** \- Basic security is included (encrypted passwords, role-based access, HTTPS), but advanced features are not:

* Two-factor authentication  
* Session timeout warnings  
* IP-based access restrictions  
* Detailed audit logs of all user actions  
* Intrusion detection systems

❌ **Data export and reporting** \- No built-in PDF export of complete profiles or CSV downloads of data. Admin can access the database directly but there's no user-facing export button.

---

## **Technology Footnotes**

*Simplified explanations of the tools we're using*

**Supabase** – A cloud-based database service for storing student information. Think of it as a digital toolkit in the cloud that:

* Stores data in structured tables (like digital spreadsheets)  
* Handles user authentication, file storage, and APIs out of the box  
* Scales automatically as more students or data are added  
* Provides daily backups and simple recovery options  
* Free tier includes a database, authentication, and storage suitable for small projects  
* Hosted by Supabase, so we don’t manage servers or complex setup ourselves

**AWS Amplify** \- Amazon's hosting service specifically designed for modern websites. It:

* Hosts the student and coach-facing website  
* Automatically updates the live site when we push code changes  
* Handles traffic spikes (if 100 students log in simultaneously)  
* Provides free HTTPS security certificates  
* Costs approximately £5-15/month for our expected usage  
* Managed by Amazon, so highly reliable (99.9% uptime)

**AWS Elastic Beanstalk** \- Amazon's server hosting for the "backend" system that manages data and processes requests. This is the behind-the-scenes system that:

* Handles all database operations  
* Processes file uploads  
* Manages user authentication  
* Provides API endpoints for data access  
* Automatically scales if load increases  
* Costs approximately £20-40/month depending on usage

**Prisma** \- A database management tool that sits between our backend code and MongoDB. It:

* Translates our code commands into database operations  
* Prevents common database errors  
* Makes code cleaner and easier to maintain  
* Provides type-safety (catches errors before code runs)  
* Free and open-source  
* Reduces time spent writing repetitive database code by 40%

**React.js / Next.js** \- Modern website building frameworks that create fast, interactive user interfaces:

* **React.js** \- Like the engine; handles how the interface updates and responds to user actions (clicking buttons, filling forms)  
* **Next.js** \- Like the chassis; provides structure, routing (navigation between pages), and optimization  
* Together they create smooth, app-like experiences (no full page reloads, instant updates)  
* Industry standard used by Facebook, Netflix, Airbnb  
* Free and open-source with massive community support

**API Endpoints** \- Secure connection points that allow different systems to communicate and share data:

* Think of them like customer service phone extensions (press 1 for profile data, press 2 for assessment scores)  
* Each endpoint handles one specific type of request  
* Uses HTTPS encryption to keep data secure in transit  
* Example: The AI coach system calls the "get student profile" endpoint to retrieve data it needs  
* Allows future integrations without changing existing code

---

## **Risk Factors & Mitigation**

**Potential Risks:**

1. **Third-party service delays** (Low risk)

   * *Risk:* AWS setup or MongoDB approval takes longer than expected  
   * *Mitigation:* Start account setup in first week; have backup local development environment  
2. **Integration complexity** (Low risk)

   * *Risk:* Connecting frontend to backend reveals technical challenges  
   * *Mitigation:* Using proven technology stack (React \+ Prisma \+ MongoDB) with extensive documentation  
3. **File upload size limits** (Low risk)

   * *Risk:* Students upload very large files causing storage issues  
   * *Mitigation:* Implement 10MB file size limit on frontend; can be increased later if needed

   

