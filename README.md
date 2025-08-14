<div>

# 🎬 MovieRec

**A modern, responsive movie discovery web application built with React and Vite.**
<br />

</div>

> MovieRec allows users to search for movies, view currently popular films, and see what's trending based on real-time search activity from all users. This project integrates the TMDB API for movie data and Appwrite for backend services.

<br />

---
## 🚀 Live Demo

You can view the live deployment of this project on Vercel.

[**Visit the Live Site →**](https://movierec-gamma.vercel.app)

---

## ✨ Features

* **Dynamic Movie Search:** Quickly find movies by title with a debounced search input for optimal performance.
* **Popular & Trending Lists:** See currently popular movies from the TMDB API and view trending searches based on real-time user activity from the Appwrite database.
* **Backend Integration:** Uses Appwrite to track search term frequency, creating a dynamic list of trending content.
* **Modern & Responsive UI:** Clean user interface built with Tailwind CSS that works great on all screen sizes.

---

## 🛠️ Tech Stack

| Category                 | Technology                                                                       |
| ------------------------ | -------------------------------------------------------------------------------- |
| **Frontend** | [React.js](https://reactjs.org/), [Vite](https://vitejs.dev/)                     |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/)                                         |
| **Backend as a Service** | [Appwrite](https://appwrite.io/)                                                 |
| **Movie Data API** | [The Movie Database (TMDB)](https://www.themoviedb.org/documentation/api)        |
| **Libraries** | [react-use](https://github.com/streamich/react-use) (for debouncing)             |

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### 1. Clone the Repository

```sh
git clone [https://github.com/supalvasani/movierec.git](https://github.com/supalvasani/movierec.git)
cd movierec

```
### 2. Install Dependencies

This project uses **pnpm** for package management.

```sh
pnpm install

```
### 3. Set up Environment Variables

Create a file named `.env.local` in the root of the project. Copy the example below and replace the placeholder values with your actual API keys and IDs.

```env
# .env.local

VITE_TMDB_API_KEY="your_tmdb_api_key_here"
VITE_APPWRITE_PROJECT_ID="your_appwrite_project_id_here"
VITE_APPWRITE_DATABASE_ID="your_appwrite_database_id_here"
VITE_APPWRITE_COLLECTION_ID="your_appwrite_collection_id_here"

```
### 4. Run the Development Server

```sh
pnpm run dev
