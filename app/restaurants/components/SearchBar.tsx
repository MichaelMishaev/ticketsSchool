'use client'

import { useState } from 'react'
import { Calendar, Clock, Users, MapPin } from 'lucide-react'

export default function SearchBar() {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [partySize, setPartySize] = useState('2')
  const [location, setLocation] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
    console.log({ date, time, partySize, location })
  }

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date */}
            <div className="relative">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                תאריך
              </label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Time */}
            <div className="relative">
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                שעה
              </label>
              <div className="relative">
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-gray-900 bg-white"
                >
                  <option value="">בחר שעה</option>
                  <option value="18:00">18:00</option>
                  <option value="18:30">18:30</option>
                  <option value="19:00">19:00</option>
                  <option value="19:30">19:30</option>
                  <option value="20:00">20:00</option>
                  <option value="20:30">20:30</option>
                  <option value="21:00">21:00</option>
                  <option value="21:30">21:30</option>
                  <option value="22:00">22:00</option>
                </select>
              </div>
            </div>

            {/* Party Size */}
            <div className="relative">
              <label htmlFor="party-size" className="block text-sm font-medium text-gray-700 mb-2">
                מספר סועדים
              </label>
              <div className="relative">
                <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  id="party-size"
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-gray-900 bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'אדם' : 'אנשים'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="relative">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                מיקום
              </label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="תל אביב, ירושלים..."
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-500/50 shadow-lg hover:shadow-xl"
              >
                חיפוש
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}
