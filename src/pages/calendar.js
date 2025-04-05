import dynamic from 'next/dynamic'
import { Fragment, useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useAuth } from './api/context/AuthContext'
import { db } from './api/config/firebaseConfig'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  serverTimestamp, 
  updateDoc, 
  arrayUnion,
  doc,
  increment,
  deleteDoc
} from 'firebase/firestore'
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
          src={meeting.imageUrl}
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
            <div key={teacher.id || index} className="flex items-center p-2 rounded-md hover:bg-gray-50">
              <div 
                className={`w-4 h-4 ${getUserColor(teacher.email, true)} rounded-full mr-3`}
              ></div>
              <div>
                <p className="text-sm font-medium text-gray-700">{teacher.name}</p>
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
    
    const [eventDescription, setEventDescription] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [maxParticipants, setMaxParticipants] = useState(1);
    const [isTeacherMode, setIsTeacherMode] = useState(false);
    const [teacherPassword, setTeacherPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
  
    const checkTeacherStatus = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'teacher') {
          setIsUserTeacher(true);
        } else {
          setIsUserTeacher(false);
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
        // Determine if this is a teacher event
        let userRole = isUserTeacher ? 'teacher' : 'student';

        const eventRef = await addDoc(collection(db, 'events'), {
          title: eventTitle,
          description: eventDescription,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: eventTime,
          maxParticipants: maxParticipants,
          currentParticipants: 1,
          participants: [user.uid],
          creatorId: user.uid,
          creatorName: user.displayName || 'Anonymous',
          creatorEmail: user.email || 'unknown@email.com',
          creatorRole: userRole, // Use the determined role
          createdAt: serverTimestamp(),
          startTime: format(selectedDate, 'yyyy-MM-dd') + 'T' + eventTime,
          endTime: format(selectedDate, 'yyyy-MM-dd') + 'T' + eventTime,
        });
        
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        
        const notificationPromises = usersSnapshot.docs
          .filter(doc => doc.id !== user.uid)
          .map(doc => {
            return addDoc(collection(db, 'notifications'), {
              userId: doc.id,
              eventId: eventRef.id,
              type: 'newEvent',
              title: `New Event: ${eventTitle}`,
              message: `${user.displayName || 'Someone'} created a new event: ${eventTitle}`,
              creatorName: user.displayName || 'Anonymous',
              eventDetails: {
                title: eventTitle,
                description: eventDescription,
                date: format(selectedDate, 'yyyy-MM-dd'),
                time: eventTime,
                startTime: format(selectedDate, 'yyyy-MM-dd') + 'T' + eventTime,
                endTime: format(selectedDate, 'yyyy-MM-dd') + 'T' + eventTime,
              },
              read: false,
              createdAt: serverTimestamp()
            });
          });
    
        await Promise.all(notificationPromises);
        setShowEventModal(false);
        fetchEvents();
        resetForm();
      } catch (err) {
        setError('Failed to create event');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  
    const joinEvent = async (eventId) => {
      try {
        const eventRef = doc(db, 'events', eventId);
        await updateDoc(eventRef, {
          participants: arrayUnion(user.uid),
          currentParticipants: increment(1)
        });
        fetchEvents();
      } catch (err) {
        setError('Failed to join event');
        console.error(err);
      }
    };

    const deleteEvent = async (eventId) => {
      try {
        // Get the event to verify creator
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) {
          setError('Event not found');
          return;
        }
        
        const eventData = eventSnap.data();
        
        // Verify the current user is the creator
        if (eventData.creatorId !== user.uid) {
          setError('Only the event creator can delete this event');
          return;
        }
        
        // Delete the event
        await deleteDoc(eventRef);
        
        // Also delete related notifications
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('eventId', '==', eventId)
        );
        
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const deletePromises = notificationsSnapshot.docs.map((doc) => {
          return deleteDoc(doc.ref);
        });
        
        await Promise.all(deletePromises);
        
        // Refresh the events list
        fetchEvents();
        
        // Show success message
        alert('Event deleted successfully');
      } catch (err) {
        setError('Failed to delete event');
        console.error(err);
      }
    };
  
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'events'));
        const querySnapshot = await getDocs(q);
        const eventsList = [];
        querySnapshot.forEach((doc) => {
          eventsList.push({ id: doc.id, ...doc.data() });
        });
        setEvents(eventsList);
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };

    const fetchTeachers = async () => {
      try {
        const teachersQuery = query(
          collection(db, 'users'), 
          where('role', '==', 'teacher')
        );
        
        const snapshot = await getDocs(teachersQuery);
        const teachersList = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          teachersList.push({
            id: doc.id,
            email: data.email,
            name: data.fullName || data.displayName || data.email
          });
        });
        
        console.log('Teachers found:', teachersList.length);
        setTeachers(teachersList);
      } catch (error) {
        console.error('Error fetching teachers:', error);
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
      setMaxParticipants(1);
      setIsTeacherMode(isUserTeacher);
      setTeacherPassword('');
      setPasswordError('');
      setEventStartTime(format(new Date(), 'yyyy-MM-dd, HH:mm'));
      setEventEndTime(format(new Date(), 'yyyy-MM-dd, HH:mm'));
    };

    useEffect(() => {
      if (!user) {
        router.push('/login');
      }
    }, [user, router]);
  
    const addMeeting = async (meetingData) => {
      try {
        await addDoc(collection(db, 'meetings'), {
          ...meetingData,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error adding meeting:', error);
      }
    };
  
    const fetchMeetings = async () => {
      try {
        const q = query(
          collection(db, 'meetings'), 
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const meetings = [];
        querySnapshot.forEach((doc) => {
          meetings.push({ id: doc.id, ...doc.data() });
        });
        return meetings;
      } catch (error) {
        console.error('Error fetching meetings:', error);
        return [];
      }
    };

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          where('read', '==', false)
        );
        
        const querySnapshot = await getDocs(q);
        const notificationsList = [];
        querySnapshot.forEach((doc) => {
          notificationsList.push({ id: doc.id, ...doc.data() });
        });
        setNotifications(notificationsList);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    
   

    const makeUserTeacher = async (userId) => {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          role: 'teacher'
        });
        alert('User is now a teacher');
      } catch (error) {
        console.error('Error updating user role:', error);
      }
    };


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
                        {/* Regular form fields remain the same */}
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
                            onChange={(e) => {setEventTime(e.target.value)
                                setEventStartTime(format(selectedDate, 'yyyy-MM-dd') + 'T' + e.target.value)
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
                              ></input>
                          </div>
                        <div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">End time</label>
                            <input 
                              type="time"
                              value={eventEndTime}
                              onChange={(e) => {setEventEndTime(e.target.value)
                                  setEventEndTime(format(selectedDate, 'yyyy-MM-dd') + 'T' + e.target.value)
                              }}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                              required
                            />
                          </div>
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
                    const isCreator = event.creatorId === user?.uid;
                    const hasJoined = event.participants.includes(user?.uid);
                    const isFull = event.currentParticipants >= event.maxParticipants;

                    return (
                      <a 
                        href={`/events/${event.id}`}
                        className='block bg-white rounded-lg shadow-sm hover:shadow-md transition'
                        >
                        <li key={event.id} className="flex items-center px-4 py-2 space-x-4 group rounded-xl focus-within:bg-gray-100 hover:bg-gray-100">
                        <div className={`w-3 h-3 ${userColor} rounded-full flex-shrink-0`}></div>
                        
                        <div className="flex-auto">
                          <p className="text-gray-900 font-medium">{event.title}</p>
                          <p className="mt-0.5">{event.description}</p>
                          <div className="flex justify-between mt-1">
                            <p className="text-purple-600">
                              Time: {event.time} • {event.currentParticipants}/{event.maxParticipants} participants
                            </p>
                            <p className="text-xs text-gray-500">
                              Created by: {event.creatorEmail || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {/* Join button - only show if not creator, not joined, and not full */}
                          {!isCreator && !hasJoined && !isFull && (
                            <button
                              onClick={() => joinEvent(event.id)}
                              className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                            >
                              Join
                            </button>
                          )}
                          
                          {/* Delete button - only show for creator */}
                          {isCreator && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                                  deleteEvent(event.id);
                                }
                              }}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                              Delete
                            </button>
                          )}
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