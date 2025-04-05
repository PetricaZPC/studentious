import dynamic from 'next/dynamic'
import { Fragment, useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useAuth } from './api/context/AuthContext'
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
} from 'date-fns'
import AuthGuard from './api/AuthGuard';
import Sidebar from '@/components/layout/Sidebar'

// Import headlessui components dynamically
const Menu = dynamic(() => import('@headlessui/react').then(mod => mod.Menu), { ssr: false })
const Transition = dynamic(() => import('@headlessui/react').then(mod => mod.Transition), { ssr: false })
const DotsVerticalIcon = dynamic(() => import('@heroicons/react/outline').then(mod => mod.DotsVerticalIcon), { ssr: false })
const ChevronLeftIcon = dynamic(() => import('@heroicons/react/solid').then(mod => mod.ChevronLeftIcon), { ssr: false })
const ChevronRightIcon = dynamic(() => import('@heroicons/react/solid').then(mod => mod.ChevronRightIcon), { ssr: false })

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
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
    'bg-teal-500'
  ];
  
  const emailHash = userEmail.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = emailHash % teacherColors.length;
  
  return teacherColors[colorIndex];
};

function Meeting({ meeting }) {
  let startDateTime;
  let endDateTime;

  try {
    startDateTime = parseISO(meeting.startDatetime);
    endDateTime = parseISO(meeting.endDatetime);
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }

  const isTeacher = meeting.creatorRole === 'teacher' || 
                    (meeting.creatorEmail && meeting.creatorEmail.includes('@teacher'));
  
  const userColor = getUserColor(meeting.creatorEmail || 'unknown@email.com', isTeacher);

  return (
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

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 origin-top-right bg-white rounded-md shadow-lg w-36 ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="#"
                    className={classNames(
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                      'block px-4 py-2 text-sm'
                    )}
                  >
                    Edit
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="#"
                    className={classNames(
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                      'block px-4 py-2 text-sm'
                    )}
                  >
                    Cancel
                  </Link>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </li>
  );
}

function CalendarLegend({ teachers }) {
  return (
    <div className="mt-8 bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6">
      <h3 className="text-md font-semibold text-gray-800 mb-3">Event Creator Legend</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {/* Student entry */}
        <div className="flex items-center p-2 rounded-md hover:bg-gray-50 transition">
          <div className="w-4 h-4 bg-gray-400 rounded-full mr-3"></div>
          <div>
            <p className="text-sm font-medium text-gray-700">Students</p>
            <p className="text-xs text-gray-500">All student-created events</p>
          </div>
        </div>
        
        {/* Teacher entries */}
        {teachers && teachers.length > 0 ? (
          teachers.map((teacher, index) => (
            <div key={teacher._id || index} className="flex items-center p-2 rounded-md hover:bg-gray-50 transition">
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

  // Check if user is a teacher
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

  // Create a new event
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

  // Join an event
  const joinEvent = async (eventId, e) => {
    e.preventDefault(); // Prevent the default link behavior
    e.stopPropagation(); // Stop event propagation
    
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

  // Delete an event
  const deleteEvent = async (eventId, e) => {
    if (e) {
      e.preventDefault(); // Prevent the default link behavior
      e.stopPropagation(); // Stop event propagation
    }
    
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

  // Fetch all events
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

  // Fetch all teachers
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

  // Reset form fields
  const resetForm = () => {
    setEventTitle('');
    setEventDescription('');
    setEventTime('');
    setEventLocation('');
    setMaxParticipants(1);
    setEventStartTime('');
    setEventEndTime('');
  };

  // Calendar state variables
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

  // Load data on component mount
  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchTeachers();
      checkTeacherStatus();
    }
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Fetch notifications
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

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Head>
          <span>Calendar | Studentious</span>
          <meta name="description" content="Schedule and manage your events and meetings" />
        </Head>

        <Sidebar />

        <div className="flex-1 pl-0 md:pl-64 pt-16 transition-all duration-300 overflow-y-auto">
          {/* Fixed mobile menu button */}
          <div className="fixed top-4 left-4 z-40 md:hidden">
            <button 
              onClick={() => document.body.classList.toggle('sidebar-open')}
              className="p-2 rounded-full bg-white shadow-md text-indigo-600 hover:bg-indigo-50"
              aria-label="Toggle sidebar"
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            {/* Page header */}
            <div className="relative mb-8 sm:mb-10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-600 rounded-xl opacity-90"></div>
              <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
              <div className="relative px-4 py-8 sm:px-10 sm:py-12 text-center">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
                  Calendar & Events
                </h1>
                <p className="max-w-2xl mx-auto text-purple-100 text-sm sm:text-base">
                  Schedule, manage, and attend events with your peers and teachers
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 via-indigo-500 to-purple-500"></div>
            </div>

            {/* Create event button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowEventModal(true)}
                className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Event
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 01-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        onClick={() => setError('')}
                        className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <span className="sr-only">Dismiss</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar and events grid */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="sm:grid sm:grid-cols-2 sm:divide-x sm:divide-gray-200">
                {/* Calendar column */}
                <div className="px-4 py-6 sm:px-6 sm:py-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="flex-auto text-xl font-semibold text-gray-900">
                      {format(firstDayCurrentMonth, 'MMMM yyyy')}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={previousMonth}
                        className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
                      >
                        <span className="sr-only">Previous month</span>
                        <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={nextMonth}
                        type="button"
                        className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
                      >
                        <span className="sr-only">Next month</span>
                        <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Days of week */}
                  <div className="grid grid-cols-7 text-xs font-medium text-center text-gray-500 border-b border-gray-200 pb-2 mb-2">
                    <div className="py-2">Sun</div>
                    <div className="py-2">Mon</div>
                    <div className="py-2">Tue</div>
                    <div className="py-2">Wed</div>
                    <div className="py-2">Thu</div>
                    <div className="py-2">Fri</div>
                    <div className="py-2">Sat</div>
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-px text-sm">
                    {days.map((day, dayIdx) => {
                      const startCol = dayIdx === 0 ? colStartClasses[getDay(day)] : '';
                      const dayEvents = events.filter(event => 
                        isSameDay(parseISO(event.date), day)
                      );
                      
                      // Get colors for events on this day
                      let dayIndicatorColor = '';
                      if (dayEvents.length > 0) {
                        // If only one event on this day, use its creator's color
                        if (dayEvents.length === 1) {
                          const event = dayEvents[0];
                          const isTeacher = event.creatorRole === 'teacher';
                          dayIndicatorColor = getUserColor(event.creatorEmail || 'unknown@email.com', isTeacher);
                        } 
                        // If all events have the same creator type and color
                        else if (dayEvents.every(event => event.creatorRole === dayEvents[0].creatorRole)) {
                          const isTeacher = dayEvents[0].creatorRole === 'teacher';
                          // If all teachers have the same email (same teacher)
                          if (isTeacher && dayEvents.every(event => event.creatorEmail === dayEvents[0].creatorEmail)) {
                            dayIndicatorColor = getUserColor(dayEvents[0].creatorEmail, true);
                          } 
                          // If all events are from students
                          else if (!isTeacher) {
                            dayIndicatorColor = 'bg-gray-400'; // Student color
                          }
                          // Mixed teachers or can't determine
                          else {
                            dayIndicatorColor = 'bg-purple-500'; // Default - mixed events
                          }
                        }
                        // Multiple different creators
                        else {
                          dayIndicatorColor = 'bg-purple-500'; // Default for mixed creators
                        }
                      }
                      
                      return (
                        <div
                          key={day.toString()}
                          className={classNames(
                            'py-1.5 relative',
                            startCol,
                            !isSameMonth(day, firstDayCurrentMonth) && 'opacity-50'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDay(day);
                              setSelectedDate(day);
                            }}
                            className={classNames(
                              'w-10 h-10 mx-auto flex flex-col items-center justify-center rounded-full transition',
                              isEqual(day, selectedDay) && 'text-white',
                              !isEqual(day, selectedDay) && isToday(day) && 'text-purple-600',
                              !isEqual(day, selectedDay) && !isToday(day) && 
                                isSameMonth(day, firstDayCurrentMonth) && 'text-gray-900 hover:bg-gray-100',
                              !isEqual(day, selectedDay) && !isToday(day) && 
                                !isSameMonth(day, firstDayCurrentMonth) && 'text-gray-400 hover:bg-gray-50',
                              isEqual(day, selectedDay) && isToday(day) && 'bg-purple-600',
                              isEqual(day, selectedDay) && !isToday(day) && 'bg-gray-900',
                              (isEqual(day, selectedDay) || isToday(day)) && 'font-semibold'
                            )}
                          >
                            <time dateTime={format(day, 'yyyy-MM-dd')}>
                              {format(day, 'd')}
                            </time>
                            
                            {/* Event indicators */}
                            {dayEvents.length > 0 && (
                              <>
                                {/* For single creator type */}
                                {dayEvents.length === 1 ? (
                                  <span className={`absolute bottom-0.5 h-1.5 w-1.5 rounded-full ${dayIndicatorColor}`}></span>
                                ) : (
                                  // For multiple events, show indicator with count
                                  <span className="absolute bottom-0.5 flex items-center justify-center">
                                    <span className={`h-1.5 w-1.5 rounded-full ${dayIndicatorColor}`}></span>
                                    <span className="text-[10px] ml-0.5 text-gray-600 font-medium">{dayEvents.length}</span>
                                  </span>
                                )}
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Events column */}
                <div className="px-4 py-6 sm:px-6 sm:py-8 h-[600px] overflow-y-auto">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Events for {format(selectedDay, 'MMMM d, yyyy')}
                  </h2>

                  {/* Event list */}
                  <div className="space-y-4">
                    {events
                      .filter(event => isSameDay(parseISO(event.date), selectedDay))
                      .length === 0 ? (
                      <div className="py-10 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No events for this day</h3>
                        <p className="mt-1 text-sm text-gray-500">Create a new event to see it here.</p>
                        <div className="mt-6">
                          <button
                            onClick={() => setShowEventModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create Event
                          </button>
                        </div>
                      </div>
                    ) : (
                      events
                        .filter(event => isSameDay(parseISO(event.date), selectedDay))
                        .map((event) => {
                          const isTeacher = event.creatorRole === 'teacher';
                          const userColor = getUserColor(event.creatorEmail || 'unknown@email.com', isTeacher);
                          const isCreator = event.creatorId === user?.id;
                          const hasJoined = event.participants?.includes(user?.id);
                          const isFull = event.currentParticipants >= event.maxParticipants;
                          const isPastEvent = new Date(event.date) < new Date();

                          return (
                            <div key={event._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5">
                              <Link 
                                href={`/events/${event._id}`}
                                className="block" 
                              >
                                <div className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-start space-x-4">
                                      <div className={`w-2 h-10 ${userColor} rounded-sm flex-shrink-0 mt-1`}></div>
                                      <div>
                                        <h3 className="font-medium text-gray-900">{event.title}</h3>
                                        {event.description && (
                                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{event.description}</p>
                                        )}
                                        
                                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                          <span className="flex items-center">
                                            <svg className="mr-1 h-3.5 w-3.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {event.time}
                                          </span>
                                          
                                          <span className="flex items-center">
                                            <svg className="mr-1 h-3.5 w-3.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {event.location}
                                          </span>
                                          
                                          <span className="flex items-center">
                                            <svg className="mr-1 h-3.5 w-3.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            {event.creatorEmail || 'Unknown creator'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      isPastEvent ? 'bg-gray-100 text-gray-600' :
                                      isFull ? 'bg-red-100 text-red-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {isPastEvent ? 'Past' :
                                       isFull ? 'Full' : 
                                       `${event.maxParticipants - event.currentParticipants} left`}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
                                  {/* Status indicators */}
                                  {hasJoined && (
                                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                      Attending
                                    </span>
                                  )}
                                  
                                  {/* Action buttons */}
                                  <div className="flex space-x-2 ml-auto">
                                    {/* Creator actions */}
                                    {isCreator && (
                                      <button
                                        onClick={(e) => {
                                          if (window.confirm('Are you sure you want to delete this event? This cannot be undone.')) {
                                            deleteEvent(event._id, e);
                                          }
                                        }}
                                        className="text-xs px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                        disabled={isPastEvent}
                                      >
                                        Delete
                                      </button>
                                    )}

                                    {/* Non-creator actions */}
                                    {!isCreator && !hasJoined && !isPastEvent && (
                                      <button
                                        onClick={(e) => joinEvent(event._id, e)}
                                        className="text-xs px-2 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                                        disabled={isFull}
                                      >
                                        {isFull ? 'Full' : 'Join'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Event creator legend */}
            <CalendarLegend teachers={teachers} />
          </main>
        </div>
      </div>

      {/* Create event modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-white">Create New Event</h3>
                <p className="mt-1 text-sm text-purple-200">Fill in the details to create your event</p>
              </div>
              
              <form onSubmit={createEvent}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        id="eventTitle"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        id="eventDescription"
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        className="mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        rows="3"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                          type="date"
                          id="eventDate"
                          value={format(selectedDate, 'yyyy-MM-dd')}
                          onChange={(e) => setSelectedDate(new Date(e.target.value))}
                          className="mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-700">Location</label>
                        <input
                          type="text"
                          id="eventLocation"
                          value={eventLocation}
                          onChange={(e) => setEventLocation(e.target.value)}
                          className="mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="eventStartTime" className="block text-sm font-medium text-gray-700">Start Time</label>
                        <input
                          type="time"
                          id="eventStartTime"
                          value={eventTime}
                          onChange={(e) => {
                            setEventTime(e.target.value);
                            setEventStartTime(format(selectedDate, 'yyyy-MM-dd') + 'T' + e.target.value);
                          }}
                          className="mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="eventEndTime" className="block text-sm font-medium text-gray-700">End Time</label>
                        <input 
                          type="time"
                          id="eventEndTime"
                          value={eventEndTime}
                          onChange={(e) => {
                            setEventEndTime(e.target.value);
                          }}
                          className="mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>
                      
                    <div>
                      <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">Max Participants</label>
                      <input
                        type="number"
                        id="maxParticipants"
                        min="1"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                        className="mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    {/* Show teacher info message instead of checkbox/password */}
                    {isUserTeacher && (
                      <div className="rounded-md bg-blue-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              You are creating this event as a teacher. Your events will be color-coded accordingly.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Event'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
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