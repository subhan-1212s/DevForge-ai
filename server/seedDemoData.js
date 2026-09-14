const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/.env' });

const User = require('./models/User');
const Workspace = require('./models/Workspace');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Message = require('./models/Message');
const Bug = require('./models/Bug');
const Document = require('./models/Document');
const Notification = require('./models/Notification');

async function seedData() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://mohamedsubhan155:SUBHAN1212S@auction-ai.yqevviv.mongodb.net/devforge-ai?appName=auction-ai';
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas successfully.');

    console.log('Cleaning existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Message.deleteMany({}),
      Bug.deleteMany({}),
      Document.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('All previous data cleared.');

    // 1. Create Demo Users
    console.log('Creating demo users...');
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const userAlex = await User.create({
      name: 'Alex Morgan',
      email: 'demo@devforge.ai',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
    });

    const userSarah = await User.create({
      name: 'Sarah Chen',
      email: 'sarah.dev@devforge.ai',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80'
    });

    const userMarcus = await User.create({
      name: 'Marcus Vance',
      email: 'marcus.qa@devforge.ai',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
    });

    const userElena = await User.create({
      name: 'Elena Rostova',
      email: 'elena.ai@devforge.ai',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80'
    });

    // 2. Create Workspace
    console.log('Creating Enterprise Demo Workspace...');
    const workspace = await Workspace.create({
      name: 'DevForge AI Enterprise Lab',
      description: 'Next-generation collaborative developer workspace powered by Gemini AI engines, real-time sync, and automated sprint pipelines.',
      inviteCode: 'DEVFORGE',
      owner: userAlex._id,
      members: [
        { user: userAlex._id, role: 'owner' },
        { user: userSarah._id, role: 'admin' },
        { user: userMarcus._id, role: 'developer' },
        { user: userElena._id, role: 'developer' }
      ]
    });

    // Link workspace to users
    await User.updateMany(
      { _id: { $in: [userAlex._id, userSarah._id, userMarcus._id, userElena._id] } },
      { $push: { workspaces: workspace._id } }
    );

    // 3. Create Demo Projects
    console.log('Creating demo projects...');
    const project1 = await Project.create({
      name: 'Gemini Core Orchestrator',
      description: 'High-performance asynchronous microservice engine handling LLM prompts, code context indexing, and automated pull requests.',
      techStack: ['Node.js', 'Express', 'TypeScript', 'MongoDB', 'Docker'],
      status: 'active',
      priority: 'critical',
      progress: 78,
      repositoryUrl: 'https://github.com/subhan-1212s/DevForge-ai',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      workspaceId: workspace._id
    });

    const project2 = await Project.create({
      name: 'Real-Time Analytics & Telemetry',
      description: 'Distributed WebSocket metric pipeline tracking team efficiency rates, sprint velocity, and bug resolution speeds.',
      techStack: ['React 19', 'Socket.IO', 'TailwindCSS', 'Recharts'],
      status: 'active',
      priority: 'high',
      progress: 64,
      repositoryUrl: 'https://github.com/subhan-1212s/DevForge-ai',
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      workspaceId: workspace._id
    });

    workspace.projects = [project1._id, project2._id];
    await workspace.save();

    // 4. Create Kanban Tasks
    console.log('Creating sprint tasks...');
    await Task.create([
      {
        title: 'Optimize WebSocket latency for multi-user collaboration chat',
        description: 'Refactor Socket.IO room subscriptions to join on connect event and eliminate re-subscribing teardowns.',
        status: 'done',
        priority: 'critical',
        assignee: userAlex._id,
        projectId: project1._id,
        workspaceId: workspace._id,
        checklist: [
          { text: 'Add userRef to avoid auth store listener resets', completed: true },
          { text: 'Implement 0ms optimistic UI state update', completed: true },
          { text: 'Verify clean reconnect without message duplication', completed: true }
        ],
        comments: [
          { user: userSarah._id, text: 'Tested locally on 3 sockets concurrently. Latency is under 20ms!' }
        ],
        activity: [
          { user: userAlex._id, text: 'Moved task from In Progress to Done' }
        ]
      },
      {
        title: 'Integrate Gemini AI Assistant for code optimization & review',
        description: 'Provide automated AI suggestions, commit message generators, and stack trace debugging in the AI Suite.',
        status: 'in_progress',
        priority: 'critical',
        assignee: userElena._id,
        projectId: project1._id,
        workspaceId: workspace._id,
        checklist: [
          { text: 'Connect Gemini 3.7 Flash API handler', completed: true },
          { text: 'Build AI Suite tab UI with syntax highlighting', completed: true },
          { text: 'Add 1-click apply suggestion button to Monaco Editor', completed: false }
        ]
      },
      {
        title: 'Implement Brevo transactional email engine for OTP & alerts',
        description: 'Configure Brevo v3 API key integration for instant password resets, bug alerts, and welcome emails.',
        status: 'done',
        priority: 'high',
        assignee: userMarcus._id,
        projectId: project1._id,
        workspaceId: workspace._id,
        checklist: [
          { text: 'Store Brevo API Key safely in server env', completed: true },
          { text: 'Build emailService.js with HTML templates', completed: true }
        ]
      },
      {
        title: 'Add Vector Embedding cache for codebase retrieval',
        description: 'Build fast localized memory indexing for searching functions across repository files.',
        status: 'todo',
        priority: 'medium',
        assignee: userElena._id,
        projectId: project1._id,
        workspaceId: workspace._id
      },
      {
        title: 'Configure OAuth2 SSO for GitHub Enterprise login',
        description: 'Allow team developers to sign in seamlessly via organization GitHub accounts.',
        status: 'backlog',
        priority: 'low',
        assignee: userMarcus._id,
        projectId: project1._id,
        workspaceId: workspace._id
      },

      // Project 2 Tasks
      {
        title: 'Build SVG Donut Efficiency Chart for Project Dashboard',
        description: 'Calculate real-time task completion ratios and render smooth SVG progress rings.',
        status: 'done',
        priority: 'high',
        assignee: userSarah._id,
        projectId: project2._id,
        workspaceId: workspace._id
      },
      {
        title: 'Implement Instant Auth Hydration for 0ms Reloads',
        description: 'Store user state in localStorage and eliminate full-page environment loading screens.',
        status: 'done',
        priority: 'critical',
        assignee: userAlex._id,
        projectId: project2._id,
        workspaceId: workspace._id
      }
    ]);

    // 5. Create Messages (Collaboration Chat)
    console.log('Creating collaboration chat messages...');
    await Message.create([
      {
        sender: userSarah._id,
        text: 'Welcome to the DevForge AI Enterprise Lab! The real-time sprint board and Monaco editor code pads are all initialized.',
        workspaceId: workspace._id,
        projectId: project1._id,
        createdAt: new Date(Date.now() - 3600 * 1000 * 2)
      },
      {
        sender: userMarcus._id,
        text: 'Awesome! Brevo email service API is connected and verified. OTP email notifications are sending in under 1 second.',
        workspaceId: workspace._id,
        projectId: project1._id,
        createdAt: new Date(Date.now() - 3600 * 1000 * 1.5)
      },
      {
        sender: userElena._id,
        text: 'Gemini AI engine integration is active. The AI Suite tab can refactor code, analyze stack traces, and write commit messages automatically.',
        workspaceId: workspace._id,
        projectId: project1._id,
        createdAt: new Date(Date.now() - 3600 * 1000 * 1)
      },
      {
        sender: userAlex._id,
        text: 'Fantastic team effort! Collaboration Chat latency is under 20ms and instant page reloads are activated. Ready for judge demo presentation! 🚀',
        workspaceId: workspace._id,
        projectId: project1._id,
        createdAt: new Date(Date.now() - 1800 * 1000)
      }
    ]);

    // 6. Create Bugs (Bug Tracker & QA Log)
    console.log('Creating QA bug tickets...');
    await Bug.create([
      {
        title: 'Token refresh interceptor race condition under 500ms parallel requests',
        description: 'When multiple simultaneous API requests hit 401 un-authenticated states, only 1 refresh request should execute while others queue.',
        severity: 'high',
        status: 'resolved',
        stepsToReproduce: '1. Expire access token\n2. Trigger 10 parallel REST calls\n3. Verify queue locks',
        assignee: userAlex._id,
        projectId: project1._id,
        workspaceId: workspace._id
      },
      {
        title: 'WebSocket disconnection fallback delay during network switch',
        description: 'If network toggles from Wi-Fi to cellular data, Socket.IO client should attempt immediate reconnect within 1000ms.',
        severity: 'critical',
        status: 'in_progress',
        stepsToReproduce: '1. Open Collaboration Chat\n2. Disable network adapter\n3. Check reconnect log',
        assignee: userMarcus._id,
        projectId: project1._id,
        workspaceId: workspace._id
      },
      {
        title: 'Backdrop blur glassmorphism rendering on mobile Safari',
        description: 'Verify backdrop-filter compatibility across WebKit mobile browser views.',
        severity: 'low',
        status: 'open',
        stepsToReproduce: '1. Open workspace details on iPhone Safari\n2. Inspect modal glass overlay',
        assignee: userSarah._id,
        projectId: project2._id,
        workspaceId: workspace._id
      }
    ]);

    // 7. Create Project Wiki & Architecture Specs
    console.log('Creating Wiki specs...');
    await Document.create([
      {
        title: 'Chapter 1: Microservice & WebSocket Architecture Specs',
        content: `# DevForge AI Enterprise Lab - Architecture Overview

DevForge AI is an advanced agentic developer workspace engineered for real-time team collaboration, AI-driven code refactoring, and agile task tracking.

## Core Technology Stack
- **Frontend Framework**: React 19, Vite, TailwindCSS v4, Framer Motion
- **Backend API Server**: Node.js, Express.js, JWT Auth (Dual token + Refresh Cookies)
- **Real-Time Layer**: Socket.IO WebSockets with dedicated Project & User room channels
- **Database Layer**: MongoDB Atlas Cloud with Mongoose ODM
- **AI Intelligence**: Google Gemini 3.7 Flash Engine for automated code reviews, refactoring, and commit generation
- **Email Infrastructure**: Brevo Transactional API (v3)

## Key Technical Innovations
1. **0ms Latency Optimistic Chat UI**: Immediate optimistic rendering with background socket room synchronization.
2. **Instant Auth Hydration**: Sub-second page reloads via persistent localStorage hydration.
3. **Role-Based Access Control**: Granular workspace roles (Owner 👑, Admin ⚡, Developer 💻, Viewer 👁️) with integrated Admin Control Panel.`,
        author: userAlex._id,
        projectId: project1._id,
        workspaceId: workspace._id
      },
      {
        title: 'Chapter 2: Security, Authentication & Role RBAC Protocol',
        content: `# Security & Access Control Specifications

All API endpoints enforce strict JSON Web Token (JWT) validation and Workspace Membership Scoping.

### Role Hierarchy & Permissions
- **Workspace Owner 👑**: Full administrative privileges, role modification, invite code regeneration, project creation/deletion, and workspace destruction.
- **Workspace Admin ⚡**: Full member moderation, project creation/deletion, and invite code management.
- **Developer 💻**: Project creation, sprint card management, bug ticket logging, and collaboration chat.
- **Viewer 👁️**: Read-only access to projects, tasks, wiki docs, and telemetry analytics.`,
        author: userAlex._id,
        projectId: project1._id,
        workspaceId: workspace._id
      }
    ]);

    // 8. Create Notifications
    console.log('Creating demo notifications...');
    await Notification.create([
      {
        user: userAlex._id,
        sender: userSarah._id,
        type: 'task_assigned',
        message: 'Sarah Chen assigned you to task "Optimize WebSocket latency for multi-user collaboration chat"',
        read: false,
        workspaceId: workspace._id,
        projectId: project1._id
      },
      {
        user: userAlex._id,
        sender: userMarcus._id,
        type: 'project_updated',
        message: 'Marcus Vance deployed Brevo email API service integration',
        read: true,
        workspaceId: workspace._id,
        projectId: project1._id
      }
    ]);

    console.log('\n======================================================');
    console.log('🎉 DEMO DATA SEEDED SUCCESSFULLY FOR JUDGE PRESENTATION!');
    console.log('======================================================');
    console.log('Demo Account Credentials:');
    console.log('  Email:    demo@devforge.ai');
    console.log('  Password: Password123!');
    console.log('Workspace Details:');
    console.log('  Workspace Name: DevForge AI Enterprise Lab');
    console.log('  Invite Code:    DEVFORGE');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedData();
