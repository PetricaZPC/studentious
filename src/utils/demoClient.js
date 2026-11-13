import axios from 'axios';

/**
 * Demo mode that needs no server, database or account.
 *
 * "Try application" on the login page calls startDemo(), which stores sample data in the visitor's own browser
 * (localStorage). While demo mode is on, requests to /api/* (fetch and axios) are answered from that local data,
 * so every page works unchanged. Nothing is sent to or saved on the server; logging out or clearing the site
 * data removes the demo.
 */

const FLAG_KEY = 'stDemo';
const STATE_KEY = 'stDemoState';

const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const ago = (ms) => new Date(Date.now() - ms).toISOString();
const isoDate = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

export function isDemoMode() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

const SAMPLE_NOTE = '\n\n*Sample summary included with the demo (no AI call was made).*';

const SUMMARY_ALGO = `## Overview

This lecture introduces the core data structures used in everyday programming and how to choose between them.

## Key Concepts

• **Arrays** give constant-time access by index but costly inserts in the middle.
• **Linked lists** make inserts cheap but access sequential.
• **Hash tables** offer average constant-time lookup by key.
• **Trees** keep data ordered and allow logarithmic search.

## Takeaways

• Pick the structure from the operations you perform most often.
• Measure complexity with Big-O notation, not with guesses.${SAMPLE_NOTE}`;

const SUMMARY_DB = `## Overview

An introduction to relational databases: tables, keys and the SQL language used to query them.

## Key Concepts

• **Primary and foreign keys** link rows between tables.
• **SELECT / JOIN / GROUP BY** are the building blocks of most queries.
• **Normalization** removes duplicated data and prevents update anomalies.
• **Indexes** speed up reads at the cost of slower writes.

## Takeaways

• Design the schema first, then write the queries.
• Always check a query with EXPLAIN before adding an index.${SAMPLE_NOTE}`;

const SUMMARY_PHYSICS = `## Overview

A short revision sheet on Newton's laws of motion and their everyday applications.

## Key Concepts

• **First law:** an object keeps its velocity unless a net force acts on it.
• **Second law:** F = m · a links force, mass and acceleration.
• **Third law:** every action has an equal and opposite reaction.

## Takeaways

• Draw a free-body diagram before solving any problem.${SAMPLE_NOTE}`;

const SUMMARY_GENERIC = `## Overview

This is a sample summary: in the real app the document text is summarized by Google Gemini.

## Key Points

• The AI summary uses a free API key that has probably expired, so the demo shows this static example.
• Open the sample courses to see complete summaries.${SAMPLE_NOTE}`;

function buildInitialState() {
  const me = {
    id: 'demo-user',
    email: 'demo@studentious.app',
    fullName: 'Demo Student',
    role: 'student',
    createdAt: ago(14 * 86400000),
    photoURL: null,
    bio: 'Exploring Studentious in demo mode.',
    interests: ['Algorithms', 'Databases'],
  };
  const teacher = { _id: 'demo-teacher', email: 'demo.teacher@studentious.app', fullName: 'Dr. Elena Popescu' };
  const now = new Date().toISOString();

  const course = (name, description, file, summary, owner, isPublic) => ({
    _id: `c-${rid()}`,
    name,
    description,
    fileUrl: file,
    fileName: file ? file.split('/').pop() : 'upload',
    fileType: 'pdf',
    uploadedBy: owner.email,
    uploaderName: owner.fullName,
    userId: owner.id || owner._id,
    createdAt: now,
    summarized: Boolean(summary),
    summary: summary || undefined,
    summaryType: summary ? 'sample' : undefined,
    detectedLanguage: summary ? 'en' : undefined,
    isPublic,
  });

  const eventBase = {
    creatorId: teacher._id,
    creatorName: teacher.fullName,
    creatorEmail: teacher.email,
    creatorRole: 'teacher',
    createdAt: now,
  };

  const roomMessages = (items) =>
    items.map(([senderName, content, minutesAgo], i) => ({
      _id: `rm-${rid()}${i}`,
      content,
      senderId: senderName === 'Demo Student' ? me.id : `user-${senderName.slice(0, 3).toLowerCase()}`,
      senderName,
      timestamp: ago(minutesAgo * 60000),
    }));

  const general = rid();
  const study = rid();

  return {
    me,
    teachers: [teacher],
    courses: [
      course('Data Structures - Lecture 1', 'Arrays, lists, hash tables and trees (sample public course).', '/demo/data-structures.pdf', SUMMARY_ALGO, teacher, true),
      course('Intro to SQL Databases', 'Tables, keys, joins and indexes (sample public course).', '/demo/sql-databases.pdf', SUMMARY_DB, teacher, true),
      course("Physics - Newton's Laws (your sample course)", 'A private sample course. Try making it public or uploading your own.', '/demo/newton-laws.pdf', SUMMARY_PHYSICS, me, false),
    ],
    events: [
      { ...eventBase, _id: `e-${rid()}`, title: 'Algorithms study group', description: 'Weekly practice session: sorting and graph problems.', date: isoDate(2), time: '17:00', startTime: `${isoDate(2)}T17:00`, endTime: `${isoDate(2)}T19:00`, location: 'Library, room 2', maxParticipants: 12, currentParticipants: 3, participants: ['u-a', 'u-b', 'u-c'] },
      { ...eventBase, _id: `e-${rid()}`, title: 'SQL workshop', description: 'Hands-on joins and indexes with a sample database.', date: isoDate(5), time: '14:00', startTime: `${isoDate(5)}T14:00`, endTime: `${isoDate(5)}T16:00`, location: 'Online', maxParticipants: 30, currentParticipants: 8, participants: ['u-a', 'u-b', 'u-c', 'u-d', 'u-e', 'u-f', 'u-g', 'u-h'] },
      { ...eventBase, _id: `e-${rid()}`, title: 'Exam preparation Q&A', description: 'Ask anything before the exam.', date: isoDate(9), time: '10:00', startTime: `${isoDate(9)}T10:00`, endTime: `${isoDate(9)}T11:30`, location: 'Lecture hall A', maxParticipants: 50, currentParticipants: 21, participants: ['u-a', 'u-b'] },
    ],
    chatrooms: [
      {
        id: general,
        name: 'General discussion',
        type: 'General',
        description: 'Say hi and ask questions (sample room).',
        isPublic: true,
        createdBy: teacher._id,
        createdAt: now,
        participants: 12,
        messages: roomMessages([
          ['Dr. Elena Popescu', 'Welcome to Studentious! This is a sample chat room.', 90],
          ['Andrei', 'Does anyone have notes for the SQL lecture?', 60],
          ['Dr. Elena Popescu', 'Yes - check the public course "Intro to SQL Databases".', 45],
        ]),
      },
      {
        id: study,
        name: 'Algorithms study group',
        type: 'Study Group',
        description: 'Practice problems and solutions.',
        isPublic: true,
        createdBy: teacher._id,
        createdAt: now,
        participants: 5,
        messages: roomMessages([
          ['Maria', 'Anyone up for solving the graph problems tonight?', 30],
          ['Andrei', 'Yes, I am in. BFS first?', 20],
        ]),
      },
    ],
  };
}

function saveState(state) {
  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // storage full or blocked: the demo keeps working for this page load only
  }
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to a fresh state
  }
  const fresh = buildInitialState();
  saveState(fresh);
  return fresh;
}

/** Turns demo mode on with fresh sample data and returns the demo user. */
export function startDemo() {
  const state = buildInitialState();
  window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  window.localStorage.setItem(FLAG_KEY, '1');
  return state.me;
}

export function stopDemo() {
  try {
    window.localStorage.removeItem(FLAG_KEY);
    window.localStorage.removeItem(STATE_KEY);
  } catch {
    // ignore
  }
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const readJson = (init) => {
  try {
    return JSON.parse((init && init.body) || '{}');
  } catch {
    return {};
  }
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

const publicUser = (state) => ({
  id: state.me.id,
  email: state.me.email,
  fullName: state.me.fullName,
  role: state.me.role,
  isDemo: true,
});

async function route(url, init) {
  const method = ((init && init.method) || 'GET').toUpperCase();
  const u = new URL(url, window.location.origin);
  const path = u.pathname;
  const state = loadState();
  const me = state.me;

  switch (path) {
    case '/api/auth/checkAuth':
      return json({ message: 'Authenticated', ...publicUser(state) });
    case '/api/users/me':
      return json(publicUser(state));
    case '/api/auth/logout':
      stopDemo();
      return json({ message: 'Logged out' });

    case '/api/users/check-teacher':
      return json({ isTeacher: me.role === 'teacher' });
    case '/api/users/become-teacher':
      me.role = 'teacher';
      saveState(state);
      return json({ message: 'Successfully upgraded to teacher role' });
    case '/api/users/teachers':
      return json({
        teachers: [...state.teachers, ...(me.role === 'teacher' ? [{ _id: me.id, email: me.email, fullName: me.fullName }] : [])],
      });
    case '/api/users/profile':
      return json({ fullName: me.fullName, email: me.email, photoURL: me.photoURL, bio: me.bio, interests: me.interests });
    case '/api/users/update-profile': {
      const { fullName, interests, photoURL } = readJson(init);
      if (fullName !== undefined) me.fullName = fullName;
      if (interests !== undefined) me.interests = interests;
      if (photoURL) me.photoURL = photoURL;
      saveState(state);
      return json({ message: 'Profile updated successfully', fullName: me.fullName, interests: me.interests });
    }
    case '/api/users/metadata':
      return json({ createdAt: me.createdAt, lastSignIn: new Date().toISOString() });
    case '/api/users/events':
      return json({ events: state.events.filter((e) => e.participants.includes(me.id)) });
    case '/api/users/activities': {
      const events = state.events
        .filter((e) => e.participants.includes(me.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      return json({
        activities: events.map((e) => ({
          _id: e._id, type: 'event', title: e.title, description: e.description, date: e.date, time: e.time,
          timestamp: e.createdAt, isCreator: e.creatorId === me.id,
        })),
      });
    }
    case '/api/notifications/unread':
      return json({ notifications: [] });

    case '/api/events/list':
      return json({ events: state.events });
    case '/api/events/create': {
      const b = readJson(init);
      if (!b.title || !b.date || !b.time || !b.maxParticipants) return json({ message: 'Missing required fields' }, 400);
      const event = {
        _id: `e-${rid()}`,
        title: b.title,
        description: b.description || '',
        date: b.date,
        time: b.time,
        location: b.location || '',
        maxParticipants: parseInt(b.maxParticipants, 10),
        currentParticipants: 1,
        participants: [me.id],
        creatorId: me.id,
        creatorName: me.fullName,
        creatorEmail: me.email,
        creatorRole: me.role === 'teacher' ? 'teacher' : 'student',
        createdAt: new Date().toISOString(),
        startTime: b.startTime,
        endTime: b.endTime,
      };
      state.events.push(event);
      saveState(state);
      return json({ message: 'Event created successfully', eventId: event._id }, 201);
    }
    default:
      break;
  }

  let m = /^\/api\/events\/join\/([^/]+)$/.exec(path);
  if (m) {
    const event = state.events.find((e) => e._id === m[1]);
    if (!event) return json({ message: 'Event not found' }, 404);
    if (event.participants.includes(me.id)) return json({ message: 'User already joined this event' }, 400);
    if (event.currentParticipants >= event.maxParticipants) return json({ message: 'Event is full' }, 400);
    event.participants.push(me.id);
    event.currentParticipants += 1;
    saveState(state);
    return json({ message: 'Successfully joined event' });
  }
  m = /^\/api\/events\/delete\/([^/]+)$/.exec(path);
  if (m) {
    const event = state.events.find((e) => e._id === m[1]);
    if (!event) return json({ message: 'Event not found' }, 404);
    if (event.creatorId !== me.id) return json({ message: 'Only the event creator can delete this event' }, 403);
    state.events = state.events.filter((e) => e._id !== m[1]);
    saveState(state);
    return json({ message: 'Event deleted successfully' });
  }

  if (path === '/api/courses/list') {
    return json({ courses: state.courses.filter((c) => c.uploadedBy === me.email).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
  }
  if (path === '/api/courses/public') {
    return json({ courses: state.courses.filter((c) => c.isPublic).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
  }
  if (path === '/api/courses/create') {
    const form = init && init.body;
    if (!form || typeof form.get !== 'function') return json({ message: 'File is required' }, 400);
    const file = form.get('file');
    const name = form.get('name');
    if (!name) return json({ message: 'Course name is required' }, 400);
    if (!file) return json({ message: 'File is required' }, 400);
    const ext = (file.name || 'file.pdf').split('.').pop().toLowerCase();
    // Keep small files so they can be opened again; large files are stored without a preview.
    const fileUrl = file.size < 1024 * 1024 ? await readFileAsDataUrl(file) : null;
    const flag = form.get('isPublic');
    const course = {
      _id: `c-${rid()}`,
      name: String(name),
      description: String(form.get('description') || ''),
      fileUrl,
      fileName: file.name,
      fileType: ext,
      uploadedBy: me.email,
      uploaderName: me.fullName,
      userId: me.id,
      createdAt: new Date().toISOString(),
      summarized: false,
      isPublic: flag === 'true' || flag === 'on',
    };
    state.courses.push(course);
    saveState(state);
    return json({ message: 'Course uploaded successfully', courseId: course._id, fileType: ext }, 201);
  }
  if (path === '/api/courses/update') {
    const { courseId, isPublic } = readJson(init);
    const course = state.courses.find((c) => c._id === courseId && c.uploadedBy === me.email);
    if (!course) return json({ message: 'Course not found or you do not have permission to modify it' }, 404);
    course.isPublic = Boolean(isPublic);
    saveState(state);
    return json({ message: 'Course updated successfully' });
  }
  if (path === '/api/courses/summarize') {
    const { courseId } = readJson(init);
    const course = state.courses.find((c) => c._id === courseId);
    if (!course) return json({ message: 'Course not found' }, 404);
    if (!course.summary) {
      course.summary = SUMMARY_GENERIC;
      course.summarized = true;
      course.summaryType = 'sample';
      course.detectedLanguage = 'en';
      saveState(state);
    }
    return json({ message: 'Summary generated successfully', summary: course.summary, detectedLanguage: course.detectedLanguage || 'en' });
  }
  if (path === '/api/courses/translate-summary') {
    return json({ message: 'Translation is unavailable in the demo: the free Gemini API key has probably expired.' }, 503);
  }
  if (path === '/api/courses/generate-audio') {
    return json({ message: 'Audio generation is unavailable in the demo: the free ElevenLabs API key has probably expired.' }, 503);
  }
  if (path === '/api/ai/actions') {
    return json({ error: 'The AI assistant is unavailable in the demo: the free Gemini API key has probably expired.' }, 503);
  }
  if (path === '/api/agora/token') {
    return json({ message: 'Video chat is unavailable in the demo (it needs live Agora credentials).' }, 503);
  }

  if (path === '/api/chatrooms') {
    if (method === 'POST') {
      const b = readJson(init);
      if (!b.name) return json({ message: 'Chatroom name is required' }, 400);
      const room = {
        id: rid(),
        name: b.name,
        type: b.type || 'General',
        description: b.description || '',
        isPublic: b.isPublic !== undefined ? b.isPublic : true,
        eventId: b.eventId || null,
        createdBy: me.id,
        createdAt: new Date().toISOString(),
        participants: 1,
        messages: [],
      };
      state.chatrooms.push(room);
      saveState(state);
      return json({ chatroom: { id: room.id, name: room.name, type: room.type, description: room.description, isPublic: room.isPublic, eventId: room.eventId } }, 201);
    }
    return json({
      chatrooms: state.chatrooms.map((r) => {
        const last = r.messages[r.messages.length - 1];
        return {
          id: r.id, name: r.name, type: r.type || 'General',
          lastMessage: last ? last.content : null, lastMessageTime: last ? last.timestamp : null,
          unreadCount: 0, participants: r.participants || 1,
        };
      }),
    });
  }
  m = /^\/api\/chatrooms\/([^/]+)\/messages$/.exec(path);
  if (m) {
    const room = state.chatrooms.find((r) => r.id === m[1]);
    if (!room) return json({ message: 'Chatroom not found' }, 404);
    const currentUser = { id: me.id, name: me.fullName };
    if (method === 'POST') {
      const { content, senderName } = readJson(init);
      if (!content) return json({ message: 'Message content is required' }, 400);
      const message = { _id: `rm-${rid()}`, content, senderId: me.id, senderName: senderName || me.fullName, timestamp: new Date().toISOString() };
      room.messages.push(message);
      saveState(state);
      return json({ message, currentUser }, 201);
    }
    return json({ messages: room.messages, currentUser });
  }
  m = /^\/api\/chatrooms\/([^/]+)$/.exec(path);
  if (m) {
    const room = state.chatrooms.find((r) => r.id === m[1]);
    if (!room) return json({ message: 'Chatroom not found' }, 404);
    return json({
      chatroom: {
        id: room.id, name: room.name, type: room.type, description: room.description, isPublic: room.isPublic,
        participants: room.participants || 1, createdBy: room.createdBy, createdAt: room.createdAt,
      },
    });
  }

  return null;
}

const API_PATTERN = /^(https?:\/\/[^/]+)?\/api\//;
let installed = false;

/** Answers /api/* calls locally (fetch and axios) while demo mode is on. Safe to call repeatedly. */
export function installDemoClient() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    if (isDemoMode()) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (API_PATTERN.test(url)) {
        try {
          const response = await route(url, init);
          if (response) return response;
        } catch (error) {
          console.error('Demo backend error:', error);
          return json({ message: 'Demo backend error' }, 500);
        }
      }
    }
    return realFetch(input, init);
  };

  // axios uses XMLHttpRequest, so it needs its own hook
  const realAdapter = axios.getAdapter(axios.defaults.adapter);
  axios.defaults.adapter = async (config) => {
    const url = axios.getUri(config);
    if (isDemoMode() && API_PATTERN.test(url)) {
      const response = await route(url, {
        method: config.method,
        body: typeof config.data === 'string' ? config.data : config.data ? JSON.stringify(config.data) : undefined,
      });
      if (response) {
        const data = await response.json();
        const result = { data, status: response.status, statusText: '', headers: {}, config, request: {} };
        if (response.status >= 200 && response.status < 300) return result;
        throw new axios.AxiosError(`Request failed with status code ${response.status}`, 'ERR_BAD_REQUEST', config, {}, result);
      }
    }
    return realAdapter(config);
  };
}
