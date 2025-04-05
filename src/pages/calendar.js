import dynamic from 'next/dynamic';
import { Fragment, useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from './api/context/AuthContext';
import axios from 'axios';
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  parseISO,
  startOfToday,
} from 'date-fns';
import AuthGuard from './api/AuthGuard';z
import Sidebar from '@/components/layout/Sidebar';

const Menu = dynamic(() => import('@headlessui/react').then((mod) => mod.Menu), { ssr: false });
const Transition = dynamic(() => import('@headlessui/react').then((mod) => mod.Transition), { ssr: false });
const DotsVerticalIcon = dynamic(() => import('@heroicons/react/outline').then((mod) => mod.DotsVerticalIcon), { ssr: false });
const ChevronLeftIcon = dynamic(() => import('@heroicons/react/solid').then((mod) => mod.ChevronLeftIcon), { ssr: false });
const ChevronRightIcon = dynamic(() => import('@heroicons/react/solid').then((mod) => mod.ChevronRightIcon), { ssr: false });

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const getUserColor = (userEmail, isTeacher) => {
  if (!isTeacher) return 'bg-gray-400';

  const teacherColors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  const emailHash = userEmail.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = emailHash % teacherColors.length;

  return teacherColors[colorIndex];
};

export default function CalendarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isUserTeacher, setIsUserTeacher] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/events');
      setEvents(response.data);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('/api/teachers');
      setTeachers(response.data);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const checkTeacherStatus = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/users/${user.id}`);
      setIsUserTeacher(response.data.role === 'teacher');
    } catch (err) {
      console.error('Error checking teacher status:', err);
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const eventData = {
        title: eventTitle,
        description: eventDescription,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: eventTime,
        location: eventLocation,
        maxParticipants,
        creatorId: user.id,
        creatorName: user.displayName || 'Anonymous',
        creatorEmail: user.email || 'unknown@email.com',
        creatorRole: isUserTeacher ? 'teacher' : 'student',
      };
      await axios.post('/api/events', eventData);
      setShowEventModal(false);
      fetchEvents();
    } catch (err) {
      setError('Failed to create event');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const joinEvent = async (eventId) => {
    try {
      await axios.post(`/api/events/${eventId}/join`, { userId: user.id });
      fetchEvents();
    } catch (err) {
      setError('Failed to join event');
      console.error(err);
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      await axios.delete(`/api/events/${eventId}`);
      fetchEvents();
    } catch (err) {
      setError('Failed to delete event');
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchTeachers();
      checkTeacherStatus();
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  let today = startOfToday();
  let [selectedDay, setSelectedDay] = useState(today);
  let [currentMonth, setCurrentMonth] = useState(format(today, 'MMM-yyyy'));
  let firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date());

  let days = eachDayOfInterval({
    start: firstDayCurrentMonth,
    end: endOfMonth(firstDayCurrentMonth),
  });

  function previousMonth() {
    let firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'));
  }

  function nextMonth() {
    let firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'));
  }

  return (
    <AuthGuard>
      <Sidebar />
      <Head>
        <title>Calendar | Studentious</title>
        <meta name="description" content="Schedule and manage your meetings" />
      </Head>

      <div className="min-h-screen bg-gray-100">
        <main className="pt-16">
          <div className="max-w-md px-4 mx-auto sm:px-7 md:max-w-4xl md:px-6">
            <div className="md:grid md:grid-cols-2 md:divide-x md:divide-gray-200">
              <div className="md:pr-14">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex-auto font-semibold text-gray-900">{format(firstDayCurrentMonth, 'MMMM yyyy')}</h2>
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Create Event
                  </button>
                </div>

                {showEventModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                      <h3 className="text-lg font-semibold mb-4">Create New Event</h3>
                      <form onSubmit={createEvent}>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                              type="text"
                              value={eventTitle}
                              onChange={(e) => setEventTitle(e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                              value={eventDescription}
                              onChange={(e) => setEventDescription(e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                              rows="3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                              type="date"
                              value={format(selectedDate, 'yyyy-MM-dd')}
                              onChange={(e) => setSelectedDate(new Date(e.target.value))}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Time</label>
                            <input
                              type="time"
                              value={eventTime}
                              onChange={(e) => setEventTime(e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <input
                              type="text"
                              value={eventLocation}
                              onChange={(e) => setEventLocation(e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Max Participants</label>
                            <input
                              type="number"
                              min="1"
                              value={maxParticipants}
                              onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                              required
                            />
                          </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowEventModal(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                          >
                            {loading ? 'Creating...' : 'Create Event'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Calendar rendering logic */}
                {/* ... */}
              </div>
              <section className="mt-12 md:mt-0 md:pl-14">
                <h2 className="font-semibold text-gray-900">
                  Events for{' '}
                  <time dateTime={format(selectedDay, 'yyyy-MM-dd')}>{format(selectedDay, 'MMM dd, yyyy')}</time>
                </h2>
                <ol className="mt-4 space-y-1 text-sm leading-6 text-gray-500">
                  {events
                    .filter((event) => isSameDay(parseISO(event.date), selectedDay))
                    .map((event) => (
                      <li key={event.id} className="flex items-center px-4 py-2 space-x-4 group rounded-xl focus-within:bg-gray-100 hover:bg-gray-100">
                        <div className={`w-3 h-3 ${getUserColor(event.creatorEmail, event.creatorRole === 'teacher')} rounded-full flex-shrink-0`}></div>
                        <div className="flex-auto">
                          <p className="text-gray-900 font-medium">{event.title}</p>
                          <p className="mt-0.5">{event.description}</p>
                          <div className="flex justify-between mt-1">
                            <p className="text-purple-600">
                              Time: {event.time} • {event.currentParticipants}/{event.maxParticipants} participants
                            </p>
                            <p className="text-xs text-gray-500">Created by: {event.creatorEmail || 'Unknown'}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!event.participants.includes(user.id) && (
                            <button
                              onClick={() => joinEvent(event.id)}
                              className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                            >
                              Join
                            </button>
                          )}
                          {event.creatorId === user.id && (
                            <button
                              onClick={() => deleteEvent(event.id)}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                </ol>
              </section>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}