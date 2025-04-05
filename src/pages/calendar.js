<<<<<<< HEAD
import dynamic from 'next/dynamic';
import { Fragment, useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from './api/context/AuthContext';
import axios from 'axios';
=======
import dynamic from 'next/dynamic'
import { Fragment, useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useAuth } from './api/context/AuthContext'
>>>>>>> 76595eba2e98dd351a9d9f40e72f9ae4bb6dfaaf
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
<<<<<<< HEAD
    <AuthGuard>
      <Sidebar />
      <Head>
        <title>Calendar | Studentious</title>
        <meta name="description" content="Schedule and manage your meetings" />
      </Head>
=======
    <li className="flex items-center px-4 py-2 space-x-4 group rounded-xl focus-within:bg-gray-100 hover:bg-gray-100">
      <div className={`w-3 h-3 ${userColor} rounded-full flex-shrink-0`}></div>
      
      <div className="relative w-10 h-10">
        <Image
          src={meeting.imageUrl || '/default-avatar.png'}
          alt={`${meeting.name}'s avatar`}
          fill
          className="rounded-full object-cover"
        />
      </div>
      <div className="flex-auto">
        <p className="text-gray-900">{meeting.name}</p>
        <div className="flex justify-between">
          <p className="mt-0.5">
            <time dateTime={meeting.startDatetime}>
              {format(startDateTime, 'h:mm a')}
            </time>{' '}
            -{' '}
            <time dateTime={meeting.endDatetime}>
              {format(endDateTime, 'h:mm a')}
            </time>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {meeting.creatorEmail || 'Unknown creator'}
          </p>
        </div>
      </div>
      <Menu
        as="div"
        className="relative opacity-0 focus-within:opacity-100 group-hover:opacity-100"
      >
        <div>
          <Menu.Button className="-m-2 flex items-center rounded-full p-1.5 text-gray-500 hover:text-gray-600">
            <span className="sr-only">Open options</span>
            <DotsVerticalIcon className="w-6 h-6" aria-hidden="true" />
          </Menu.Button>
        </div>
>>>>>>> 76595eba2e98dd351a9d9f40e72f9ae4bb6dfaaf

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

<<<<<<< HEAD
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
=======
function CalendarLegend({ teachers }) {
  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <h3 className="text-md font-semibold text-gray-800 mb-3">Event Creator Legend</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {/* Student entry */}
        <div className="flex items-center p-2 rounded-md hover:bg-gray-50">
          <div className="w-4 h-4 bg-gray-400 rounded-full mr-3"></div>
          <div>
            <p className="text-sm font-medium text-gray-700">Students</p>
            <p className="text-xs text-gray-500">All student-created events</p>
          </div>
        </div>
        
        {/* Teacher entries */}
        {teachers && teachers.length > 0 ? (
          teachers.map((teacher, index) => (
            <div key={teacher._id || index} className="flex items-center p-2 rounded-md hover:bg-gray-50">
              <div 
                className={`w-4 h-4 ${getUserColor(teacher.email, true)} rounded-full mr-3`}
              ></div>
              <div>
                <p className="text-sm font-medium text-gray-700">{teacher.fullName || teacher.email}</p>
                <p className="text-xs text-gray-500 truncate" title={teacher.email}>
                  {teacher.email}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center p-2">
            <p className="text-sm text-gray-500 italic">No teachers found</p>
          </div>
        )}
      </div>
      
      {/* Help text */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Event colors indicate who created the event. Students' events are shown in gray, 
          while teachers have unique colors to easily identify their events.
        </p>
      </div>
    </div>
  );
}

export default function CalendarPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [teachers, setTeachers] = useState([]);
    const [isUserTeacher, setIsUserTeacher] = useState(false);
  
    const [eventTitle, setEventTitle] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    const [eventStartTime, setEventStartTime] = useState('');
    const [eventEndTime, setEventEndTime] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [maxParticipants, setMaxParticipants] = useState(1);
  
    const checkTeacherStatus = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/users/check-teacher', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsUserTeacher(data.isTeacher);
        }
      } catch (error) {
        console.error('Error checking teacher status:', error);
        setIsUserTeacher(false);
      }
    };

    const createEvent = async (e) => {
      e.preventDefault();
      setLoading(true);
      
      try {
        const response = await fetch('/api/events/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: eventTitle,
            description: eventDescription,
            date: format(selectedDate, 'yyyy-MM-dd'),
            time: eventTime,
            location: eventLocation,
            maxParticipants: maxParticipants,
            startTime: format(selectedDate, 'yyyy-MM-dd') + 'T' + eventTime,
            endTime: format(selectedDate, 'yyyy-MM-dd') + 'T' + eventEndTime,
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to create event');
        }
        
        setShowEventModal(false);
        fetchEvents();
        resetForm();
      } catch (err) {
        setError('Failed to create event: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  
    const joinEvent = async (eventId) => {
      try {
        const response = await fetch(`/api/events/join/${eventId}`, {
          method: 'POST',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to join event');
        }
        
        fetchEvents();
      } catch (err) {
        setError('Failed to join event: ' + err.message);
        console.error(err);
      }
    };

    const deleteEvent = async (eventId) => {
      try {
        const response = await fetch(`/api/events/delete/${eventId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete event');
        }
        
        fetchEvents();
        alert('Event deleted successfully');
      } catch (err) {
        setError('Failed to delete event: ' + err.message);
        console.error(err);
      }
    };
  
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events/list', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data.events);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events: ' + err.message);
      }
    };

    const fetchTeachers = async () => {
      try {
        const response = await fetch('/api/users/teachers', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch teachers');
        }
        
        const data = await response.json();
        setTeachers(data.teachers);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setError('Failed to load teachers: ' + error.message);
      }
    };
  
    useEffect(() => {
      if (user) {
        fetchEvents();
        fetchTeachers();
        checkTeacherStatus();
      }
    }, [user]);
  
    const resetForm = () => {
      setEventTitle('');
      setEventDescription('');
      setEventTime('');
      setEventLocation('');
      setMaxParticipants(1);
      setEventStartTime('');
      setEventEndTime('');
    };

    useEffect(() => {
      if (!user) {
        router.push('/login');
      }
    }, [user, router]);

    const [notifications, setNotifications] = useState([]);
    
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/notifications/unread', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        const data = await response.json();
        setNotifications(data.notifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    
    useEffect(() => {
      if (user) {
        fetchNotifications();
      }
    }, [user]);

    let today = startOfToday()
    let [selectedDay, setSelectedDay] = useState(today)
    let [currentMonth, setCurrentMonth] = useState(format(today, 'MMM-yyyy'))
    let firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date())
  
    let days = eachDayOfInterval({
      start: firstDayCurrentMonth,
      end: endOfMonth(firstDayCurrentMonth),
    })
  
    function previousMonth() {
      let firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
      setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'))
    }
  
    function nextMonth() {
      let firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
      setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'))
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
                <h2 className="flex-auto font-semibold text-gray-900">
                 
                </h2>
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
                          <label className="block text-sm font-medium text-gray-700">Start Time</label>
                          <input
                            type="time"
                            value={eventTime}
                            onChange={(e) => {
                              setEventTime(e.target.value);
                              setEventStartTime(format(selectedDate, 'yyyy-MM-dd') + 'T' + e.target.value);
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">End Time</label>
                          <input 
                            type="time"
                            value={eventEndTime}
                            onChange={(e) => {
                              setEventEndTime(e.target.value);
                            }}
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
>>>>>>> 76595eba2e98dd351a9d9f40e72f9ae4bb6dfaaf
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
<<<<<<< HEAD
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
=======
                  );
                })}
              </div>
            </div>
            <section className="mt-12 md:mt-0 md:pl-14">
              <h2 className="font-semibold text-gray-900">
                Events for{' '}
                <time dateTime={format(selectedDay, 'yyyy-MM-dd')}>
                  {format(selectedDay, 'MMM dd, yyyy')}
                </time>
              </h2>
              <ol className="mt-4 space-y-1 text-sm leading-6 text-gray-500">
                {events
                  .filter(event => isSameDay(parseISO(event.date), selectedDay))
                  .map((event) => {
                    const isTeacher = event.creatorRole === 'teacher';
                    const userColor = getUserColor(event.creatorEmail || 'unknown@email.com', isTeacher);
                    const isCreator = event.creatorId === user?.id;
                    const hasJoined = event.participants && event.participants.includes(user?.id);
                    const isFull = event.currentParticipants >= event.maxParticipants;

                    return (
                      <li key={event._id} className="flex items-center px-4 py-2 space-x-4 group rounded-xl focus-within:bg-gray-100 hover:bg-gray-100">
                        <div className={`w-3 h-3 ${userColor} rounded-full flex-shrink-0`}></div>
                        
>>>>>>> 76595eba2e98dd351a9d9f40e72f9ae4bb6dfaaf
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
                              onClick={() => joinEvent(event._id)}
                              className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                            >
                              Join
                            </button>
                          )}
                          {event.creatorId === user.id && (
                            <button
<<<<<<< HEAD
                              onClick={() => deleteEvent(event.id)}
=======
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                                  deleteEvent(event._id);
                                }
                              }}
>>>>>>> 76595eba2e98dd351a9d9f40e72f9ae4bb6dfaaf
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </li>
<<<<<<< HEAD
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
=======
                    );
                  })}
              </ol>
            </section>
          </div>
          
          <CalendarLegend teachers={teachers} />
        </div>
      </main>
    </div>
  </AuthGuard>
)
}
        
const colStartClasses = [
  '',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
]
>>>>>>> 76595eba2e98dd351a9d9f40e72f9ae4bb6dfaaf
