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

const Menu = dynamic(
  () => import('@headlessui/react').then(mod => mod.Menu),
  { ssr: false }
)

const Transition = dynamic(
  () => import('@headlessui/react').then(mod => mod.Transition),
  { ssr: false }
)
const DotsVerticalIcon = dynamic(
  () => import('@heroicons/react/outline').then(mod => mod.DotsVerticalIcon),
  { ssr: false }
)

const ChevronLeftIcon = dynamic(
  () => import('@heroicons/react/solid').then(mod => mod.ChevronLeftIcon),
  { ssr: false }
)

const ChevronRightIcon = dynamic(
  () => import('@heroicons/react/solid').then(mod => mod.ChevronRightIcon),
  { ssr: false }
)

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
        console.log("Joining event with ID:", eventId); // Debugging: Log the event ID
        const response = await fetch(`/api/events/join/${eventId}`, {
          method: 'POST',
          credentials: 'include', // Ensure cookies are sent with the request
        });
    
        if (!response.ok) {
          const errorData = await response.json(); // Parse the error message from the backend
          throw new Error(errorData.message || 'Failed to join event');
        }
    
        console.log("Successfully joined event"); // Debugging: Log success
        fetchEvents(); // Refresh the events list
      } catch (err) {
        setError('Failed to join event: ' + err.message);
        console.error("Error in joinEvent:", err); // Debugging: Log the error
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
                        </div>
                        
                        {/* Show teacher info message instead of checkbox/password */}
                        {isUserTeacher && (
                          <div className="rounded-md bg-blue-50 p-3">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3 flex-1 md:flex md:justify-between">
                                <p className="text-sm text-blue-700">
                                  You are creating this event as a teacher. Your events will be color-coded accordingly.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
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

              <div className="flex items-center">
                <h2 className="flex-auto font-semibold text-gray-900">
                  {format(firstDayCurrentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  type="button"
                  onClick={previousMonth}
                  className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Previous month</span>
                  <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
                </button>
                <button
                  onClick={nextMonth}
                  type="button"
                  className="-my-1.5 -mr-1.5 ml-2 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Next month</span>
                  <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-7 mt-10 text-xs leading-6 text-center text-gray-500">
                <div>S</div>
                <div>M</div>
                <div>T</div>
                <div>W</div>
                <div>T</div>
                <div>F</div>
                <div>S</div>
              </div>
              <div className="grid grid-cols-7 mt-2 text-sm">
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
                        'py-1.5',
                        startCol
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDay(day);
                          setSelectedDate(day);
                        }}
                        className={classNames(
                          'relative mx-auto flex h-8 w-8 items-center justify-center rounded-full',
                          isEqual(day, selectedDay) && 'text-white',
                          !isEqual(day, selectedDay) && isToday(day) && 'text-purple-500',
                          !isEqual(day, selectedDay) && !isToday(day) && 
                            isSameMonth(day, firstDayCurrentMonth) && 'text-gray-900',
                          !isEqual(day, selectedDay) && !isToday(day) && 
                            !isSameMonth(day, firstDayCurrentMonth) && 'text-gray-400',
                          isEqual(day, selectedDay) && isToday(day) && 'bg-purple-500',
                          isEqual(day, selectedDay) && !isToday(day) && 'bg-gray-900',
                          !isEqual(day, selectedDay) && 'hover:bg-gray-200',
                          (isEqual(day, selectedDay) || isToday(day)) && 'font-semibold'
                        )}
                      >
                        <time dateTime={format(day, 'yyyy-MM-dd')}>
                          {format(day, 'd')}
                        </time>
                        
                        {/* Render colored indicator based on event creator type */}
                        {dayEvents.length > 0 && (
                          <>
                            {/* For single creator type */}
                            {dayEvents.length === 1 ? (
                              <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${dayIndicatorColor}`}></span>
                            ) : (
                              // For multiple events, show small pie segments
                              <div className="absolute bottom-0 right-0 w-3 h-3 flex flex-wrap overflow-hidden rounded-full border border-white">
                                {dayEvents.slice(0, 4).map((event, i) => {
                                  const isTeacher = event.creatorRole === 'teacher';
                                  const color = getUserColor(event.creatorEmail || 'unknown@email.com', isTeacher);
                                  return (
                                    <div 
                                      key={i} 
                                      className={`w-1.5 h-1.5 ${color}`}
                                    ></div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </button>
                    </div>
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
                    const hasJoined = event.participants?.includes(user?.id);
                    const isFull = event.currentParticipants >= event.maxParticipants;
                    const isPastEvent = new Date(event.date) < new Date();

                    return (

                      <a 
                        className='block bg-white rounded'
                        href={hasJoined  && `/events/${event._id}`}
                        >
                      <li key={event._id} className="flex items-center px-4 py-2 space-x-4 group rounded-xl focus-within:bg-gray-100 hover:bg-gray-100">
                        <div className={`w-3 h-3 ${userColor} rounded-full flex-shrink-0`}></div>
                        
                        <div className="flex-auto">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-gray-900 font-medium">{event.title}</p>
                              <p className="mt-0.5 text-gray-600">{event.description}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              isPastEvent ? 'bg-gray-100 text-gray-600' :
                              isFull ? 'bg-red-100 text-red-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {isPastEvent ? 'Past Event' :
                               isFull ? 'Full' : 
                               `${event.maxParticipants - event.currentParticipants} spots left`}
                            </span>
                          </div>
                          
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            <span className="flex items-center text-gray-600">
                              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {event.time}
                            </span>
                            
                            <span className="flex items-center text-gray-600">
                              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {event.location}
                            </span>
                            
                            <span className="flex items-center text-gray-600">
                              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Created by {event.creatorEmail || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          {/* Status indicators */}
                          {hasJoined && (
                            <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md text-center">
                              Attending
                            </span>
                          )}

                          {/* Action buttons */}
                          <div className="flex space-x-2">
                            {/* Creator actions */}
                            {isCreator && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this event? This cannot be undone.')) {
                                    deleteEvent(event._id);
                                  }
                                }}
                                className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                disabled={isPastEvent}
                              >
                                Delete Event
                              </button>
                            )}

                            {/* Non-creator actions */}
                            {!isCreator && !hasJoined && !isPastEvent && (
                              <button
                                onClick={() => joinEvent(event._id)}
                                className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                                disabled={isFull}
                              >
                                {isFull ? 'Event Full' : 'Join Event'}
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                      </a>
                     
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