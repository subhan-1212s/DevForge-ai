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

    // PRESERVE ALL EXISTING USER ACCOUNTS! Do NOT delete User collection!
    console.log('Cleaning non-user collections (preserving all registered user accounts)...');
    await Promise.all([
      Workspace.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Message.deleteMany({}),
      Bug.deleteMany({}),
      Document.deleteMany({}),
      Notification.deleteMany({})
    ]);

    // Find all existing registered user accounts in DB
    const existingUsers = await User.find({});
    console.log(`Found ${existingUsers.length} existing user accounts in DB.`);

    // Ensure demo teammates exist (Sarah, Marcus, Elena) for realistic team collaboration
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    let userSarah = await User.findOne({ email: 'sarah.dev@devforge.ai' });
    if (!userSarah) {
      userSarah = await User.create({
        name: 'Sarah Chen',
        email: 'sarah.dev@devforge.ai',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80'
      });
    }

    let userMarcus = await User.findOne({ email: 'marcus.qa@devforge.ai' });
    if (!userMarcus) {
      userMarcus = await User.create({
        name: 'Marcus Vance',
        email: 'marcus.qa@devforge.ai',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
      });
    }

    let userElena = await User.findOne({ email: 'elena.ai@devforge.ai' });
    if (!userElena) {
      userElena = await User.create({
        name: 'Elena Rostova',
        email: 'elena.ai@devforge.ai',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80'
      });
    }

    // Determine primary owner from existing non-demo user accounts or fallback
    const primaryUser = existingUsers.find(u => 
      u.email !== 'sarah.dev@devforge.ai' && 
      u.email !== 'marcus.qa@devforge.ai' && 
      u.email !== 'elena.ai@devforge.ai'
    ) || existingUsers[0];

    let ownerUser = primaryUser;
    if (!ownerUser) {
      ownerUser = await User.create({
        name: 'Alex Morgan',
        email: 'demo@devforge.ai',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
      });
    }

    console.log(`Setting Workspace Owner to: ${ownerUser.name} (${ownerUser.email})`);

    // Build members list: ownerUser is Owner, plus any other registered users as Owner/Admin
    const membersList = [
      { user: ownerUser._id, role: 'owner' },
      { user: userSarah._id, role: 'admin' },
      { user: userMarcus._id, role: 'developer' },
      { user: userElena._id, role: 'developer' }
    ];

    // Add all other existing registered users to membersList as Owner/Admin
    for (const u of existingUsers) {
      if (!membersList.some(m => m.user.toString() === u._id.toString())) {
        membersList.push({ user: u._id, role: 'owner' });
      }
    }

    // Create Workspace
    const workspace = await Workspace.create({
      name: 'DevForge AI Enterprise Lab',
      description: 'Next-generation collaborative developer workspace powered by Gemini AI engines, real-time sync, and automated sprint pipelines.',
      inviteCode: 'DEVFORGE',
      owner: ownerUser._id,
      members: membersList
    });

    // Update all users' workspaces array
    const allMemberUserIds = membersList.map(m => m.user);
    await User.updateMany(
      { _id: { $in: allMemberUserIds } },
      { $addToSet: { workspaces: workspace._id } }
    );

    // Create Demo Projects
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

    // Create Sprint Tasks (Kanban Board)
    console.log('Creating sprint tasks...');
    await Task.create([
      {
        title: 'Optimize WebSocket latency for multi-user collaboration chat',
        description: 'Refactor Socket.IO room subscriptions to join on connect event and eliminate re-subscribing teardowns.',
        status: 'done',
        priority: 'critical',
        assignee: ownerUser._id,
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
          { user: ownerUser._id, text: 'Moved task from In Progress to Done' }
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
        assignee: ownerUser._id,
        projectId: project2._id,
        workspaceId: workspace._id
      }
    ]);

    // Create Collaboration Chat Messages
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
        sender: ownerUser._id,
        text: 'Fantastic team effort! Collaboration Chat latency is under 20ms and instant page reloads are activated. Ready for judge demo presentation! 🚀',
        workspaceId: workspace._id,
        projectId: project1._id,
        createdAt: new Date(Date.now() - 1800 * 1000)
      }
    ]);

    // Create QA Bug Tickets
    console.log('Creating QA bug tickets...');
    await Bug.create([
      {
        title: 'Token refresh interceptor race condition under 500ms parallel requests',
        description: 'When multiple simultaneous API requests hit 401 un-authenticated states, only 1 refresh request should execute while others queue.',
        severity: 'high',
        status: 'resolved',
        stepsToReproduce: '1. Expire access token\n2. Trigger 10 parallel REST calls\n3. Verify queue locks',
        assignee: ownerUser._id,
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

    // Create Project Wiki Specs
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
        author: ownerUser._id,
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
        author: ownerUser._id,
        projectId: project1._id,
        workspaceId: workspace._id
      }
    ]);

    // Create Notifications
    console.log('Creating demo notifications...');
    await Notification.create([
      {
        user: ownerUser._id,
        sender: userSarah._id,
        type: 'task_assigned',
        message: 'Sarah Chen assigned you to task "Optimize WebSocket latency for multi-user collaboration chat"',
        read: false,
        workspaceId: workspace._id,
        projectId: project1._id
      },
      {
        user: ownerUser._id,
        sender: userMarcus._id,
        type: 'project_updated',
        message: 'Marcus Vance deployed Brevo email API service integration',
        read: true,
        workspaceId: workspace._id,
        projectId: project1._id
      }
    ]);

    console.log('\n======================================================');
    console.log('🎉 DEMO WORKSPACE ATTACHED TO YOUR ACCOUNT SUCCESSFULLY!');
    console.log('======================================================');
    console.log(`Workspace Owner: ${ownerUser.name} (${ownerUser.email})`);
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
