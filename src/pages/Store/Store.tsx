import React from "react";
import storeLogo from "../../assets/storeLogo.avif";
import { Link } from "react-router-dom";

const Store = () => (
  <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
    {/* Header */}
    <header className="w-full flex flex-col md:flex-row items-center justify-between p-6 bg-gray-800 gap-4">
      <div className="flex items-center gap-4">
        <img
          src={storeLogo}
          alt="ArtSpace Chicago Logo"
          className="h-20 w-20 rounded-full border-4 border-white bg-white object-contain"
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            ArtSpace Chicago
          </h1>
          <p className="text-base text-gray-300">Art Gallery & Art School</p>
          <button className="mt-2 px-3 py-1 bg-gray-700 text-white rounded hover:bg-pink-600 transition">
            Get In Touch
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center md:items-end gap-2">
        <div className="text-gray-300 text-sm">artspacechicago@gmail.com</div>
        <div className="text-gray-300 text-sm">
          3418 W Armitage Ave Logan Square
        </div>
        <div className="flex gap-3 mt-2">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="hover:text-white"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 5 3.657 9.127 8.438 9.877v-6.987h-2.54v-2.89h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.632.771-1.632 1.562v1.875h2.773l-.443 2.89h-2.33v6.987C18.343 21.127 22 17 22 12z" />
            </svg>
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:text-white"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3.25a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5zm5.25.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
            </svg>
          </a>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          If you want to see what's going on in the studio today.. Check out our
        </div>
      </div>
    </header>

    {/* Navigation */}
    <nav className="w-full flex flex-wrap justify-center gap-6 py-3 bg-gray-900 text-lg font-medium border-b border-gray-700">
      <Link to="/" className="hover:text-pink-400">
        Home
      </Link>
      <Link to="/store" className="hover:text-pink-400">
        Store
      </Link>
      <Link to="/book" className="hover:text-pink-400">
        Book Online
      </Link>
      <Link to="/private-lessons" className="hover:text-pink-400">
        Private Lessons
      </Link>
      <Link to="/gallery-events" className="hover:text-pink-400">
        Gallery Events
      </Link>
      <Link to="/more" className="hover:text-pink-400">
        More
      </Link>
    </nav>

    {/* Hero Section */}
    <section className="flex flex-col items-center justify-center flex-1 py-16 bg-pink-100 text-gray-900">
      <h2 className="text-5xl font-extrabold mb-4 text-center">
        ArtSpace Chicago
      </h2>
      <div className="text-lg mb-2 text-center">
        3418 W Armitage Ave
        <br />
        Chicago, IL 60647
      </div>
      <a
        href="mailto:artspacechicago@gmail.com"
        className="text-blue-600 underline mb-6"
      >
        artspacechicago@gmail.com
      </a>
      <div className="flex gap-4 mb-8">
        <Link
          to="/store/art"
          className="px-6 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
        >
          Art Gallery
        </Link>
        <Link
          to="/store/classes"
          className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
        >
          Classes and Events
        </Link>
      </div>
    </section>

    {/* Footer */}
    <footer className="bg-gray-800 text-gray-400 py-6 text-center mt-auto">
      <div className="mb-2">
        <a href="https://facebook.com" className="mx-2 hover:text-white">
          Facebook
        </a>
        <a href="https://instagram.com" className="mx-2 hover:text-white">
          Instagram
        </a>
      </div>
      <div>
        © {new Date().getFullYear()} ArtSpace Chicago. All rights reserved.
      </div>
    </footer>
  </div>
);

export default Store;
