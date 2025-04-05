import dynamic from 'next/dynamic'
import { Fragment, useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useRouter } from 'next/router'
import { useAuth } from './api/context/AuthContext'
import { db } from './api/config/firebaseConfig'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  updateDoc, 
  arrayUnion,
  doc,
  increment 
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
  
  export default function CalendarPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
  
    // Add Event Modal Form State
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [maxParticipants, setMaxParticipants] = useState(1);
  
    const createEvent = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        // Create the event
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
          createdAt: serverTimestamp()
        });
    
        // Create notifications for all users
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        
        const notificationPromises = usersSnapshot.docs
          .filter(doc => doc.id !== user.uid) // Don't notify the creator
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
                time: eventTime
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
  
    useEffect(() => {
      if (user) {
        fetchEvents();
      }
    }, [user]);
  
    const resetForm = () => {
      setEventTitle('');
      setEventDescription('');
      setEventTime('');
      setMaxParticipants(1);
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

    // Add notification handling
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
    
    // Add this to your useEffect
    useEffect(() => {
      if (user) {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
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
  <Header />
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
                  {format(firstDayCurrentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => setShowEventModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Create Event
                </button>
              </div>

              {/* Event Creation Modal */}
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
                        {dayEvents.length > 0 && (
                          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-purple-500"></span>
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
                {events.filter(event => isSameDay(parseISO(event.date), selectedDay)).length > 0 ? (
                  events
                    .filter(event => isSameDay(parseISO(event.date), selectedDay))
                    .map((event) => (
                      <li key={event.id} className="flex items-center px-4 py-2 space-x-4 group rounded-xl focus-within:bg-gray-100 hover:bg-gray-100">
                        <div className="flex-auto">
                          <p className="text-gray-900 font-medium">{event.title}</p>
                          <p className="mt-0.5">{event.description}</p>
                          <p className="mt-0.5 text-purple-600">
                            Time: {event.time} • {event.currentParticipants}/{event.maxParticipants} participants
                          </p>
                        </div>
                        {event.creatorId !== user?.uid && !event.participants.includes(user?.uid) && (
                          <button
                            onClick={() => joinEvent(event.id)}
                            className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                          >
                            Join
                          </button>
                        )}
                      </li>
                    ))
                ) : (
                  <p>No events scheduled for today.</p>
                )}
              </ol>
            </section>
          </div>
        </div>
      </main>
    </div>
    <Footer />
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