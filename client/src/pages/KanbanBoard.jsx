import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { socket } from '../services/socket';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Calendar, 
  CheckSquare, 
  User as UserIcon,
  Sparkles,
  ClipboardList,
  Edit2
} from 'lucide-react';

const COLUMNS = [
  { id: 'backlog', name: 'Backlog', color: 'bg-slate-400' },
  { id: 'todo', name: 'Todo', color: 'bg-indigo-400' },
  { id: 'in_progress', name: 'In Progress', color: 'bg-amber-400' },
  { id: 'code_review', name: 'Code Review', color: 'bg-purple-400' },
  { id: 'testing', name: 'Testing', color: 'bg-blue-400' },
  { id: 'done', name: 'Done', color: 'bg-emerald-400' }
];

export default function KanbanBoard() {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentWorkspace, currentWorkspaceRole, fetchWorkspaceDetails } = useWorkspaceStore();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & Details State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Task Creation Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDeadline, setNewDeadline] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [newChecklist, setNewChecklist] = useState('');

  // Comment Form State
  const [commentText, setCommentText] = useState('');

  // Load task lists
  const fetchTasks = async () => {
    try {
      const { data } = await api.get(`/tasks?projectId=${projectId}`);
      setTasks(data.tasks);
    } catch (err) {
      setError('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentWorkspace) {
      fetchWorkspaceDetails(workspaceId);
    }
    fetchTasks();

    // Socket.io listeners
    socket.connect();
    socket.emit('join_project', projectId);

    socket.on('task_updated', (updatedTask) => {
      setTasks((prevTasks) => 
        prevTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
      // Sync selected task modal if open
      setSelectedTask((prev) => (prev?._id === updatedTask._id ? updatedTask : prev));
    });

    return () => {
      socket.emit('leave_project', projectId);
      socket.disconnect();
    };
  }, [workspaceId, projectId]);

  // Drag and Drop Handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Optimistically update status local state
    const originalTasks = [...tasks];
    const taskToMove = tasks.find(t => t._id === taskId);
    if (!taskToMove || taskToMove.status === columnId) return;

    const updatedTask = { ...taskToMove, status: columnId };
    setTasks(tasks.map(t => (t._id === taskId ? updatedTask : t)));

    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status: columnId });
      // Emit socket event to notify other users
      socket.emit('task_moved', { projectId, task: data.task });
    } catch (err) {
      console.error(err);
      setTasks(originalTasks); // rollback
    }
  };

  // Create Task Submission
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const checklistItems = newChecklist
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => ({ text: item, completed: false }));

    try {
      const { data } = await api.post('/tasks', {
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        deadline: newDeadline || undefined,
        assignee: newAssigneeId || undefined,
        projectId,
        workspaceId,
        checklist: checklistItems
      });

      setTasks([...tasks, data.task]);
      setShowCreateModal(false);
      
      // Reset form
      setNewTitle('');
      setNewDesc('');
      setNewPriority('medium');
      setNewDeadline('');
      setNewAssigneeId('');
      setNewChecklist('');
      
      fetchTasks(); // reload to sync populates
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Checklist Item Status
  const handleToggleChecklist = async (taskId, itemId, completed) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    const updatedChecklist = task.checklist.map(item => 
      item._id === itemId ? { ...item, completed } : item
    );

    try {
      const { data } = await api.put(`/tasks/${taskId}`, { checklist: updatedChecklist });
      setTasks(tasks.map(t => (t._id === taskId ? data.task : t)));
      setSelectedTask(data.task);
      socket.emit('task_moved', { projectId, task: data.task });
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Comments
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;

    try {
      const { data } = await api.post(`/tasks/${selectedTask._id}/comment`, { text: commentText });
      setCommentText('');
      setSelectedTask(data.task);
      setTasks(tasks.map(t => (t._id === selectedTask._id ? data.task : t)));
      socket.emit('task_moved', { projectId, task: data.task });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
      setSelectedTask(null);
      // Notify other clients by sending a socket broadcast (we can trigger reload on their end)
      socket.emit('task_moved', { projectId, task: { _id: taskId, status: 'deleted' } });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans text-[#1d1d1f]">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div className="flex items-center gap-3">
          <Link 
            to={`/workspace/${workspaceId}/project/${projectId}`}
            className="p-2 rounded-lg bg-white border border-black/5 hover:bg-slate-100 text-slate-600 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="text-[9px] font-bold text-slate-400 font-display">PROJECT TOOLS</span>
            <h1 className="text-xl sm:text-2xl font-extrabold font-display">Kanban Board</h1>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-premium-primary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-sm cursor-pointer font-sans"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </button>
      </div>

      {/* Grid: Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start overflow-x-auto">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div 
              key={col.id} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="bg-[#f5f5f7] border border-black/5 rounded-2xl p-3.5 space-y-3.5 min-h-[450px] flex flex-col"
            >
              {/* Column Title Header */}
              <div className="flex items-center justify-between border-b border-black/5 pb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  <h3 className="text-xs font-bold font-display">{col.name}</h3>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-white border border-black/5 px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List Container */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colTasks.map((task) => (
                  <motion.div
                    key={task._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    onClick={() => setSelectedTask(task)}
                    className="bg-white rounded-xl p-3 border border-black/5 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none space-y-3"
                  >
                    <h4 className="text-xs font-semibold text-[#1d1d1f] font-sans line-clamp-2 leading-snug">
                      {task.title}
                    </h4>

                    {/* Task Metadata */}
                    <div className="flex items-center justify-between gap-2 text-[9px] text-slate-400">
                      <span className={`font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${task.priority === 'critical' ? 'bg-red-50 text-red-600' : task.priority === 'high' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                        {task.priority}
                      </span>
                      
                      {task.assignee && (
                        <div className="w-5 h-5 rounded-full bg-slate-200 border border-black/5 flex items-center justify-center font-bold text-[8px] text-slate-600 overflow-hidden">
                          {task.assignee.avatar ? (
                            <img src={task.assignee.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            task.assignee.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal Overlay */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl bg-white rounded-2xl border border-black/10 shadow-premium-lg overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-black/5 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-sans">
                    <span className="capitalize">{selectedTask.status.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="capitalize font-bold text-[#0071e3]">{selectedTask.priority} priority</span>
                  </div>
                  <h3 className="text-lg font-bold font-display text-[#1d1d1f] mt-1">{selectedTask.title}</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDeleteTask(selectedTask._id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer text-sm font-bold font-sans"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                {/* Left 2 Cols: Details, Checklist, Comments */}
                <div className="md:col-span-2 space-y-6">
                  {selectedTask.description && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-display">Description</h4>
                      <p className="text-xs text-slate-600 bg-[#f5f5f7] border border-black/5 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
                    </div>
                  )}

                  {/* Checklist */}
                  {selectedTask.checklist && selectedTask.checklist.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 font-display flex items-center gap-1.5">
                        <CheckSquare className="h-4 w-4 text-[#0071e3]" />
                        Checklist
                      </h4>
                      <div className="space-y-2">
                        {selectedTask.checklist.map((item) => (
                          <label key={item._id} className="flex items-center gap-2.5 p-2 rounded-xl border border-black/5 hover:bg-[#f5f5f7] cursor-pointer text-xs transition-colors">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={(e) => handleToggleChecklist(selectedTask._id, item._id, e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-[#0071e3] focus:ring-[#0071e3]"
                            />
                            <span className={item.completed ? 'line-through text-slate-400' : 'text-slate-700'}>{item.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments list */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-[#0071e3]" />
                      Comments
                    </h4>
                    
                    {/* Add comment */}
                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment to this task..."
                        className="glass-input flex-1 p-2 text-xs"
                      />
                      <button type="submit" className="btn-premium-primary px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer">
                        Send
                      </button>
                    </form>

                    <div className="space-y-2.5 max-h-[180px] overflow-y-auto">
                      {selectedTask.comments && selectedTask.comments.map((comment) => (
                        <div key={comment._id} className="flex gap-2.5 p-2.5 rounded-xl border border-black/5 bg-[#f5f5f7]/50 text-xs">
                          <div className="w-6 h-6 rounded-full bg-slate-200 border border-black/5 flex items-center justify-center font-bold text-[9px] shrink-0 overflow-hidden">
                            {comment.user?.avatar ? (
                              <img src={comment.user.avatar} alt="User" className="w-full h-full object-cover" />
                            ) : (
                              comment.user?.name ? comment.user.name.substring(0, 2).toUpperCase() : 'US'
                            )}
                          </div>
                          <div>
                            <div className="flex gap-1.5 items-center">
                              <span className="font-semibold text-slate-700">{comment.user?.name}</span>
                              <span className="text-[9px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-600 mt-0.5 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Col: Meta settings */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l border-black/5 pt-4 md:pt-0 md:pl-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assignee</span>
                    <div className="flex items-center gap-2 mt-1.5 p-2 rounded-xl border border-black/5">
                      {selectedTask.assignee ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-slate-200 border border-black/5 flex items-center justify-center font-bold text-[9px] text-slate-600 overflow-hidden shrink-0">
                            {selectedTask.assignee.avatar ? (
                              <img src={selectedTask.assignee.avatar} alt="Assignee" className="w-full h-full object-cover" />
                            ) : (
                              selectedTask.assignee.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <span className="text-xs font-semibold truncate text-slate-700">{selectedTask.assignee.name}</span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </div>
                  </div>

                  {selectedTask.deadline && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deadline</span>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600">
                        <Calendar className="h-4 w-4 text-[#0071e3]" />
                        <span>{new Date(selectedTask.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Activity Logs */}
                  <div className="pt-2 border-t border-black/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display">Activity Logs</span>
                    <div className="mt-2 space-y-2 max-h-[140px] overflow-y-auto">
                      {selectedTask.activity && selectedTask.activity.map((act, i) => (
                        <div key={i} className="text-[10px] text-slate-500 leading-snug">
                          <span className="font-semibold text-slate-700">{act.user?.name || 'User'}</span> {act.text}
                          <p className="text-[8px] text-slate-400 mt-0.5">{new Date(act.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Task Modal Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl p-6 border border-black/10 shadow-premium-lg relative overflow-hidden"
          >
            <h3 className="text-lg font-bold text-[#1d1d1f] mb-5 font-display flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#0071e3]" />
              Create a New Task
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="E.g. Code authorization routes"
                  className="glass-input w-full p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the goals of this task..."
                  rows={2}
                  className="glass-input w-full p-2.5 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="glass-input w-full p-2.5 text-sm bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Deadline</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="glass-input w-full p-2.5 text-sm text-slate-500"
                  />
                </div>
              </div>

              {/* Assignee select from workspace users */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Assignee</label>
                <select
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="glass-input w-full p-2.5 text-sm bg-white"
                >
                  <option value="">Unassigned</option>
                  {currentWorkspace?.members && currentWorkspace.members.map((member) => (
                    <option key={member.user._id} value={member.user._id}>
                      {member.user.name} ({member.user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5 font-display">Checklist Items (one per line)</label>
                <textarea
                  value={newChecklist}
                  onChange={(e) => setNewChecklist(e.target.value)}
                  placeholder="Task item 1&#10;Task item 2"
                  rows={2}
                  className="glass-input w-full p-2.5 text-sm font-sans resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-premium-secondary flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle}
                  className="btn-premium-primary flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
