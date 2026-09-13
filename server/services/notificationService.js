const Notification = require('../models/Notification');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const { sendEmail } = require('./emailService');

/**
 * Dispatches real-time Socket.IO notifications & Brevo HTML emails to all teammates in a workspace
 */
exports.notifyWorkspaceTeammates = async ({ senderId, workspaceId, projectId, type, message }) => {
  try {
    if (!senderId || !workspaceId || !message) return;

    const workspace = await Workspace.findById(workspaceId).populate('members.user', 'name email avatar');
    const sender = await User.findById(senderId);

    if (!workspace || !sender) return;

    // Collect all recipient user IDs and emails excluding the sender
    const recipientMap = new Map();

    // Check workspace owner
    const ownerId = workspace.owner.toString();
    if (ownerId !== senderId.toString()) {
      const ownerUser = await User.findById(ownerId);
      if (ownerUser) {
        recipientMap.set(ownerId, ownerUser);
      }
    }

    // Check workspace members
    if (workspace.members && workspace.members.length > 0) {
      workspace.members.forEach(member => {
        if (member.user && member.user._id) {
          const mId = member.user._id.toString();
          if (mId !== senderId.toString()) {
            recipientMap.set(mId, member.user);
          }
        }
      });
    }

    if (recipientMap.size === 0) return;

    // Get Socket.IO instance
    let io = null;
    try {
      const { getIO } = require('../config/socket');
      io = getIO();
    } catch (sErr) {
      console.warn("Socket.IO instance not initialized yet for notification dispatch.");
    }

    const recipientEmails = [];

    // Process each teammate recipient
    for (const [recId, recUser] of recipientMap.entries()) {
      // 1. Create In-App Notification document
      const notification = await Notification.create({
        user: recId,
        sender: senderId,
        type: type || 'workspace_update',
        message,
        workspaceId,
        projectId: projectId || null
      });

      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'name email avatar');

      // 2. Emit real-time Socket.IO event to recipient's personal user room
      if (io) {
        io.to(`user:${recId}`).emit('notification_received', populatedNotification);
      }

      if (recUser.email) {
        recipientEmails.push(recUser.email);
      }
    }

    // 3. Dispatch Brevo SMTP HTML email alert to all teammates
    if (recipientEmails.length > 0) {
      const actionTitle = (type || 'workspace_update').replace(/_/g, ' ').toUpperCase();
      const subject = `[DevForge AI] Workspace Update: ${actionTitle}`;
      const portalUrl = process.env.CLIENT_URL || 'http://localhost:5173';

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1d1d1f; max-width: 560px; padding: 24px; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <h2 style="color: #0071e3; margin: 0; font-size: 20px; font-weight: 700;">DevForge AI Workspace Alert</h2>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #1d1d1f;">
            <strong>${sender.name}</strong> ${message}.
          </p>
          <div style="margin: 20px 0; padding: 14px 18px; background-color: #f5f5f7; border-left: 4px solid #0071e3; border-radius: 8px; font-size: 13px; color: #515154;">
            Workspace: <strong>${workspace.name}</strong><br/>
            Update Category: <strong>${actionTitle}</strong>
          </div>
          <p style="font-size: 13px; line-height: 1.5; color: #86868b;">
            Access your DevForge AI workspace to view live changes and collaborate with your team:
          </p>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${portalUrl}" style="display: inline-block; background-color: #1d1d1f; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 12px; font-weight: 600;">
              Open Workspace Dashboard
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.06); margin: 24px 0 16px 0;" />
          <p style="font-size: 10px; color: #86868b; text-align: center; margin: 0;">
            This is an automated workspace notification. Delivered via Brevo API.
          </p>
        </div>
      `;

      sendEmail({
        to: recipientEmails,
        subject,
        htmlContent
      }).catch(e => console.error('Brevo workspace update email error:', e));
    }
  } catch (error) {
    console.error('Failed to notify workspace teammates:', error);
  }
};
